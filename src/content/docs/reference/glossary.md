---
title: Glossary
description: The vocabulary Kiomon uses across the app, API, and docs.
---

## Documents & content

- **Document** — any saved piece of content: web page, article, note, highlight, or synced file. Has a title, excerpt, body, tags, and source.
- **Library** — the dashboard view of all documents in a workspace.
- **Reader** — the distraction-free reading view for a saved document (with editing, tagging, linking, and suggestions).
- **Highlight** — a selected-text save captured from the browser extension's context menu.
- **Note** — a short annotation attached to a save from the extension popup.

## Workspaces

- **Autonomous mode** — default workspace `review_mode` where high-authority memories and reflections with `confidence >= 0.75` auto-activate, while lower-confidence reflections route to the Review Inbox.
- **Context pack** — the pre-flight orient returned by `get_workspace_context`: pinned memories, routines, topic facts, and stats.
- **Manual Review mode** — opt-in workspace `review_mode` where all agent writes land in the Review Inbox for manual approval.
- **Workspace** — a named, isolated container of documents and memories. Everything is scoped to a workspace.

## Memory stack

- **Archive** — soft hide from retrieval (recoverable).
- **Confidence** — a memory's reliability score (0–1); contradictions reduce it.
- **Consolidation** — background process folding repeated experience into reusable knowledge: promotes repeated episodes into procedures (`episode -> procedure` when >= 3 episodes share a subject) and clusters saved files into semantic facts (`reference -> semantic`).
- **Decay** — gradual weakening of unpinned memories over time.
- **Draft** — a memory written by an agent that has not yet been approved or auto-activated (excluded from search and retrieval until activated).
- **Extraction** — the automatic pass that derives tags, entities, claims, and domain from content.
- **Facts (`semantic`)** — knowledge, facts, and relationships.
- **Files (`reference`)** — imported content (how reference documents are labeled).
- **Forget** — permanent removal from storage and search.
- **Kiomon's decisions** — the audit feed in the dashboard Review Inbox logging every autonomous write-gate action (auto-activation, merge, discard, quarantine).
- **Memory** — an agent-authored (or human-authored) knowledge item with a typed kind and lifecycle.
- **Moments (`episodic`)** — dated events with a timestamp and a time-to-live.
- **Pin** — makes a memory exempt from decay and top-ranked.
- **Quarantine** — safety state for low-authority claims that contradict pinned or higher-authority facts: stored and flagged with a `contradicts` edge, but hidden from retrieval so they never silently overwrite user facts.
- **Restore** — un-archive a previously hidden memory.
- **Revert** — lifecycle action (`manage_memory action: "revert"`) that undoes a write-gate decision, restoring a superseded/quarantined memory or demoting an auto-activated memory back to pending.
- **Review Inbox** — the dashboard list holding pending drafts awaiting review, alongside the "Kiomon's decisions" audit feed.
- **Routines (`procedural`)** — how-to rules, triggers, and preferences agents should follow.
- **Strength** — a memory's health signal, fed by retrieval and ratings.
- **Write gate** — the pre-pass that classifies incoming drafts against active semantic memories (DISCARD, MERGE, CREATE) and routes them to auto-activation or the Review Inbox.

## Retrieval

- **Hybrid search** — keyword matching fused with semantic (meaning-based) matching, combined into one ranked result list.
- **Keyword search** — exact-term matching; great for phrases, code, and technical terms.
- **RAG** — retrieval-augmented generation: grounded Q&A over saved documents with numbered citations.
- **retrieve_memory** — intent-aware retrieval tool that returns a decision-ready ContextPacket (top facts, one best procedure, episodes, evidence, warnings) ranked by task applicability (`execute`, `plan`, `answer`, `verify`, `debug`).
- **Semantic search** — meaning-based matching that finds concepts even when the wording differs.
- **Snippet** — a short matching passage surfaced in search results.
- **Staged retrieval** — answer follow-up questions from already-cited documents before doing a full-library scan.

## Knowledge graph

- **Knowledge graph** — documents/memories as nodes, links as edges.
- **Auto-linker (the Librarian)** — background process that proposes related-document links with similarity scores. Pro feature.
- **Link suggestion** — a pending candidate link; approve it to make it real.
- **Typed relation** — a semantic link between memories: `derived_from`, `supports`, `contradicts`, `related_to`, `precedes`, `follows`, `part_of`.

## Agents & protocol

- **API key** — the bearer credential agents use to authenticate with your account.
- **get_latest_briefing** — MCP tool returning the workspace's weekly proactive knowledge digest, open commitments, and evolutions.
- **list_memories** — MCP tool listing memories by state (`pending_approval` = the Review Inbox, `active`, `archived`, `all`), kind, and text — the listing counterpart to `search_memory`.
- **save_document** — MCP tool that captures a page, note, or snippet into the library as a File (`reference`); it bypasses the memory write gate because Files are source material, not memories.
- **MCP** — Model Context Protocol; the standard for agent↔tool communication.
- **MCP server** — Kiomon's hosted Model Context Protocol endpoint at `https://mcp.kiomon.com/mcp`, exposing the memory-native tools to any MCP client.
- **OpenAI-compatible API** — OpenAI-shaped endpoints (`chat/completions`, `embeddings`, `models`) for any OpenAI SDK, n8n, or LangChain.
- **record_outcome** — MCP tool for task credit attribution; reports whether retrieved memories were `helpful`, `unused`, `misleading`, or `outdated` to close the learning loop.

## Account & billing

- **Plan** — Free or Pro; determines your caps and which features are enabled.
- **Trial** — the 14-day Pro trial granted at signup; no card required.
- **Quota** — the usage caps enforced per plan (documents, storage, workspaces, keys, connectors, rate limits).

## Sources & connectors

- **Connector** — a connected content source (Notion, Google Drive, Confluence) that syncs into your library.
- **Sync** — the background process that imports new and changed content from a connector.
- **OAuth connection** — the authorized link between your account and a provider, used by connectors.
- **Source** — where a document came from (extension save, highlight, note, or a specific connector).