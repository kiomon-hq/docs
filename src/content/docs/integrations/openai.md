---
title: OpenAI-Compatible API
description: Use any OpenAI SDK, n8n, LangChain, or agent framework against your Kiomon brain by swapping a base URL and API key.
---

Kiomon exposes an **OpenAI-compatible surface** at `/v1`: any tool that speaks the OpenAI protocol can point at your brain by changing the base URL and API key. No custom SDKs, no glue code.

## Supported endpoints

| Endpoint | What it does |
|---|---|
| `GET /v1/models` | List available models: `kiomon-rag` and `kiomon-embed` |
| `POST /v1/chat/completions` | **Grounded Q&A** over your saved library (stream + non-stream, numbered citations attached) |
| `POST /v1/embeddings` | Embed text via the vector service (when enabled) |
| `GET /v1/context` | Kiomon extension: the principal's orgs, reachable workspaces, roles, and default workspace — discover the workspace id before calling chat |

## Authentication

```http
Authorization: Bearer <your-kiomon-api-key>
```

Keys are managed in Dashboard → Settings → API Keys. Requests are rate-limited per key and plan, with the same limits that apply across Kiomon.

## Point any OpenAI client at Kiomon

```python
from openai import OpenAI

client = OpenAI(
    api_key="kiomon-api-key",
    base_url="https://api.kiomon.com/v1",
)

resp = client.chat.completions.create(
    model="kiomon-rag",
    messages=[{"role": "user", "content": "How do I create a checkout session in Dodo Payments?"}],
)
print(resp.choices[0].message.content)
```

The same pattern works with `curl`, the `openai` Node SDK, LangChain, and any OpenAI-compatible agent framework.

```bash
curl https://api.kiomon.com/v1/chat/completions \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kiomon-rag",
    "messages": [{"role": "user", "content": "Summarize what I saved about Cloudflare Workers"}],
    "stream": true
  }'
```

## What `chat/completions` gives you

- **Grounded answers** — the RAG system prompt is always applied: the model answers *only from your saved documents*, with numbered inline `[1]…[4]` citations in the text.
- **Streaming** — SSE-style token stream (`stream: true`).
- **Model allow-list** — you request `kiomon-rag`; clients can't request an arbitrary model.
- **Stateless** — send the full context each turn (OpenAI semantics); nothing is persisted to a conversation store on this path. Use the dashboard chat or `/api/rag/ask` for persisted multi-turn conversations.

## Using it with n8n / Make

1. Add an **OpenAI** node and set:
   - Base URL: `https://api.kiomon.com/v1`
   - API Key: your Kiomon key
2. Model: `kiomon-rag`
3. Send the user's question as a message — the node returns the grounded answer with sources.

Exactly the same for LangChain:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="kiomon-rag",
    api_key="kiomon-api-key",
    base_url="https://api.kiomon.com/v1",
)
```

## Embeddings

`/v1/embeddings` returns semantic embeddings for your text using the same model that powers Kiomon's semantic search.

Use it to:

- Embed your own content before storing it elsewhere
- Compare documents semantically
- Build retrieval pipelines that share Kiomon's embedding space

## Safety & constraints

- **Multimodal parts are dropped** — this is a text-only brain
- **System-message coercion is prevented** — a client-supplied `system` message becomes "instruction flavor"; it can never override *answer only from saved documents*
- **Context is scoped** — answers cite and quote your library, never hallucinated web content

## Rate limits

Free/Pro daily caps per key: chat and embedding quotas are separate. See [Plans & Quotas](/account/billing) for numbers.