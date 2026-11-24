---
title: Device examples
description: Four worked integrations — smart glasses, a warehouse arm, a home appliance, and a support agent reading what the devices wrote.
---

Four integrations, each end-to-end against the live `/v1` surface. They are deliberately
different shapes: a wearable that writes often, an industrial arm that writes rarely and
cares about outcomes, an appliance that writes *facts* rather than events, and a chatbot that
only ever reads.

Nothing here needs a robotics toolchain. Every example is HTTPS and JSON.

## 1. Smart glasses — "what did I see this morning?"

The glasses decide locally when something is worth remembering (a held gaze, a spoken
request, a recognised object). When the gate fires, they write one Memory and attach the
frame.

```bash
curl -X POST https://api.kiomon.com/v1/memories \
  -H "Authorization: Bearer $KIOMON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "episodic",
    "summary": "Placed the blue mug on the kitchen shelf next to the kettle",
    "occurred_at": "2026-10-29T09:14:03Z",
    "occurred_to": "2026-10-29T09:14:51Z",
    "carrier": "device",
    "device_id": "glasses-a1",
    "external_id": "glasses-a1/2026-10-29T09:14/3",
    "confidence": 0.82,
    "participants": ["sarah"],
    "entities": ["blue mug", "kitchen shelf", "kettle"]
  }'
```

```json
{ "id": "doc_01k9…", "kind": "episodic", "status": "pending_approval",
  "occurred_at": "2026-10-29 09:14:03", "occurred_to": "2026-10-29 09:14:51",
  "deduped": false }
```

The frame itself arrives separately, straight to storage:

```bash
# 1. Ask for a place to put the bytes
curl -X POST https://api.kiomon.com/v1/memories/doc_01k9…/evidence \
  -H "Authorization: Bearer $KIOMON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mime": "image/jpeg", "bytes": 182733, "sha256": "9f2c…e41"}'

# → { "upload_url": "https://…r2.cloudflarestorage.com/uploads/…?X-Amz-Signature=…",
#     "expires_at": "2026-10-29T09:24:03Z", "id": "ev_01k9…" }

# 2. PUT the bytes there. They never touch the API.
curl -X PUT "$UPLOAD_URL" -H "x-amz-checksum-sha256: 9f2c…e41" --upload-file frame.jpg
```

Later, from the phone app:

```bash
curl "https://api.kiomon.com/v1/recall?q=where%20did%20I%20put%20the%20mug&k=5" \
  -H "Authorization: Bearer $KIOMON_API_KEY"
```

```json
{
  "items": [{
    "id": "doc_01k9…", "kind": "episodic",
    "excerpt": "Placed the blue mug on the kitchen shelf next to the kettle",
    "score": 0.031, "occurred_at": "2026-10-29 09:14:03", "occurred_to": "2026-10-29 09:14:51",
    "why": { "legs": ["fts", "vector"], "time": null }
  }],
  "plan": { "k": 5, "prefilter": false, "mode": "served", "elapsed_ms": 210, "dropped": 0 }
}
```

An answer with no time bound says `"time": null` — the mirror image of a filtered answer
that says `"in-range"`. A caller can tell "the corpus has nothing" (`mode: "empty"`) from
"my filters cut it off" without guessing.

## 2. Warehouse arm — "did that task work last time?"

An arm writes rarely: once per task. What it cares about is the outcome, and what it needs
back later is *this station, this object, what happened*.

```python
import requests, uuid, datetime as dt

now = dt.datetime.now(dt.timezone.utc)
requests.post(
    "https://api.kiomon.com/v1/memories",
    headers={"Authorization": f"Bearer {KEY}"},
    json={
        "kind": "episodic",
        "summary": "Picked the 12kg pallet from aisle 4 and stacked it in bay 2; "
                   "gripper slipped once and recovered",
        "outcome": "succeeded",
        "occurred_at": (now - dt.timedelta(seconds=48)).isoformat().replace("+00:00", "Z"),
        "occurred_to": now.isoformat().replace("+00:00", "Z"),
        "carrier": "robot",
        "device_id": "arm-bay2-07",
        "external_id": f"arm-bay2-07/{now:%Y-%m-%dT%H:%M}/{uuid.uuid4().hex[:6]}",
        "confidence": 0.95,
        "decisions": ["retried grip after slip"],
        "entities": ["pallet-12kg", "aisle 4", "bay 2"],
    },
    timeout=10,
)
```

