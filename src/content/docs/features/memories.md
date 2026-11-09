---
title: Memories & Review Inbox
description: The memory stack — four memory kinds, the autonomous write gate, and the full lifecycle of a memory.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

Kiomon is **memory-native**: instead of agents scribbling notes into a flat store, every piece of agent-authored knowledge is a **memory** with a type, metadata, and a lifecycle. This page covers the whole stack.

## The four memory kinds

Memories are typed so they can be searched, filtered, and used appropriately:

| Kind | Code | Friendly name | What it captures | Save framing |
|---|---|---|---|---|
| Files | `reference` | Files | Imported saved content (`reference` = imported content) | *Keep this* |
| Facts | `semantic` | Facts | Knowledge, facts, relationships between entities | *Teach it* |
| Routines | `procedural` | Routines | How-to rules, steps, triggers, preferences | *Automate it* |
| Moments | `episodic` | Moments | Events with an `occurred_at` timestamp | *Log it* |

Each memory carries:

- **title** — short, searchable heading
- **excerpt** — the one-line card subheading (shown under the title everywhere)
- **body** — the full content
- **tags** — up to 20
- **confidence** — 0–1, an estimate of how reliable the memory is
- **entities / claims / domain** — structured metadata that makes memory *searchable and consolidatable*. Supplying these at write time skips Kiomon's paid extraction pass.
- **source_refs** — IDs of the documents/memories the memory was derived from (wired into `derived_from` graph edges on activation)

## The write gate and review flow

Kiomon features an **autonomous write gate** so agents can learn and act fluidly without demanding manual approval for every single save:

```
Agent writes (draft_memory / reflect_session)
                   │
                   ▼
          Autonomous Write Gate
   (pre-pass: DISCARD / MERGE / CREATE)
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
confidence >= 0.75 /      confidence < 0.75 /
high-authority source     workspace review mode
      │                         │
      ▼                         ▼
ACTIVE memory             Review Inbox (pending draft)
(searchable, embedded,          │
 graphed, retrievable)          │ approve (dashboard / manage_memory)
                                ▼
                          ACTIVE memory
```

### Review modes

- **`autonomous` (DEFAULT)** — High-authority sources and agent reflections with `confidence >= 0.75` auto-activate immediately. Lower-confidence reflections route to the Review Inbox as pending drafts.
- **`review`** — Opt-in per workspace. All agent writes land in the Review Inbox for manual approval (the legacy fully-manual behavior).

### Write-gate pre-pass

Before saving, incoming drafts are checked against existing active semantic memories:
- **DISCARD** — All claims in the draft already exist in active memory; nothing new to add.
- **MERGE** — Some claims are new; they are folded directly into the existing fact without creating a duplicate row.
- **CREATE** — Novel information with no overlap; created as an active memory or pending draft depending on confidence and review mode.

### Contradiction and quarantine

- When a new memory contradicts an existing one, the older memory's confidence drops by half.
- If a low-authority claim contradicts a pinned or higher-authority fact, it is **quarantined**: stored, but hidden from retrieval and flagged with a `contradicts` edge. It can never silently overwrite your trusted facts.

### Transparency and reversibility

Every autonomous write-gate action is soft (archived, never hard-deleted) and visible in the **"Kiomon's decisions"** feed inside the dashboard Review Inbox. Any decision is reversible via `manage_memory` (`action: "revert"`) or the dashboard.

## Lifecycle controls

| Control | Tool / API | Effect |
|---|---|---|
| **Pin** | `manage_memory` → `pin` | Exempt from decay; always ranks at the top of retrieval |
| **Unpin** | `manage_memory` → `unpin` | Returns to normal strength dynamics |
| **Archive** | `manage_memory` → `archive` | Soft-hide from retrieval; recoverable |
| **Restore** | `manage_memory` → `restore` | Un-archive |
| **Forget** | `manage_memory` → `forget` | Permanent purge (from stores, index, vectors, graph) |
| **Rate** | `manage_memory` → `rate` (+1/-1) | Feedback feeds strength signals |
| **Revert** | `manage_memory` → `revert` | Undo a write-gate decision: restore a superseded/quarantined memory, or demote an auto-activated memory back to pending |
| **TTL** | (episodic) | Episodic memories have a time-to-live; old moments expire when their TTL passes |

## Strength, confidence, and decay

Memories aren't static blobs — they have a health model:

- **Strength** — rises with retrieval and positive ratings. Pinned memories are strong by construction.
- **Confidence** — the memory's self-assessed reliability (0–1). Contradictions halve confidence: if a new memory contradicts an existing one, the older memory's confidence drops by half, surfacing the tension.
- **Decay** — unpinned memories slowly lose strength over time unless they're retrieved or rated. This keeps your brain *healthy*: unused facts fade, used facts stay sharp.

### Intent-aware retrieval and the outcome loop

Agents participate directly in memory health and continuous learning:
- **`retrieve_memory`** — Instead of flat search hits, agents request context typed by intent (`execute`, `plan`, `answer`, `verify`, `debug`). Kiomon returns a decision-ready ContextPacket (top facts, one best procedure, episodes, evidence, and warnings) ranked by applicability.
- **`record_outcome`** — After completing a task, agents report how retrieved memories performed (`helpful`, `unused`, `misleading`, `outdated`). Helpful items gain +1 feedback and higher confidence; misleading ones suffer a confidence reduction (x0.85) and record failure evidence; outdated items expire; unused items receive a minor penalty.

## Consolidation

**Memory consolidation** runs in the background, folding repeated experience into reusable knowledge:
- **`episode -> procedure`** — Three or more repeated episodes about the same subject promote into a representative Routine with triggers and steps, wired with `derived_from` edges.
- **`reference -> semantic`** — Clusters saved files sharing entities and domains into representative semantic facts.

Combined with automatic extraction of entities/claims/domain, consolidation stops your brain from degrading into a pile of unrelated notes.

## Memories via API

- **Write** — `POST /api/memories/batch-draft` accepts 1–25 learnings per call, evaluated through the write gate (auto-activating high-confidence items in autonomous mode).
- **Read** — `GET /api/memories` lists memories (with kind filters); search via `GET /api/search?kind=...`.

## Memory vs. document

| | Document | Memory |
|---|---|---|
| Who writes it | You (extension/connectors) | Agents + you |
| Content | Imported content (pages, files, notes) | Agent-authored knowledge |
| Types | source-based | `reference` / `semantic` / `procedural` / `episodic` |
| Approval | Immediate | Autonomous write gate (auto-activates >= 0.75 / high-authority) or Review Inbox |
| Lifecycle | archive/restore/forget | + pin, decay, rating, confidence, contradiction, revert, TTL |
| Graph | document links + suggestions | typed relations (`derived_from`, `supports`, `contradicts`, …) |