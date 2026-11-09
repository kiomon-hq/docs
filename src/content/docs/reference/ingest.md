---
title: The Ingest Contract
description: Bytes in, identity, and what a retry means — the rules a client or SDK depends on.
---

Every ingest in Kiomon is the same three steps, whichever transport carries the bytes:

1. **Reserve** — Kiomon decides (format, size, plan, quota, duplicate), creates the document
   row and signs the transport.
2. **Transfer** — the bytes go to storage. Kiomon never sees a client's bytes; a URL fetch is
   the one exception, and there it reads the stream itself.
3. **Confirm** — Kiomon checks what arrived and starts conversion → chunking → embedding.

The order is the contract: a reservation that never receives its upload is released automatically,
and an upload with no confirm is an object no document names.

## Identity

Two ids, and they answer different questions.

| Field | Question it answers | Scope |
|---|---|---|
| `content_sha256` | Are these the **same bytes**? | one workspace |
| `external_id` | Is this the **same item**? | one workspace |

Send either when you have it. Both are optional, both are stronger than the name-and-size match
that runs when you send neither.

### `content_sha256`

Your digest of the file, lowercase hex (a `sha256:` prefix and upper case are accepted). Storage
verifies it against the body, so a declaration that does not describe the bytes is refused rather
than recorded — `400` with `error.code = "checksum_mismatch"`, nothing kept.

Declare it on a single-PUT reservation and the response carries the header you must replay:

```json
{
  "id": "doc_…",
  "upload_url": "https://…",
  "upload_headers": { "x-amz-checksum-sha256": "HBvVYJHJU8BaFSspFj/3cn3P4pA9YKcq8kZbqLwUU/I=" }
}
```

Those headers are **signed into the URL**. Omitting one is a `403` from storage; sending different
bytes is a `400 BadDigest`. Either way the claim never becomes a stored lie — and a repeat of the
same bytes under any name is answered `200 { duplicate: true, id }` **before** you upload.

Known limit: a **multipart** upload has no whole-object checksum in this runtime, so a hash declared
with one is recorded as a claim.

### `external_id`

Your own id for the item — a ticket number, a recording id, a row id. Send the same id twice and
the second ingest **updates that document in place** instead of creating a second one:

| Situation | Answer |
|---|---|
| New id | `201`, the id recorded on the document |
| Same id, same bytes | `200 { duplicate: true, id }` — one query, no conversion |
| Same id, new bytes, document settled | `201` with `update: true`, **the same document id** |
| Same id, bytes another document holds | `200 { duplicate: true, id }` naming **that** document |
| Same id, document mid-processing | `409` + `existing_id` (retry once it settles) |
| Same id, different `type` | `400` — send that file under its own id |

An update keeps the document id — links, bookmarks and your own records stay valid — and replaces
everything derived from the old content. That is what makes a **retried webhook safe**: at-least-once
delivery is a fact about senders, not a mistake by them.

`external_id` also survives a failed conversion, so the retry of a failed item lands on the row your
user is already looking at. Transports can be mixed: a document created by a URL fetch can be
updated by an upload, and the reverse.

## Transports

| Transport | Endpoint | Notes |
|---|---|---|
| Upload, one PUT | `POST /api/documents/upload-url` | ≤ 25 MiB. `201 { id, upload_url, upload_headers? }` |
| Upload, parts | same | above 25 MiB the response describes parts instead of one URL |
| URL fetch | `POST /v1/ingest/url` | `{ url, filename?, sha256?, external_id? }`; the source must declare `Content-Length` |
| Batch manifest | `POST /v1/ingest/batches` | up to 100 items, each single-PUT, per-item results |
| Limits | `GET /v1/limits` | the plan's numbers, before you ask |

### Large files

Above the single-PUT threshold the reservation hands back the parts:

