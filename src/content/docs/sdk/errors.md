---
title: Errors & Retries
description: The SDK's failure contract, every error code and what to do about it, automatic retries, and idempotent writes.
---

## The failure contract

Two kinds of failure, deliberately distinguished so you always know which one you are handling:

| Kind | Behaviour | Why |
|---|---|---|
| **Bad argument** | **Throws synchronously** | A programming error surfaces at the call site, never inside a promise chain. |
| **Anything remote** — auth, quota, transport, a 5xx | **Rejects** with a `KiomonError` | These are conditions to handle, not bugs to fix. |

```ts
// Throws immediately — no request is made.
kiomon.searchMemory({ query: "   " });

// Rejects — the request was made and failed.
await kiomon.searchMemory({ query: "vector index tradeoffs" });
```

Everything the SDK validates locally is listed in
[the reference](/sdk/reference/#what-is-validated-locally). Those failures are cheap: the SDK mirrors
the server's own validation, so a mistake costs zero round trips.

## `KiomonError`

```ts
import { KiomonError, isKiomonError } from "@kiomon/kiomon";

try {
  await kiomon.retrieveMemory({ intent: "plan", query: "q" });
} catch (error) {
  if (!isKiomonError(error)) throw error;   // not ours — do not swallow it

  error.code;          // "quota_exceeded"
  error.status;        // 402  (0 when the request never reached the server)
  error.message;       // human text from the API
  error.needsUpgrade;  // true
  error.retryable;     // false
  error.requestId;     // from x-request-id, when the API sent one
  error.body;          // the raw response body, for debugging — not for control flow
}
```

| Member | Type | Notes |
|---|---|---|
| `code` | `KiomonErrorCode` | The stable identifier. Branch on this, never on `message`. |
| `status` | `number` | HTTP status, or `0` if the request never left the client. |
| `needsUpgrade` | `boolean` | `true` on a plan limit. Drives an upgrade prompt, not a retry. |
| `retryable` | `boolean` (getter) | Whether retrying the same request could plausibly succeed. |
| `requestId` | `string \| undefined` | Include this when contacting support. |
| `body` | `unknown` | Raw body. Useful in logs, unsafe for logic. |

## Codes

| Code | Status | What it means | What to do |
|---|---|---|---|
| `bad_request` | 400 | Malformed request | Fix the request. |
| `validation_failed` | 400 | The shape was wrong (schema validation) | Fix the request. |
| `payload_too_large` | 413 | Body over the limit | Send less; large documents are offloaded server-side. |
| `duration_too_long` | 400 | A recording longer than the transport can process | Cut the recording, or use a plan/transport that carries it. The bytes were fine. |
| `unauthorized` | 401 | Missing, revoked or expired credential | Check `apiKey` / `token`, or reissue the key. |
| `account_pending_deletion` | 401 | The account is mid-deletion | Not a key problem — reissuing a key will not help. |
| `forbidden` | 403 | The credential lacks permission | Check the key's workspace grant. |
| `insufficient_role` | 403 | The role or grant is too low for this verb | A read-only grant cannot write. Widen the grant. |
| `connector_scope_denied` | 403 | A delegated OAuth token reached outside the memory routes | Use a server-side API key for non-memory endpoints. |
| `not_found` | 404 | Not available **to you** — see below | Treat as unavailable; do not retry. |
| `conflict` | 409 | The request conflicts with current state | Re-read, then decide. |
| `duplicate` | 409 | Already exists | Nothing to do; not retryable. |
| `idempotency_conflict` | 409 | Same `Idempotency-Key`, **different** body | A client bug. Use a new key per distinct request. |
| `idempotency_in_progress` | 409 | Same key, first attempt still running | Wait for it to finish, then retry the same key. |
| `quota_exceeded` | 402 | Plan quota reached · `needsUpgrade: true` | Prompt for an upgrade. Do not retry. |
| `pro_required` | 402 | Feature is Pro-only · `needsUpgrade: true` | Prompt for an upgrade. Do not retry. |
| `rate_limited` | 429 | Too many requests in the window · `needsUpgrade: false` | Retryable — the SDK already does. |
| `service_unavailable` | 5xx | Upstream or edge failure | Retryable. |
| `internal_error` | 500 | The API failed unexpectedly | Retryable. |
| `invalid_request` | — | **Raised by the SDK**: a bad argument | Fix the code; thrown synchronously. |
| `timeout` | 504 | **Raised by the SDK**: no response within `timeoutMs` | Retryable. |
| `network_error` | — | **Raised by the SDK**: could not reach the API, or you aborted | Retryable for connection failures. |
| `unknown` | — | A code newer than this SDK version | Log it; do not crash. |

:::caution[`not_found` does not mean "does not exist"]
The API fails closed with **404 rather than 403** when you lack access, on purpose: a 403 would
confirm that a resource exists. So a `not_found` means *"not available to you"* — a deleted memory,
an archived one, **or** a workspace you cannot see. Never use it to infer existence.
:::

:::note[A server code always wins]
If the response carries a `code`, the SDK uses it verbatim — including codes this version has never
heard of, which is why `unknown` exists as a type-level backstop. The status-derived table above is
only the fallback for responses without one, and it is kept identical to the API's own fallback so
the same response never resolves to two different codes.
:::

## Retries

Reads retry automatically; writes retry **with the same idempotency key**, which is what makes
retrying them safe.

| Retried | Not retried |
|---|---|
| `rate_limited`, `internal_error`, `service_unavailable`, `timeout`, `network_error` | `unauthorized`, `forbidden`, `insufficient_role`, `not_found`, `conflict`, `duplicate`, `idempotency_conflict`, `idempotency_in_progress`, `quota_exceeded`, `pro_required`, and every `4xx` argument error |

Backoff is exponential with jitter — 250 ms, 500 ms, 1 s, capped at 4 s, plus up to 100 ms of
jitter. If the error body carries a `retry_after` value in seconds (up to 30 s), that is respected
instead. `maxRetries` defaults to **2**, settable per client or per call.

```ts
const kiomon = new Kiomon({ apiKey, maxRetries: 5 });
await kiomon.searchMemory({ query: "x" }, { maxRetries: 0 });   // this call only
```

:::note[The API does not currently send `Retry-After`]
The SDK is ready for a `retry_after` hint in the body, but the API does not send one — and it does
not need to, because the SDK calculates backoff itself. Treat the hint as a forward-compatible path
rather than something you can rely on arriving.
:::

## Idempotent writes

Every **write** carries an `Idempotency-Key` — generated per call, reused across retries — so a
replayed request cannot apply twice. The server stores the first response for 24 hours and returns it
verbatim to a retry, with an `Idempotency-Replayed: true` header.

```ts
// The SDK generates the key for you. Pass your own when a retry might come
// from a *different* process — a queue worker, a cron job, a second server.
await kiomon.reflectSession({ learnings }, { idempotencyKey: `session-${sessionId}` });
```

Two consequences worth designing around:

- **Keys are scoped to your user**, so two tenants can use the same key string without colliding.
- **Reusing a key for a different body is rejected** with `idempotency_conflict` rather than guessed
  at. Generate a key per *logical* write, not per HTTP attempt.
- A `5xx` is **not** cached: the server releases the key instead, so your retry is a genuine first
  attempt rather than a stored failure.

`retrieveMemory` and the other reads are naturally idempotent and do not send a key.
