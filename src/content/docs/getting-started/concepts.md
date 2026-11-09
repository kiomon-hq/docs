---
title: Core Concepts
description: The mental model behind Kiomon — documents, workspaces, memories, retrieval, and the knowledge graph.
---

Kiomon is built around a few simple ideas. Once you understand them, everything else — the extension, the dashboard, the MCP tools, the API — falls into place.

## The library is a corpus of documents

A **document** is any piece of saved content: a web page, an article, a note, a highlight, or a synced file from Notion, Google Drive, or Confluence.

- Each document has a **title**, an **excerpt**, tags, a source, and a body.
- Kiomon handles large content transparently — saves are instant and retrieval never slows down, no matter the size.
- Every document is **auto-tagged** and analyzed for the **entities, claims, and domain** it covers — this is what makes search and retrieval work well.

Documents live in a **workspace**. Documents in different workspaces are completely isolated.

## Workspaces are isolation boundaries

A **workspace** is a named, isolated collection of documents and memories (e.g. "Personal", "Work", "Agent Handbook"). Everything you save, search, or ask about happens inside the context of a workspace.

- The browser extension lets you pick the workspace for each save (or create a new one on the fly).
- Agents discover workspaces via `list_workspaces` and declare one in every write.
- Free accounts get 5 workspaces; Pro gets 50.

## Memories are agent-written knowledge

Where documents are *imported* content, **memories** are *agent-authored* knowledge: the facts, rules, preferences, and events your agents learn while working with you. Instead of agents dumping notes into a generic store, memories are first-class citizens with types and a lifecycle.

There are four memory kinds:

| Kind | Friendly name | What it captures | Example |
|---|---|---|---|
| `reference` | **Files** | Imported/saved content and documents | A saved Stripe API page |
| `semantic` | **Facts** | Knowledge, facts, relationships | "The user's product is a SaaS called Kiomon" |
| `procedural` | **Routines** | How-to rules, triggers, preferences | "Always answer with numbered citations" |
| `episodic` | **Moments** | Events that happened, with a timestamp | "Deployed v1.2 to prod on March 4" |

Memories carry **metadata that makes them useful to agents**: `entity`, `claim`, and `domain` fields turn a blob of text into a searchable, graphable, consolidatable knowledge item.

### The write gate and review flow

Workspaces operate with an **autonomous write gate** (`review_mode: autonomous` by default). High-authority sources and agent reflections with `confidence >= 0.75` auto-activate immediately into your brain. Lower-confidence reflections route to your dashboard **Review Inbox** as `pending_approval` drafts until approved. Workspaces can also opt into `review` mode if you prefer manual approval for all agent writes.

Before saving, the write gate runs a pre-pass against active semantic memories: identical claims are **discarded**, overlapping claims are **merged** into existing facts, and novel claims are **created**. All autonomous decisions are soft, logged in the "Kiomon's decisions" feed, and revertible.

### Lifecycle controls

- **Pin** — immune to decay, always ranks top.
- **Archive** — soft hide from retrieval, easily restored.
- **Restore** — un-archive a previously hidden memory.
- **Forget** — permanent purge.
- **Rate** — +1 useful / −1 not useful; feedback feeds strength.
- **Revert** — undo a write-gate decision (`manage_memory action: "revert"`).
- **Decay** — unpinned memories slowly lose strength over time unless they're retrieved or rated.
- **Contradiction & Quarantine** — when two memories contradict, the older one's confidence drops by half. If a low-authority claim contradicts a pinned or higher-authority fact, it is **quarantined** (kept and flagged with a `contradicts` edge, but hidden from retrieval) so it can never silently overwrite your facts.

See [Memories & Review Inbox](/features/memories) for the full picture.

## Retrieval is hybrid

Kiomon gives you **two retrieval surfaces**:

1. **Search** — *hybrid*: exact keyword matching fused with semantic (meaning-based) matching, so you find things by phrase *and* by concept.
2. **Chat / RAG** — grounded Q&A over your saved documents and memories, with **numbered inline citations** and a strict "answer only from the library" rule.

When retrieval surfaces a memory, Kiomon notes the usage — the more a memory is used, the stronger it gets.

## The knowledge graph connects everything

Kiomon's **auto-linker** ("the Librarian") scans the library as documents arrive. For each new document it finds the content most similar to it and proposes **link suggestions** with similarity scores.

Approve a suggestion in the dashboard and it becomes a permanent, bidirectional link in your knowledge graph — visualizing how your whole library clusters. An interactive **graph view** renders your library as an explorable map. Auto-linking comes with Pro; manual linking is free for everyone.

Beyond document-document links, memories carry **typed relations**: `derived_from`, `supports`, `contradicts`, `related_to`, `precedes`, `follows`. Agents walk these trails to trace how knowledge was derived.

## Plans gate capabilities, not accumulation

There are two plans — **Free** and **Pro** — plus a 14-day Pro trial on signup. The Free tier is generous on volume (3,000 documents, 300 MB) but gates the power features: connectors (Pro only), workspaces (5), API keys (2), and auto-linking (off). Pro lifts those caps and turns on the knowledge graph.

See [Plans & Quotas](/account/billing) for exact numbers.

## The agent surface

Agents talk to Kiomon over two protocols:

1. **MCP** (Model Context Protocol) — the memory-native toolset: `list_workspaces`, `select_workspace`, `get_workspace_context`, `search_memory`, `get_memory`, `retrieve_memory`, `explore_memory_graph`, `draft_memory`, `reflect_session`, `manage_memory`, `get_latest_briefing`, `record_outcome`, `save_document`, `list_memories`. Used by Cursor, Claude Desktop, Windsurf, Cline, and any MCP client.
2. **OpenAI-compatible API** — drop-in replacement for OpenAI endpoints (`chat/completions`, `embeddings`) so n8n, LangChain, `openai` SDKs, and any agent tool can point at your Kiomon brain by swapping a base URL and API key.

Both authenticate with a **Kiomon API key**.