```json
{ "id": "doc_…", "multipart": true, "upload_id": "…", "part_size": 8388608,
  "parts_total": 4, "parts": [{ "n": 1, "url": "https://…" }, "…"] }
```

PUT each part to its own signed URL, in order, sending `part_size` bytes except for the last. Then
confirm — **with no body**. Kiomon reads the part list from storage, so you do not need the
`ETag` response headers (a browser cannot read them unless the bucket exposes them) and you do not
need to remember anything across a reload:

```http
POST /api/documents/doc_…/upload-complete
```

If you already have the etags, `{ "parts": [{ "n": 1, "etag": "…" }] }` still works — it is
re-checked either way. Lost a tab? `GET /api/documents/:id/upload-status?have=1,2` returns freshly
signed URLs for the parts you have not sent (the originals expire in 15 minutes).

`GET /v1/limits` publishes `upload.part_manifest: "storage"` when this is available.

### How long a recording may be

A recording is capped by **duration**, not by bytes — at 24 kbps, 25 MiB already holds 2.4 hours.
The cap is **4 hours** when a perception job does the work, and **1 hour** on the synchronous path;
`GET /v1/limits` publishes the number this deployment will actually enforce, with a `duration_basis`
sentence naming what sets it.

Declare the length at reserve and an over-length file is refused before a byte is transferred:

```json
{ "filename": "offsite.m4a", "size_bytes": 94371840, "content_type": "audio/mp4",
  "duration_s": 16020 }
```

A recording longer than the cap answers `400` with a message naming the limit and its cause, and no
reservation is created. Send it when you know it — a recorder knows on stop. If you send nothing,
the file is still checked after the transfer, and refused with the same
`too_long`; the difference is when you find out, not whether.

### Batches

A batch is a **manifest of jobs**, never a container of bytes:

```json
POST /v1/ingest/batches
{ "items": [ { "item_id": "row-1", "filename": "a.m4a", "size_bytes": 4200000,
               "external_id": "rec-42" } ] }
```

- `202` with the same number of results as items: one bad item never fails the batch.
- `item_id` is the **manifest's** key: replaying that manifest returns the documents it minted, with
  no new URLs (ask `upload-status` for those).
- `external_id` is the **item's** key: a *different* manifest under the same id updates the
  document instead of adding one.
- Refusals are per item: `unsupported_format`, `payload_too_large`, `duration_too_long`,
  `quota_exceeded`, `duplicate`, `busy`, `bad_request`.
- `GET /v1/ingest/batches/:id` joins the stored manifest to each document's live state.

`duplicate` inside a manifest is a per-item answer, not an error: the file is already there, and the
`document_id` tells you where.

### Write batches — memories and text

Files arrive as reservations. Memories and text arrive as **writes**, on two endpoints that answer
with the same envelope:

```json
POST /v1/memories/batch
{ "processing": "grouped",
  "items": [
    { "item_id": "row-1", "external_id": "fact-42", "op": "upsert",
      "kind": "semantic", "title": "…", "body": "…",
      "claims": ["…"], "confidence": 0.9 } ] }
```

`POST /v1/documents/batch` takes the same shape with `kind` in `reference`\|`episodic`\|`semantic`\|
`procedural` and either a `body` to store, a `source_url` to record, or
`source: { kind: "url", url }` to have us fetch it. Its items are documents, its ceiling is text,
and the envelope is identical.

The reply has **one result per item, in request order**, and a batch status that can be `partial`:

```json
{ "object": "batch", "batch_id": "bat_…", "status": "partial",
  "counts": { "total": 2, "active": 1, "pending_approval": 0, "updated": 0,
              "unchanged": 0, "merged": 0, "discarded": 0, "quarantined": 0,
              "failed": 1, "cancelled": 0 },
  "items": [ { "item_id": "row-1", "memory_id": "doc_…", "status": "active" },
             { "item_id": "row-2", "status": "failed",
               "code": "validation_failed", "error": "body is required" } ],
  "poll_url": "/v1/batches/bat_…" }
```

