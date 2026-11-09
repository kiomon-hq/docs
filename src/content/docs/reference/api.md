---
title: REST API
description: The HTTP API surface for users — documents, memories, retrieval, search, briefings, workspaces, connectors, billing, and the OpenAI-compatible /v1 endpoints.
---

All API endpoints live under `https://api.kiomon.com` (or your own deployment's URL). Authenticate with a Kiomon API key unless noted:

```http
Authorization: Bearer <api-key>
```

`X-API-Key: <api-key>` is accepted as the same credential. The dashboard uses a session cookie instead, and both credentials reach the same routes.

Public routes (no auth): `GET /` (health), `POST /api/auth/*` (sign-in, sign-up and OAuth callbacks), `POST /api/billing/webhooks/dodo` (signature-verified), the OAuth authorization server under `/oauth/*` and its `/.well-known/*` metadata.

## Conventions

| Topic | Behaviour |
|---|---|
| Body format | JSON. `Content-Type: application/json`. |
| Workspace scope | Pass `workspace_id` (query on GET, body on POST/PATCH). Absent, the request uses the credential's default workspace — the caller's first workspace, or the key's single grant. A key with several grants must name one. |
| Pagination | List routes accept `limit` and `offset` and answer with `limit`, `offset`, `total` where supported (`/api/documents`, `/api/memories`). Search accepts `limit` only. |
| Errors | `{ "error": "message", "code": "machine_code" }`. `/v1/*` uses the OpenAI error envelope instead. |
| Idempotency | Send `Idempotency-Key: <value>` on a mutating `/api/*` request to make a retry replay the first response (24-hour window) instead of repeating the write. Excluded: `/v1/*`, the streaming routes (`/api/rag/ask`, `/api/agent/chat`), and webhooks. |
| Rate limits | Per plan and per route (`429` with a message when exceeded). |

### Error codes

| Status | Meaning |
|---|---|
| `400` | Invalid request (validation message included) |
| `401` | Missing / invalid credential |
| `402` | Plan limit reached (`code: "quota_exceeded"`, `needsUpgrade: true`) |
| `403` | Authenticated but not allowed (`insufficient_role`, `connector_scope_denied`) |
| `404` | Not found — a workspace you cannot reach reports 404, never 403 |
| `409` | State conflict: `conflict`, `duplicate`, or an idempotency problem (`idempotency_conflict` for the same key with a different body, `idempotency_in_progress` while the first request runs) |
| `429` | Rate limit exceeded |
| `502` | A processing service failed |
| `503` | A required service is not configured in this environment |

## Documents — `/api/documents`

| Method & path | Purpose |
|---|---|
| `POST /` | Ingest a document: `{ body, title?, source_url?, excerpt?, tags?, kind?, workspace_id? }`. Quota-checked. Answers `201 { id, tags }`, or `200 { duplicate: true, id }` when the URL is already saved. |
| `GET /check` | Dry-run: `?url=` — is this URL already saved? |
| `GET /` | List documents: `status`, `kind`, `source`, `tag`, `q`, `type`, `since`, `sort`, `limit`, `offset`. |
| `GET /:id` | Fetch a document (metadata + body). |
| `PATCH /:id` | Update `title`, `excerpt`, `body`, `tags`, `pinned`, `user_notes`, `source`, `kind`. Re-indexed when the searchable surface changes. |
| `DELETE /:id` | Delete one document. |
| `DELETE /bulk` | Bulk delete: `{ ids: [...] }`. |
| `POST /:id/archive` | Hide from retrieval and lists (recoverable). |
| `POST /:id/restore` | Bring an archived document back. |
| `POST /:id/forget` | Permanent purge from storage and search. |
| `POST /:id/retry` | Re-dispatch a document stuck mid-processing. |
| `POST /:id/rate` | Feedback: `{ rating: 1 \| -1 }`. Feeds strength. |
| `POST /:id/approve` | Approve a pending memory draft → active. |
| `POST /:id/reject` | Reject a pending draft → archived. |
| `GET /:id/links` | Link suggestions (pending/completed) with scores. |
| `POST /:id/link` | Manually link two documents: `{ target_id, relation? }`. |
| `DELETE /:id/links/:targetId` | Unlink. |

### The upload lane (files)

For files rather than text, the bytes never pass through Kiomon's API: it signs a URL and the client PUTs to storage directly.

| Method & path | Purpose |
|---|---|
| `POST /upload-url` | Reserve quota and sign an upload: `{ filename, size_bytes, content_type?, replace?, workspace_id? }` → `201 { id, upload_url, key, expires_at }`. `409`-shaped duplicates answer `200 { duplicate: true, id, stuck, replaceable }`. |
| `POST /:id/upload-complete` | Confirm the PUT finished; starts conversion → chunking → embedding. |

Supported formats are decoded by the processing service: PDF, Markdown, plain text, HTML, and
recordings (transcribed and, for a meeting, extracted into decisions and action items).

Two identities, both optional and both stronger than the name-and-size match that runs without
them: `content_sha256` ("are these the same bytes?", verified by storage) and `external_id` ("is
this the same item?", which makes a re-ingest an update in place). Large files upload in parts and
confirm with **no body**; batches carry per-item results. The full rules — including what a
`409` means and when a retry is safe — are in [The Ingest Contract](/reference/ingest/).

## Memories — `/api/memories`

| Method & path | Purpose |
|---|---|
| `POST /batch-draft` | Agent-facing write: 1–25 `learnings[]` with `kind`/`title`/`body` (+ `excerpt`, `confidence`, `tags`, `source_refs`, `entities`, `claims`, `domain`) become `pending_approval` drafts or auto-activate through the write gate. `workspace_id` optional only when the credential resolves to a single workspace. |
| `GET /` | List memories. `status` (default `pending_approval` = the Review Inbox; `active`, `archived`, `all`), `kind` (one or a comma-separated set), `q`, `limit`, `offset`. |
| `GET /decisions` | The "Kiomon's decisions" feed: recent autonomous write-gate actions with reasons and revert flags. |
| `GET /entity-aliases` | Pending entity-merge proposals. |
| `POST /entity-aliases/:id/accept` | Merge the alias into its canonical key. |
| `POST /entity-aliases/:id/dismiss` | Keep them separate (not re-proposed). |
| `POST /entity-aliases/revert` | Undo a merge by `{ alias_key }`. |
| `POST /:id/revert` | Undo a write-gate decision for one memory. |
| `POST /record-outcome` | Credit attribution: `{ outcome: "success" \| "failure", items: [{ memory_id, assessment }] }` with `assessment` in `helpful`, `unused`, `misleading`, `outdated`. Strengthens or weakens the cited memories. |

## Retrieval — `/api/retrieve`

`POST /api/retrieve` — the read surface agents should prefer over search. It returns a decision-ready **ContextPacket** rather than a list of hits.

```json
{
  "intent": "execute",
  "query": "how do prod deploys work?",
  "entities": ["deploy.yml"],
  "constraints": ["no operator available"],
  "kinds": ["semantic", "procedural"],
  "workspace_id": "ws_…",
  "risk_level": "medium",
  "limit": 6
}
```

`intent` is required: `execute` | `plan` | `answer` | `verify` | `debug`. The reply carries `summary`, `facts[]`, an optional `procedure`, `episodes[]`, `evidence[]`, `warnings[]`, `conflicts[]`, and `retrieved_ids[]` (pass those to `record-outcome`). `constraints` are current-state hints used for applicability and are never persisted.

## Search — `/api/search`

`GET /api/search?q=<query>&limit=<n>&workspace_id=<ws>&kind=<kind>`

Hybrid keyword + semantic search: both result sets are fused into one ranking. Rate-limited per plan.

## Graph — `/api/graph`

`GET /api/graph` — nodes and edges for a workspace, with link statuses and scores.

| Query | Purpose |
|---|---|
| `workspace_id` | Workspace scope. |
| `center_id` | Ego subgraph around one memory. |
| `depth` | `1` (default) or `2` hops. |
| `relation` | Filter edges by relation. |
| `status` | Memory-status filter. |
| `limit` / `all` | Node budget, or the whole graph. |

## Briefings — `/api/workspaces/:workspaceId`

| Method & path | Purpose |
|---|---|
| `GET /briefings` | Paginated edition history (`limit`, `offset`). |
| `GET /briefings/latest` | Most recent edition (any status) — `{ briefing }` or `{ briefing: null }`. |
| `GET /briefings/:briefingId` | One edition with its payload. |
| `POST /briefings/generate` | Generate an edition on demand (`?force=1` to regenerate). Rate-limited. |
| `PATCH /briefings/:briefingId` | Mark read / per-pillar feedback. |
| `DELETE /briefings/:briefingId` | Delete an edition. |
| `POST /action-items/:actionItemId/close` | Check off a commitment. |
| `POST /briefings/links` | Draft a link suggestion. |
| `POST /briefings/links/:linkId/accept` | Accept it (writes the real edge). |
| `DELETE /briefings/links/:linkId` | Dismiss it. |

## Workspaces — `/api/workspaces`

| Method & path | Purpose |
|---|---|
| `GET /` | List workspaces. A scoped key (org service key, or a personal key with grants) lists **only the workspaces it is granted**, with `my_role` derived from the grant. |
| `POST /` | Create (`{ name, org_id? }`; plan-gated). |
| `PATCH /:id` | Rename (owner-only). |
| `DELETE /:id` | Delete a workspace and its contents (owner-only). |
| `GET /:id/members` | Workspace members. |
| `GET /:id/org-members` | Org members not yet in the workspace. |
| `POST /:id/members` | Add a member. |
| `PATCH /:id/members/:userId` | Change a role. |
| `DELETE /:id/members/:userId` | Remove a member. |
| `GET /:id/context` | Pre-flight context pack (pinned, Routines, topic Facts, stats, review state) — the same shape the MCP `get_workspace_context` returns. `?topic=` narrows the Facts. |
| `PATCH /:id/review-mode` | `{ review_mode: "autonomous" \| "review" }` — the per-workspace write gate. |

## Connectors — `/api/connectors`

Connectors are **Pro-only**. `POST /`, `POST /:id/sync`, `GET /:id/confluence/spaces`, and `POST /connections/:id/google/token` return `402 { code: "pro_required", needsUpgrade: true }` on a Free billing entity. `GET /` stays readable and reports `locked` so the dashboard can render the gate.

| Method & path | Purpose |
|---|---|
| `GET /` | List connectors (`{ connectors, locked }`). |
| `POST /` | Create (OAuth flow starter). |
| `GET /connections` | List OAuth connections. |
| `DELETE /connections/:id` | Disconnect (revokes access). |
| `POST /connections/:id/google/token` | Short-lived Drive token for the picker. |
| `PATCH /:id` | Update sync config (spaces, folders, label). |
| `DELETE /:id` | Remove a connector. |
| `GET /:id/confluence/spaces` | Confluence spaces for selection. |
| `POST /:id/sync` | Trigger a manual sync run. |

## Inbound capture — `/api/inbound`

| Method & path | Purpose |
|---|---|
| `GET /address` | Your capture address (`{ address }` or null). |
| `POST /address` | Create it: `{ workspace_id? }`. Idempotent. |
| `DELETE /address` | Revoke it. |

Mail sent to the address is ingested into the workspace as a `reference` document (meeting-shaped mail becomes an `episodic` Moment).

## Connected apps — `/api/connected-apps`

Session-only (a connector cannot manage itself).

| Method & path | Purpose |
|---|---|
| `GET /` | Apps you have authorized over OAuth, with the scope granted. |
| `DELETE /:clientId` | Revoke one. |

## Account — `/api/user`

| Method & path | Purpose |
|---|---|
| `GET /settings` | Read settings. |
| `PATCH /settings` | Update settings. |
| `PATCH /profile` | Update profile. |
| `POST /avatar` | Upload an avatar. |
| `DELETE /account` | Delete the account and all its data. |
| `GET /usage` | Live usage counters (documents, storage, API calls). |
| `GET /stats` | Aggregate statistics. |
| `GET /stats/historical` | Historical metrics for the Insights page. |

## API keys — `/api/keys`

A key is either **personal** (`type` omitted) or an **organization service key** (`type: "organization"` + `org_id`, admin-only). Either may carry **workspace grants** (`workspace_ids` + `permission: "read" | "write"`): a key with grants may reach *only* those workspaces, with `read` mapping to a viewer role and `write` to an editor role.

| Method & path | Purpose |
|---|---|
| `GET /` | List keys you can manage (id, prefix, label, tier, grants count, owner metadata). |
| `POST /` | Create: `{ label?, type?, org_id?, workspace_ids?, permission?, expires_at?, service_account? }`. The full key is returned **once**. Plan-gated per billing entity (2 free / 25 pro / 50 enterprise). |
| `GET /:id/grants` | List a key's workspace grants. |
| `POST /:id/grants` | Add a grant: `{ workspace_id, permission }`. |
| `DELETE /:id/grants/:wsId` | Remove a grant. |
| `GET /:id/activity` | The key's request audit log. |
| `DELETE /:id` | Revoke immediately. |

## Billing — `/api/billing`

| Method & path | Purpose |
|---|---|
| `POST /webhooks/dodo` | **Public.** Payment provider webhook, signature-verified. |
| `GET /subscription` | Current plan, status, period end. |
| `POST /sync` | Re-sync subscription state. |
| `POST /checkout` | Create a hosted checkout session. |
| `POST /verify` | Server-side verification of a checkout return. |
| `POST /portal` | Open the customer billing portal. |
| `POST /portal-sync` | Refresh state after returning from the portal. |

## Organizations — `/api/orgs`

| Method & path | Purpose |
|---|---|
| `GET /` · `POST /` · `GET /:id` · `PATCH /:id` · `DELETE /:id` | Lifecycle (creation, rename, delete). |
| `POST /:id/transfer` | Transfer ownership. |
| `GET /:id/members` · `PATCH /:id/members/:userId` · `DELETE /:id/members/:userId` | Membership and roles (`owner`, `admin`, `member`). |
| `POST /:id/invites` · `GET /:id/invites` · `POST /:id/invites/:inviteId/resend` · `DELETE /:id/invites/:inviteId` | Invitations. |
| `POST /accept` | Accept an invitation (`{ token }`). |
| `GET /:id/billing` · `POST /:id/billing/checkout` · `POST /:id/billing/seats` · `POST /:id/billing/portal` · `POST /:id/billing/portal-sync` | Org billing. |

## OpenAI-compatible — `/v1`

Point any OpenAI SDK at `https://api.kiomon.com/v1` with a Kiomon API key as the bearer token.

| Method & path | Purpose |
|---|---|
| `GET /v1/models` | `kiomon-rag`, `kiomon-embed`. |
| `POST /v1/chat/completions` | Grounded chat over your library (stream + non-stream, citations). `workspace_id` selects the workspace; `scope: "organization"` searches every workspace in the org the key can reach. |
| `POST /v1/embeddings` | Embed text with Kiomon's semantic model (`float` or `base64`). |
| `GET /v1/context` | Non-standard extension: the principal's orgs, reachable workspaces, roles, and default workspace — discover the workspace ids before calling chat. |
| `POST /v1/memories/batch` | Up to 100 memories in one request: `op` (`create`/`upsert`/`patch`), `item_id` replay, `external_id` upsert, `content_sha256` → `unchanged`, `dry_run`, `approval`, `processing: grouped`/`instant`. One result per item. |
| `POST /v1/documents/batch` | Up to 100 text documents, or up to 25 URLs for Kiomon to fetch. Same verbs, identities and envelope as the memory batch. |
| `GET /v1/batches/:id` | A batch's manifest joined to each document's live pipeline state (upload, memory and document batches alike), plus `status` and `counts` derived from those items once every item has a settled one. `pending_approval` is re-read from the row, so a batch approved after the write stops reporting itself as pending. `GET /v1/ingest/batches/:id` answers the same. |
| `POST /v1/imports` | Reserve a JSONL import and get a presigned `PUT`: the >100 tier. `kind` is `memory` or `document`. |
| `GET /v1/imports/:id` | The import's live state: status, byte progress, counts (the write ledger), `pending_batches` (batches still undecided — the cursor `approve` counts down), and the first 100 refused lines. |
| `POST /v1/imports/:id/start` | Check the uploaded object and start processing the first chunk. Once, and only while `awaiting_upload`. |
| `POST /v1/batches/:id/approve` | Approve a batch's pending items as one decision — each promoted through the same seam as the single-row approve. |
| `POST /v1/imports/:id/approve` | Approve one page of an import's pending items (≤ 500), with `remaining_batches` and `next_url` as the cursor. |
| `POST /v1/imports/:id/cancel` | Stop at the next chunk boundary; what already landed stays and is counted. |
| `POST /v1/batches/:id/retry` | Re-dispatch the items still stranded in a stage (`queued`/`chunked`); answers one result per item, including `not_retryable` for refusals and terminal failures. |

## OAuth authorization server — `/oauth/*`

Kiomon is the OAuth 2.0 authorization server for the hosted MCP endpoint. Discovery lives at `/.well-known/oauth-authorization-server`; the MCP endpoint publishes `/.well-known/oauth-protected-resource`.

| Method & path | Purpose |
|---|---|
| `POST /oauth/register` | Dynamic client registration (RFC 7591). |
| `GET /oauth/authorize` | Consent screen (session-authenticated; unauthenticated callers are sent to sign-in). |
| `POST /oauth/authorize` | Approve/deny the request. |
| `POST /oauth/token` | Authorization-code + PKCE exchange, and refresh. |
| `POST /oauth/revoke` | Revoke an access or refresh token. |

An access token issued here is a narrow credential: it reaches only the memory routes (`/api/workspaces`, `/api/documents`, `/api/memories`, `/api/retrieve`, `/api/search`, `/api/graph`) and is refused everywhere else (`403 connector_scope_denied`). Scopes are `memory:read` and `memory:write`.

## Auth — `/api/auth/*`

Sign-in, sign-up, OAuth callbacks and sessions. The dashboard talks to these directly.
