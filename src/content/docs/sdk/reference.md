---
title: SDK Reference
description: Client options, all 12 memory verbs with their TypeScript signatures, the shapes they return, and per-call options.
---

The SDK mirrors Kiomon's hosted MCP toolset method for method. **Arguments use the same names as the
wire format and the MCP tools** (`workspace_id`, `memory_id`, `source_refs`), so an SDK call can be
diffed against its MCP equivalent, and the semantics documented on
[the MCP server page](/integrations/mcp-server/#the-tools) apply here unchanged.

## Client options

```ts
const kiomon = new Kiomon({
  apiKey: process.env.KIOMON_API_KEY!,
  workspaceId: "ws_…",   // optional
});
```

| Option | Type | Default | Notes |
|---|---|---|---|
| `apiKey` | `string` | — | Sent as `X-API-Key`. Server-side integrations. |
| `token` | `string \| () => string \| Promise<string>` | — | Sent as `Authorization: Bearer`. A function is resolved **per request**, so token refresh needs no rebuild. |
| `workspaceId` | `string` | — | Default workspace. Omit to resolve automatically. |
| `baseUrl` | `string` | `https://api.kiomon.com` | Trailing slashes are stripped. |
| `timeoutMs` | `number` | `60_000` | Per-request budget. A timeout raises `timeout`. |
| `maxRetries` | `number` | `2` | Applies only to retryable failures. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Injectable for tests and non-standard runtimes. |
| `headers` | `Record<string, string>` | `{}` | Added to every request. |
| `agentId` | `string` | `"sdk"` | Sent as `X-Agent-Id` and attributed in Kiomon's telemetry. |

Pass **either** `apiKey` or `token`, not both — the wire format differs and only one can be sent.
The constructor throws immediately (synchronously) if neither is given, if both are, or if no
`fetch` implementation is available.

`kiomon.workspaceId` returns the workspace calls default to, once one has been selected or
resolved.

## The 12 verbs

| Method | Signature | Returns |
|---|---|---|
| `retrieveMemory` | `(args: RetrievalArgs, options?)` | `ContextPacket` |
| `searchMemory` | `(args: SearchArgs, options?)` | `SearchResponse` |
| `getMemory` | `(id: string, options?)` | `MemoryDocument` |
| `getWorkspaceContext` | `(args?: { workspace_id?, topic? }, options?)` | `WorkspaceContext` |
| `getLatestBriefing` | `(args?: { workspace_id? }, options?)` | `JsonObject` |
| `reflectSession` | `(args: { workspace_id?, learnings }, options?)` | `BatchDraftResult` |
| `draftMemory` | `(learning: ReflectLearning, args?: { workspace_id? }, options?)` | `BatchDraftResult` |
| `manageMemory` | `(args: { id, action, value? }, options?)` | `JsonObject` |
| `exploreMemoryGraph` | `(args: { id, relation?, depth? }, options?)` | `GraphResult` |
| `recordOutcome` | `(args: { outcome, items, workspace_id? }, options?)` | `JsonObject` |
| `listWorkspaces` | `(options?)` | `{ workspaces: Workspace[] }` |
| `selectWorkspace` | `(id: string)` | `this` (synchronous, chainable) |

### `retrieveMemory` — the one to reach for first

Intent-aware retrieval. Declare what you are doing and receive a decision-ready packet re-ranked by
**applicability** rather than raw similarity.

```ts
const packet = await kiomon.retrieveMemory({
  intent: "execute",              // execute | plan | answer | verify | debug
  query: "how do we rotate the signing key?",
  entities: ["signing key"],
  constraints: ["current key expires at the end of the month"],
  kinds: ["procedural", "semantic"],
  risk_level: "high",
  limit: 6,                       // 1–20
});
```

| Param | Type | Required | Notes |
|---|---|---|---|
| `intent` | `RetrievalIntent` | ✅ | `execute`, `plan`, `answer`, `verify`, `debug` |
| `query` | `string` | ✅ | Keywords, phrases, or natural language |
| `entities` | `string[]` | — | Entities the task concerns |
| `constraints` | `string[]` | — | Current-state hints for applicability. Never persisted. |
| `kinds` | `MemoryKind[]` | — | `semantic`, `procedural`, `episodic`, `reference` |
| `workspace_id` | `string` | — | Defaults to the client's workspace |
| `risk_level` | `RiskLevel` | — | `low`, `medium`, `high` |
| `limit` | `number` | — | 1–20. Validated locally. |

`ContextPacket` is the shape worth knowing:

```ts
interface ContextPacket {
  summary: string;
  facts: PacketItem[];        // kind, claim, confidence, authority, applicability, source_ref
  procedure?: PacketItem;     // the single best procedure, when one applies
  episodes: PacketItem[];
  evidence: { memory_id: string; source_uri?: string; source_span?: string }[];
  warnings: string[];         // instructions to honour, not decoration
  conflicts: { memory_id_a: string; memory_id_b: string; note: string }[];
  retrieved_ids: string[];    // pass these straight to recordOutcome
}
```

:::tip[Surface `warnings` and `conflicts`]
They are the difference between a retrieval layer and a search box: the brain telling you where it
is unsure or where two memories disagree. Silently taking `facts[0]` throws that away.
:::

### `searchMemory`

Hybrid keyword + semantic search when you want raw hits rather than a packet.

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | `string` | ✅ | Validated locally as non-empty |
| `kind` | `MemoryKind` | — | Filter by memory kind |
| `workspace_id` | `string` | — | Defaults to the client's workspace |
| `limit` | `number` | — | Default 10 |

### `reflectSession` and `draftMemory`

Batch and single-item writes through the autonomous write gate. `reflectSession` accepts **1–25**
learnings per call; `draftMemory` is the same thing for one.

| Learning field | Required | Notes |
|---|---|---|
| `kind` | ✅ | `semantic` (a fact), `procedural` (a routine), `episodic` (a moment) |
| `title` | ✅ | Short title |
| `body` | ✅ | Full content |
| `excerpt` | — | Card subheading shown under the title |
| `confidence` | — | 0–1. `>= 0.75` may activate immediately, unless the workspace uses review mode. |
| `tags` | — | |
| `source_refs` | — | IDs of memories this was derived from; wired as `derived_from` on activation |
| `entities`, `claims`, `domain` | — | **Supply these.** They make the memory immediately searchable and skip a paid extraction pass. |

Unlike the MCP tools, `workspace_id` is **optional** here — the SDK resolves it (see
[Workspaces](/sdk/#workspaces)).

`BatchDraftResult` reports what the gate decided:

```ts
interface BatchDraftResult {
  drafted: number;
  promoted: string[];          // ids the gate activated immediately
  pending: string[];           // ids awaiting review in the dashboard
  memories: { id: string; title: string; kind: string }[];
  review_inbox_url?: string;   // link to triage the pending ones
}
```

### `manageMemory`

One method rather than nine, mirroring the MCP tool.

| Param | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | The memory |
| `action` | `ManageAction` | ✅ | `pin`, `unpin`, `archive`, `restore`, `forget`, `rate`, `approve`, `reject`, `revert` |
| `value` | `number` | only for `rate` | `1` (useful) or `-1` (not useful) |

`forget` is a permanent purge; everything else is recoverable. `approve` promotes a pending draft,
`reject` archives it, and `revert` undoes a write-gate decision. Action and `value` are validated
locally.

### `recordOutcome`

Reports how retrieved memories actually performed, which is what lets the brain re-rank and decay
honestly. Call it after acting on a packet.

| Param | Type | Required | Notes |
|---|---|---|---|
| `outcome` | `"success" \| "failure"` | ✅ | Task end state |
| `items` | `{ memory_id: string; assessment: string }[]` | ✅ | Validated locally as non-empty |
| `workspace_id` | `string` | — | Defaults to the client's workspace |

The `assessment` values the brain understands, and what each does:

| Assessment | Effect |
|---|---|
| `helpful` | Used and helped — `+1` feedback, raises confidence |
| `unused` | Retrieved but not needed — small penalty |
| `misleading` | Used and caused an error — confidence × 0.85, logs failure evidence |
| `outdated` | Stale or expired — triggers expiration |

Do not guess, and do not send an assessment for a memory you did not evaluate: omitted memories stay
untouched.

### `getMemory`, `getWorkspaceContext`, `exploreMemoryGraph`, `getLatestBriefing`, `listWorkspaces`

- **`getMemory(id)`** — one memory in full, with its graph relations.
- **`getWorkspaceContext({ topic? })`** — one-shot orientation: pinned memories, active routines,
  topic-relevant facts, workspace stats, and any pending Review Inbox items.
- **`exploreMemoryGraph({ id, relation?, depth? })`** — multi-hop traversal from a starting memory.
  `depth` is 1 or 2; `relation` narrows the edge type.
- **`getLatestBriefing()`** — the workspace's most recent weekly briefing.
- **`listWorkspaces()`** — every workspace this credential can reach, with roles and counts.

## Returned shapes

Fields are the wire format, not a rewrite of it.

```ts
interface SearchHit {
  id: string;
  title: string | null;
  source_url: string;
  excerpt: string | null;
  snippet: string;          // query-matched fragment
  tags: string | null;      // a JSON string, not an array
  created_at: string;
  source?: string | null;
  type?: string | null;
  kind?: string;
}

interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  org_id?: string | null;
  created_at: string;
}
```

`MemoryDocument` carries the full memory envelope — `kind`, `confidence`, `strength`,
`corroboration_count`, `retrieval_count`, `feedback_score`, `status` and the rest. Note that `tags`
arrives as a JSON **string** rather than an array: that is the stored shape, passed through rather
than silently reshaped.

`GraphResult`, `WorkspaceContext`, briefings and the write-gate acknowledgements are typed as
`JsonObject` (`Record<string, unknown>`) deliberately: their shapes are not yet a stable public
contract, and a precise-looking type that drifts would be worse than an honest one.

## Per-call options

Every verb takes an optional last argument:

```ts
await kiomon.reflectSession({ learnings }, { idempotencyKey: `session-${sessionId}` });
```

| Option | Type | Notes |
|---|---|---|
| `idempotencyKey` | `string` | Pass your own when a retry could originate from a **different process**. Otherwise the SDK generates one per write. |
| `maxRetries` | `number` | Override the client default for this call only. |
| `requestId` | `string` | Sent as `X-Request-Id`, making a support request traceable. |
| `signal` | `AbortSignal` | Cancel the call. Reports as `network_error`, distinct from a timeout. |

## Escape hatch

Every REST route is reachable, so the SDK never blocks you on a new endpoint:

```ts
const stats = await kiomon.request<{ total: number }>("/api/user/stats");

// With a body or query
await kiomon.request("/api/documents", {
  method: "POST",
  body: { source_url: "https://example.com", workspace_id: "ws_…" },
  query: { dry_run: "true" },
  write: true,   // marks it as a write: gets an idempotency key, retried safely
});
```

Not available for routes outside the memory surface when you authenticated with a delegated OAuth
token — see the [authentication note](/sdk/#authentication).

## What is validated locally

Argument errors are caught **before any network call** and thrown synchronously, so a programming
mistake surfaces at the call site instead of inside a promise chain:

- empty `query` on `searchMemory` / `retrieveMemory`, and empty ids on `getMemory`,
  `exploreMemoryGraph`, `manageMemory`
- `learnings` empty, longer than 25, or missing `kind`, `title` or `body`
  (`confidence` outside 0–1 is rejected too)
- `retrieveMemory`'s `limit` outside 1–20
- an unknown `manageMemory` action, or `rate` without `value` of `1` or `-1`

Everything that can fail for **remote** reasons rejects with a `KiomonError` — see
[Errors & retries](/sdk/errors).