- `202` means **accepted, not finished**: chunking and embedding settle behind the response. Poll
  `poll_url` (`GET /v1/batches/:id` — the manifest, joined to each row's live state, with
  `status`/`counts` derived from it, so a batch approved after the write stops saying
  `pending_approval`) or
  `GET /api/documents/:id/job`. `GET /v1/ingest/batches/:id` answers the same thing.
- `Prefer: wait=N` (N ≤ 30) holds the response until that post-write work settles and answers `200`
  with `Preference-Applied: wait=N`. When the deadline wins you get the normal `202` and **no**
  `Preference-Applied` — the work keeps running either way. `Prefer: respond-async` opts out.
- `POST /v1/batches/:id/retry` re-dispatches every item whose document is still `queued`/`chunked`
  (a stage was down when the batch ran) and answers the same envelope: `active` for a redispatch,
  `unchanged` for one already indexed, `failed` with `code: "not_retryable"` for an item that was
  refused at write time or whose pipeline gave up — a re-upload is the fix for those, not a retry.
- An item's `status` is the settled state of its **row**: `active` (written and searchable),
  `pending_approval` (waiting in the Review Inbox), `updated`, `unchanged`, `merged`, `discarded`,
  `quarantined`, `failed`.
- The **verb** is explicit. `create` inserts and answers `duplicate` if the `external_id` already
  names different content; `upsert` replaces that document in place (same id, links and history);
  `patch` touches only the fields sent.
- `dry_run: true` answers the same per-item statuses and writes nothing (`200`).
- A replayed `item_id` writes nothing: the answer is `unchanged` with the row the first attempt
  minted. Identical content under the same `external_id` is `unchanged` too — no
  reprocessing.
- Caps are published in `GET /v1/limits` under `batch.memory` and `batch.document` (100 items;
  5 MiB / 10 MiB of text; 128 KiB / 2 MiB per item; at most 25 fetched URLs per document batch).
  A batch past a cap is refused **before** any item is written, with the cap named in the message.

### Reviewing a batch

A batch item can land in the Review Inbox (`pending_approval`) — the write gate holds what
it is not sure about, and `approval: "review"` holds what you are not sure about. Keeping
the inbox per item is right, but the *unit* a caller sends is the batch, so the decision is
available for the set:

```
POST /v1/batches/:id/approve
→ 200 { "object": "batch.approval", "batch_id": "bat_…", "approved": 3,
        "counts": { "total": 3, "active": 3, "unchanged": 0, "failed": 0 },
        "items": [ { "id": "doc_…", "status": "active" } ], "reviewed": true }
```

- Each item is promoted exactly as `POST /api/documents/:id/approve` promotes one, so
  the contradiction check, the edges, the link scan and the indexing still run. Approving a
  set is not a waiver; it is the same promotion, asked once.
- `status` per item is `active` (approved now), `unchanged` (already live, or no longer
  waiting — `error` says which) or `failed` (not in this workspace, or the row moved).
- `reviewed` is true when nothing in the batch is still pending, so a caller that approved
  part of it and came back can tell.

There is no `approval: "import"` field, on purpose: a request flag that skips the Review
Inbox would outrank the workspace's own review setting, which is a user-visible toggle. The
set-level lever answers the same need without moving that boundary.

### Imports — the >100 tier

A batch stops at 100 items because 100 items is what fits in a request. Past that, the
shape changes: the payload is an object, the answer is a job, and progress is a cursor.

```json
POST /v1/imports         { "kind": "memory", "declared_items": 4200 }
→ 201 { "import_id": "imp_…", "status": "awaiting_upload",
        "upload": { "url": "https://storage.…/…&X-Amz-Signature=…",
                    "method": "PUT", "expires_at": "…" },
        "start_url": "/v1/imports/imp_…/start", "poll_url": "/v1/imports/imp_…" }
```