Next shift, the same arm — or its replacement — asks before it acts:

```bash
curl "https://api.kiomon.com/v1/recall?q=gripper%20slip%20aisle%204&entity=aisle%204&k=5" \
  -H "Authorization: Bearer $KIOMON_API_KEY"
```

`entity=aisle 4` is a **filter, not a search term**: it removes every Memory that does not
mention aisle 4 before ranking anything. That distinction matters for a body, because a
Memory about a different aisle is not a worse answer — it is the wrong answer, and ranking
it lower still serves it.

Two details that keep this honest over months:

- `occurred_to` makes the span real, so "how long does a 12kg pick take" is answerable from
  the record rather than inferred from the summary.
- `outcome` is optional on purpose. A task can end without a verdict, and inventing
  `"succeeded"` would be a lie the record keeps for years.

## 3. Home appliance / pendant — preferences, not events

Not everything is a Moment. "The user likes the bedroom at 19 °C" is a *claim*: it can be
superseded, it applies to one subject, and it should survive a reboot of the thing that
learned it.

```bash
curl -X POST https://api.kiomon.com/v1/memories \
  -H "Authorization: Bearer $KIOMON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "semantic",
    "summary": "Prefers the bedroom at 19 °C overnight",
    "subject": "bedroom",
    "scope": "thermostat",
    "carrier": "device",
    "device_id": "pendant-b2",
    "external_id": "pendant-b2/pref/bedroom-temp/3",
    "confidence": 0.9,
    "entities": ["bedroom", "thermostat"]
  }'
```

`subject` is the qualifier that makes this safe to filter: two preferences that differ in
`subject` are never treated as contradicting each other. Ask for the current belief:

```bash
curl "https://api.kiomon.com/v1/recall?q=bedroom%20temperature&subject=bedroom&k=3" \
  -H "Authorization: Bearer $KIOMON_API_KEY"
```

A superseded preference does not disappear — it is linked to its replacement, and
`GET /v1/memories/:id` reports `links.supersedes`. A device that wants the *history* of what
it believed can follow it; a device that wants the current belief asks without follow-ups and
gets the top-ranked one.

Rule of thumb for a device that writes both kinds: **events are `episodic`, beliefs are
`semantic`.** Getting that wrong is the most common way a device integration becomes
unusable, because an event filed as a belief starts superseding things it never replaced.

## 4. A support agent reading what the devices wrote

The fourth integration never writes. It is the human-facing side — a chatbot or a support
console — and its whole job is to answer from what the fleet recorded.

```ts
async function ask(question: string) {
  const url = new URL("https://api.kiomon.com/v1/recall");
  url.searchParams.set("q", question);
  url.searchParams.set("k", "8");
  url.searchParams.set("budget_ms", "800");   // a person is waiting
  url.searchParams.set("kind", "episodic,semantic");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  const { items, plan } = await res.json();

  if (plan.mode === "empty") {
    // Say so. This is a fact about the corpus, not a failure — and an agent that
    // invents an answer here invents an absence the fleet never had.
    return "Nothing in the record about that.";
  }
  return items.map((i) => `${i.occurred_at ?? "undated"} — ${i.excerpt}`).join("\n");
}
```

`budget_ms` is the one parameter worth setting deliberately on a read path with a human on
the other end. The retrieval door's own budget is 32 s, which is right for a batch job and
unusable in a chat turn.

## What these four have in common

| Decision | Where it lives |
|---|---|
| Is this worth remembering? | on the device |
| What is this, in one sentence? | on the device |
| Which project / subject does it belong to? | a field on the write |
| How is it stored, indexed, embedded, deduplicated? | Kiomon |
| Who may see it? | the workspace |

That split is the whole product. The device keeps the judgement and the bytes; the platform
keeps the retrieval, the trust model and the durability.

## Things that will bite you

- **A Memory is not recallable until it is approved and indexed.** For a closed fleet, that
  means either an auto-approval policy in the workspace or a review step. Do not discover
  this in production.
- **`summary` is the index.** A device that logs `"frame 8817"` has written something
  unfindable. Write what a person would say.
- **Send `external_id` on every write.** Free idempotency, and the only thing that makes a
  flaky uplink safe.
- **`anchors` is not accepted yet.** If you need `[0:08]` offsets into a recording, the write
  returns `400` today rather than dropping the field silently. Evidence files work now;
  offsets inside them are next.
