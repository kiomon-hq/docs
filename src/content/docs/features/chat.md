---
title: Chat & RAG
description: Grounded Q&A over your own library — the RAG path, the tool-using agent path, citations, and conversation memory.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

Kiomon answers questions in natural language, grounded strictly in **your own saved documents and memories**. There are two chat surfaces in the dashboard — and several programmatic ones.

## The two surfaces

| Surface | Model | Tools | Streaming |
|---|---|---|---|
| **RAG Q&A** (`/api/rag/ask`) | Answer engine, focused prompt | No | Text streaming + sources |
| **Workspace Agent** (`/api/agent/chat`) | Answer engine + tool use | `get_workspace_stats`, `list_recent_documents`, `search_knowledge_base`, `save_memory` | SSE events: tool progress → deltas → sources → saved conversation |

### RAG Q&A

The RAG path is a purpose-built grounded QA loop:

1. **Retrieve** — keyword retrieval with snippet extraction (passages, never full bodies)
2. **Stage** — follow-ups are answered first from documents **already cited in the conversation** (scoped retrieval), then fall back to a full-corpus scan
3. **Assemble** — up to 4 passages, numbered `[1]`–`[4]`, formatted as grounded context
4. **Answer** — the answer is generated **only from saved documents**; outside knowledge is not used
5. **Cite** — every answer carries numbered inline citations linked back to the source documents

### Workspace Agent

The agent path runs a tool loop:

- **`get_workspace_stats`** — corpus/usage overview before answering
- **`list_recent_documents`** — what's new in the workspace
- **`search_knowledge_base`** — hybrid retrieval on demand
- **`save_memory`** — persist durable learnings through the write gate right from chat

Stream shape (SSE):

```
data: {"type":"tool","tool":{"name":"search_knowledge_base","status":"call","detail":{...}}}
data: {"type":"delta","text":"Here's what I found…"}
data: {"type":"sources","sources":[{...citation...}]}
data: {"type":"saved","conversation":{"id":"…","title":"…","updatedAt":"…"}}
data: {"type":"error","message":"…"}
```

The dashboard's chat renders tool progress chips, streaming text, and clickable citation chips.

## Conversations

Every chat is a persisted **conversation** (stored server-side, so reopening the app on another device restores it):

- List / get / rename / delete via the REST API (`/api/rag/conversations`)
- The **rolling history** keeps the last 6 Q&A pairs verbatim; older turns are condensed into an **incremental summary** refreshed in the background after each answer — so long conversations stay coherent without blowing the context window
- Follow-up questions are staged to already-cited documents first (see above)
- Each assistant reply carries a small **token meta line** (e.g. `· 2.4K tokens`): the real token usage for that turn, persisted with the message so it survives reloads

## Asking good questions

- **Be explicit about scope**: *"What did I save about Stripe checkout?"* beats *"Tell me about Stripe."*
- **Chain follow-ups** — the agent remembers the conversation and prefers cited docs.
- **Ask for summaries** — *"Summarize the key API patterns in the docs I saved this week."*
- **Ask it to save** — end a research session with *"Save the key takeaways as memories."* High-confidence learnings auto-activate immediately through the write gate, while lower-confidence ones land in your Review Inbox for approval (or all writes if your workspace is set to `review` mode).

## Programmatic access

| Endpoint | Purpose |
|---|---|
| `POST /api/rag/ask` | Grounded RAG answer (streaming). The single writer for conversations. |
| `GET /api/rag/sources` | List your recent sources/citations |
| `GET/PATCH/DELETE /api/rag/conversations` | Conversation CRUD |
| `POST /api/agent/chat` | Tool-loop agent chat (SSE) |
| `POST /v1/chat/completions` | OpenAI-compatible grounded chat (see [OpenAI-Compatible API](/integrations/openai)) |

## Rate limits & plans

Free/Pro daily caps apply per surface (e.g. agent turns, RAG asks). All AI surfaces also share a **daily token budget** (Free 100K / Pro 2.5M tokens/day, org-aware) — the chat header shows "AI left" once half the day's budget is spent, and the agent streams a friendly "Daily AI budget reached" card with an upgrade CTA when it's exhausted. The `/v1/chat/completions` path rate-limits per key/plan too. Upgrading raises the caps significantly — see [Plans & Quotas](/account/billing).

## Grounding & safety

The answer engine is always constrained to your library: answers are generated only from saved documents, with citations. A client-supplied system message can flavor the style but can never override the “answer from your saved documents only” rule.