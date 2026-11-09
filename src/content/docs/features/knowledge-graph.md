---
title: Knowledge Graph
description: How the auto-linker (the Librarian) connects your documents, how to approve suggestions, and how to read the graph.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

The **knowledge graph** is Kiomon's map of how your library fits together. Documents are nodes; similarity edges connect related content. As your library grows, the graph shows you clusters you didn't know existed — and gives your agents a structured way to navigate relationships.

## How auto-linking works

Kiomon's **auto-linker** ("the Librarian") runs after every save:

```
Document saved
    │
    ▼
Background processing kicks off
    │
    ▼
Keywords extracted from the new document
    │
    ▼
Fuzzy keyword search → candidate related notes
    │
    ▼
Similarity scoring ranks the candidates
    │
    ▼
Bidirectional link suggestions with scores
    │
    ▼
Link lifecycle: pending → processing → completed / failed
```

Each suggestion is a **bidirectional edge** between two documents with a similarity `score`. Suggestions don't mutate your documents — approving a link creates a graph edge only.

## Approving suggestions

In the **reader view** of a document, you'll see a *Links* / *Suggestions* panel listing candidate links. Approve the ones that are genuinely related; reject the noise. Approved links appear in:

- The interactive **graph view** (dashboard) — rendered as an explorable node map
- The document's link list
- API results (`/api/graph`)

Manual linking is also available (connect any two documents by hand) and is **free on every plan**.

## Reading the graph

The graph view visualizes your library as an interactive canvas:

- **Nodes** = documents or memories, sized/tinted by relevance or recency
- **Edges** = approved links (and you can see unapproved suggestions separately)
- **Pan/zoom** to explore; click a node to open the document

Clusters in the graph are usually topics: zoom out and you'll see your research areas as constellations.

## Memory relations

Memories add *typed* edges on top of document similarity:

| Relation | Meaning |
|---|---|
| `derived_from` | One memory was derived from another (agent records `source_refs` at write time; wired on approval) |
| `supports` | One memory supports another's claim |
| `contradicts` | Conflicting memories (also halves the older one's confidence) |
| `related_to` | Related but not derived |
| `precedes` / `follows` | Temporal ordering (events, processes) |
| `part_of` | Compositional relationship |

Agents walk these trails with the MCP tool `explore_memory_graph(id, relation?, depth?)` — tracing *evidence trails*: "this claim was derived from that doc, which supports this other fact."

## API surface

| Endpoint | Purpose |
|---|---|
| `GET /api/graph` | Graph data: nodes + edges for a workspace (with link status) |
| `POST /api/documents/:id/link` | Manually link two documents |
| `POST /api/documents/:id/unlink` | Remove a link |
| `GET /api/documents/:id/links` | List link suggestions for a document (pending/completed) |

## Plan gating

- **Auto-linking** (suggestions) — Pro feature. Free accounts don't get suggestions.
- **Manual linking** — free for everyone.