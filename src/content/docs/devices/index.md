---
title: Memory for devices
description: Kiomon as memory infrastructure for glasses, pendants, robots, arms and appliances — the three calls a body needs, and what the platform guarantees.
---

Most memory tooling assumes a chat window. A device has no chat window: it has a sensor, a
clock, and an occasional uplink. This section is about using Kiomon as the memory *behind* a
physical thing, whatever the thing is.

If you are building a chatbot or an agent, [the OpenAI-compatible
API](/integrations/openai/) is the shorter path. Read this if your software runs somewhere
with a battery.

## The shape of the problem

A device observes constantly and can afford to say almost nothing. Glasses see a room every
frame; an arm sees one pallet per task; a pendant hears an hour of conversation. Ninety-nine
percent of that is noise that should be forgotten on the device, never uploaded.

What a body actually needs from memory infrastructure is three things:

| Need | Call |
|---|---|
| Remember this, once, reliably | `POST /v1/memories` |
| What do I know about X, here, lately | `GET /v1/recall` |
| Attach the frame/clip that proves it | `POST /v1/memories/:id/evidence` |

Nothing else. No schema design, no index tuning, no consolidation pass, no embedding
pipeline — those are the parts that are expensive to build and boring to maintain.

## The one design rule: the device decides *what*, Kiomon decides *where it goes*

A body knows something the cloud cannot: whether this moment is worth remembering. So the
decision to create a Memory stays on the device — a gate, a threshold, a hand-written
condition. When that gate fires, exactly one Memory is written.

The rate differences are enormous, and the platform does not care: glasses fire once a
minute, a 10 Hz arm fires once per task, a smoke alarm fires once a year. One Memory per
decision means the write volume follows the *decisions*, not the sensors.

## What lands, and where it goes

A device's Memory is **not** trusted on arrival. Every Memory carries a source, and a
device's is ranked below what a person saved themselves:

| Source | Rank | Trusted |
|---|---|---|
| `user_saved` | 3 | yes |
| `connector_sync` | 2 | yes |
| `agent_reflection`, `device`, `robot` | 1 | no |

That is deliberate and it is not configurable per request: a body may never widen its own
authority. A camera that decides "Sarah is angry" lands in the review inbox, not in the
knowledge base, because it is an inference about the world rather than testimony about it.
What a device *did* — "filled the water bottle at 09:14" — is testimony, and that is what
makes a Moment worth keeping.

Two consequences worth knowing before you integrate:

- **A written Memory is not immediately recallable.** It enters review (`approval:
  "review"`, the default). It becomes retrievable once it is approved and indexed.
- **`approval: "auto"` is a request, not a command.** It still has to clear the gate —
  confidence at or above 0.75, in a workspace whose review mode allows auto-promotion. There
  is no force-promote.

## Idempotency is the whole reliability story

A device on a bad uplink will send the same Memory twice. Send an `external_id` — a string
you construct, such as `glasses-a1/2026-10-29T09:14/3` — and the second write is a **success**,
not a conflict:

```
201 Created   { "id": "doc_…", "deduped": false }
200 OK        { "id": "doc_…", "deduped": true }   ← same Memory, no second row
```

That is different from the batch endpoints, which refuse a replayed id. A batch has a
manifest that can be corrected; a device has no transaction log and must be able to resend
blindly after a timeout. It never has to ask whether the last request landed.

## Evidence never passes through the request

Bytes go device → object storage directly, over a presigned URL. `POST
/v1/memories/:id/evidence` records a *reference* — mime type, byte count, checksum — and
hands back a URL good for a few minutes. `POST /v1/memories` itself never carries a payload,
so a body with no bandwidth can send the summary and nothing else.

## What a summary is for

`summary` is required, and it is not decoration: it is the text that gets chunked, embedded
and searched. A Memory with no summary is reachable only by filters, which for practical
purposes means unreachable.

The rule that follows is the one worth designing around: **a device that cannot summarize
cannot create a Memory.** It can only upload evidence. Summarising is where the judgement
lives, and it is the piece to get right before writing any integration code.

## What is available today

| Capability | State |
|---|---|
| `POST /v1/memories` | available |
| `GET /v1/recall` with qualifier, entity and time filters | available |
| `GET /v1/memories/:id` | available |
| Evidence presign + retrieval | available |
| Anchors (offsets into a recording, `[0:08]`) | available — offsets, not clock times |
| Device trust ramp (3 approvals, then testimony auto-admits) | available |
| Vendor SDK (Rust core, Kotlin/Swift/C++) | not yet — plain HTTPS works today |
| Per-device rate limiting | available — 60 writes/minute per `device_id`, separate from the account budget |

Nothing above requires a robotics background to use. If you can make an HTTPS request and
read a JSON response, you can give your device a memory.

Next: [worked examples](/devices/examples/) for glasses, a warehouse robot, an appliance and
a support agent.
