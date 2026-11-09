---
title: Webhooks
description: Register an endpoint, verify the signature, and what each event means.
---

A webhook tells your server that an ingest finished, without polling. Register an endpoint in a
workspace and every document event in that workspace is delivered to it.

```
POST /api/webhooks            { "url": "https://your.app/hooks/kiomon" }
  → 201 { id, url, events, active, secret, secret_notice }
```

The response carries the **signing secret once**. It is not shown again — store it in your
environment, not in your database of user settings.

## Events

| Type | Fires when |
|---|---|
| `document.ready` | The document is readable and searchable: conversion, chunking, embedding and extraction have finished |
| `document.failed` | The document will not be processed: the file could not be decoded, or processing exhausted its budget |
| `batch.completed` | A write batch (`/v1/memories/batch`, `/v1/documents/batch`) settled and its post-write work — chunking, embedding, link scanning — finished |

`document.*` are terminal per document. A document emits exactly one of them per ingest, and one
again if it is re-ingested under the same `external_id` (that is an update, not a new document).

`batch.completed` is a roll-up for callers who would rather count one event than a hundred: one per
batch, deduped by the batch id, carrying the same `status` and `counts` the write returned. The
per-item `document.*` events remain the truth for individual rows, and the batch event is not
backfilled — if you need the manifest, `GET /v1/batches/:id` is authoritative.

## The payload

```json
{
  "id": "evt_…",
  "object": "event",
  "type": "document.ready",
  "created": "2026-10-30T09:12:44.512Z",
  "workspace_id": "…",
  "data": {
    "document_id": "doc_…",
    "external_id": "ticket-4711",
    "batch_item_id": null,
    "filename": "offsite.m4a",
    "type": "audio",
    "ingest_status": "ready",
    "index_status": "ready",
    "media_duration_s": 1602.4,
    "media_status": "ready",
    "error": null
  }
}
```

A `batch.completed` payload carries a summary instead of a document:

```json
{
  "type": "batch.completed",
  "data": {
    "batch_id": "bat_…",
    "kind": "memory",
    "status": "partial",
    "counts": { "total": 40, "active": 39, "failed": 1 }
  }
}
```

`error` is `{ code, message }` on `document.failed` and `null` otherwise. `external_id` and
`batch_item_id` are the ids **you** supplied, which is what makes a retried delivery safe to
apply: `document_id` is stable across re-ingests, so a webhook that arrives twice lands on the
same row on your side too.

## Verifying a delivery

Every request carries:

| Header | Value |
|---|---|
| `X-Kiomon-Signature` | `t=<unix seconds>,v1=<hex HMAC-SHA256>` over `` `${t}.${rawBody}` `` |
| `X-Kiomon-Event-Id` | the `id` in the payload |
| `X-Kiomon-Event-Type` | `document.ready`, `document.failed` or `batch.completed` |
| `X-Kiomon-Delivery` | this attempt's id — the same event retried has a new one |

The timestamp is inside the signed string, so it cannot be edited without breaking the
signature. Reject anything older than five minutes:

```ts
const [t, v1] = header.split(",");
const timestamp = Number(t.slice(2));
const expected = crypto
  .createHmac("sha256", process.env.KIOMON_WEBHOOK_SECRET!)
  .update(`${timestamp}.${rawBody}`)          // raw bytes, before JSON parsing
  .digest("hex");
if (v1 !== `v1=${expected}`) return res.status(400).end();
```

Use the **raw request body** for the digest — re-serialising the parsed JSON changes bytes and
invalidates the signature.

## Retries

At-least-once, with a signature that is regenerated per attempt so a replayed request cannot be
mistaken for a fresh one:

| The receiver answers | What happens |
|---|---|
| any `2xx` | delivered — nothing more |
| `408`, `429`, `5xx`, timeout (10 s), or unreachable | retried: 1 min, 5 min, 30 min, 1 h, 2 h, 4 h, 6 h, 12 h |
| any other `4xx` | **not retried** — the payload will not become acceptable |
| three consecutive non-retryable failures | the endpoint is **disabled** |

There is no redirect following: a `3xx` on a webhook is a misconfiguration, and following one
would let a receiver bounce the delivery to an address Kiomon never approved.

A disabled endpoint keeps its URL and secret. `POST /api/webhooks/:id/enable` turns it back on and
resets the failure count.

## Inspecting deliveries

```
GET /api/webhooks                       → the endpoints this workspace has
GET /api/webhooks/:id/deliveries?limit=50 → what we tried and what you answered
DELETE /api/webhooks/:id                → stop sending (delivered history is kept)
```

Each delivery row carries `state`, `attempts`, `response_status`, `error` and `delivered_at`,
which is the shortest path from "our integration is quiet" to "your endpoint answered 500 at
09:14".

## Limits

- `https` only, public address only — the URL is checked when you register it **and** again at
  every send, because DNS is not a fact that stays true.
- 10 s per request; a receiver that needs longer is not answering a webhook.
- One delivery row per (endpoint, event): the same event is never queued twice, even if the
  fan-out is re-run after a crash.