1. `PUT` the JSONL to `upload.url` — one JSON object per line, the same fields a batch
   item takes. The bytes go straight to storage; Kiomon never buffers them.
2. `POST /v1/imports/:id/start` → `202`. The object's size is checked against the
   published cap here, then processing of the first chunk starts.
3. `GET /v1/imports/:id` until `status` is terminal.

```json
{ "object": "import", "import_id": "imp_…", "kind": "memory",
  "status": "partial", "progress": 100,
  "counts": { "lines": 4200, "active": 4180, "pending_approval": 0, "updated": 0,
              "unchanged": 4, "merged": 0, "discarded": 0, "quarantined": 0,
              "failed": 16, "cancelled": 0 },
  "failures": [ { "line": 88, "item_id": "imp_…:88", "code": "validation_failed",
                  "error": "body is required" } ],
  "failures_truncated": false }
```

- `status`: `awaiting_upload` → `queued` → `running` → `succeeded` | `partial` | `failed` |
  `cancelled`. `partial` means the job finished and some lines did not land; `failed` means
  none did. Both are terminal.
- `counts.lines` is what was read, so `counts` always reconciles against it. `counts` is the
  **write ledger** — what the import wrote, by outcome — not a live tally: approving a page changes a
  decision without rewriting the ledger, so `counts.pending_approval` keeps the number the import
  wrote as pending.
- `pending_batches` is the live half: chunk batches still waiting for a decision, the same cursor
  `POST /v1/imports/:id/approve` counts down in `remaining_batches`. It reaches `0` when the import
  is fully reviewed, which is what a poll after an approval should read.
- `failures` keeps the first 100 refused lines with their line numbers;
  `failures_truncated` says when there were more.
- `POST /v1/imports/:id/cancel` stops at the next chunk boundary. What already landed
  stays, and the counts say how much.
- Identity works exactly as it does in a batch: an `item_id` you supply is your key, and a
  line without one gets `"<import_id>:<line>"`, so a redelivered chunk answers `unchanged`
  instead of writing twice.
- An import carries **text**. A `document` line naming a URL is refused with
  `unsupported_format` — fetching is `/v1/documents/batch`'s job, with the SSRF guard.
- Reviewing an import is a page at a time: `POST /v1/imports/:id/approve` promotes the
  pending items of up to five chunk batches (≤ 500 items) and answers `remaining_batches`
  plus a `next_url`; call it until `remaining_batches` is `0`. Nothing is approved by
  uploading — the write gate's answer is the same one a batch gets.
- Caps: `GET /v1/limits` → `batch.import` (256 MiB of JSONL, 100 000 declared lines,
  256 KiB read per chunk).
- Not built, on purpose: a results artifact. The failures list is bounded and inline;
  a per-line outcome file for a million lines is a different product.

## Watching progress

`GET /api/documents/:id/job` returns the phases, the stage history and where the item sits in the
workspace's processing order:

```json
{ "ingest": { "status": "converting" },
  "index": { "status": "chunking" },
  "media": { "status": "ready", "duration_s": 754.2, "audio_available": true },
  "stages": [{ "stage": "convert", "status": "ok", "duration_ms": 41000 }] }
```

Statuses are per phase and they settle independently: a document is searchable from `chunked`
(lexical) before `indexed` (vector), and a recording is playable as soon as `media` is `ready`.

## What a refusal means

| Status | Meaning | Retry? |
|---|---|---|
| `400` | The request or the file is wrong — the message names which | no |
| `402` | Plan quota | after upgrading |
| `409` | A state conflict: a duplicate, an unfinished upload, a document still processing | yes, later |
| `413` | Too large for the plan or the manifest | no |
| `415` | A format this lane does not decode; the message lists the accepted extensions | no |
| `429` | Rate limited; `Retry-After` is set | yes, after it |
| `503` | Storage or the pipeline is unavailable — nothing about the request was wrong | yes |
