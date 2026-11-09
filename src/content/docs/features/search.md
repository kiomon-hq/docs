---
title: Search
description: Hybrid keyword + semantic search, how results are combined, and how to get the most out of it.
---

Kiomon search is **hybrid**: it combines an exact **keyword** index with **semantic** matching, so you find things by phrase *and* by meaning.

## How it works

Search runs across two complementary legs and their results are fused into one ranked list:

| Leg | Strengths |
|---|---|
| **Keyword** | Exact phrases, technical terms, code identifiers, quotes |
| **Semantic** | Meaning and paraphrase — matching even when your wording differs from the saved text |

Documents that match strongly in *both* legs rank highest; something only the semantic leg understands still surfaces. If the semantic leg isn't available for a deployment, search automatically degrades to keyword-only — you always get results, never a hard failure.

## Search behavior

- **Clean queries** — searches are scrubbed server-side; malformed input can't break the index
- **AND-first, OR fallback** — matches on all your terms first; if nothing matches, the query loosens
- **Prefix matching** — partial terms like `stripe*` work for technical content
- **Snippets** — results come back with clean snippets of the matching passage
- **Kind filter** — narrow to a memory kind (`semantic`, `procedural`, `episodic`, `reference`) — e.g. search only *Facts* or only *Routines*
- **Workspace scoping** — restrict a search to a specific workspace

## Where search appears

1. **Dashboard library** — type-ahead, live search over the active workspace
2. **MCP `search_memory`** — how your agents search your brain (hybrid, with kind filters)
3. **REST `GET /api/search?q=...`** — scripted access for any tool

## Index freshness

The search index stays in sync with your library automatically:

- New saves and approved memories are searchable immediately
- Archived items are hidden from results
- Deleted or forgotten items are removed from search entirely

No manual indexing, no rebuilds.

## Rate limits

Search is rate-limited per plan with a per-day quota on each API key; exceeding it returns a clear message. Pro gets a 25× higher quota — see [Plans & Quotas](/account/billing).

## Tips

- Search reads naturally: both `chat webhook docs` and `how do I receive webhooks` find the same content (that's the semantic leg at work).
- For code or library names, rely on keyword matching — exact tokens win.
- Agents: always pass `kind` when you know what you're looking for, and prefer `get_workspace_context(topic)` for open-ended orienting over a bare search.