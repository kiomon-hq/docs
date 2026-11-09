---
title: Cursor Integration
description: Connect Kiomon's MCP server to Cursor so the editor can query your saved documentation, notes, and memories.
---

Cursor has first-class support for the Model Context Protocol (MCP). By connecting Kiomon, Cursor's Composer and Chat can instantly query the documentation, GitHub issues, PRs, and notes you've been reading and saving — then write new learnings back as persistent memories through Kiomon's write gate.

## Configure the MCP server

1. Open **Cursor Settings** (⌘ + , on Mac, Ctrl + , on Windows).
2. Navigate to the **Features** tab.
3. Scroll to the **MCP** section.
4. Click **+ Add New MCP Server** and configure:
   - **Name:** `kiomon`
   - **Type:** `url`
   - **URL:** `https://mcp.kiomon.com/mcp`
   - **Headers:** `Authorization: Bearer <your-api-key>`
5. Click **Save**. Cursor connects to the hosted endpoint — nothing runs on your machine.

Or add it to your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kiomon": {
      "type": "http",
      "url": "https://mcp.kiomon.com/mcp",
      "headers": { "Authorization": "Bearer <your-api-key>" }
    }
  }
}
```

You can also run the one-line installer from the dashboard's **Settings → Agents & MCP** tab, which
writes the same remote-server config for the clients it detects.

## Verify the connection

- In **Settings → Features → MCP**, the `kiomon` server should show a green check.
- Expand it to see the 14 registered tools: `list_workspaces`, `select_workspace`, `get_workspace_context`, `search_memory`, `get_memory`, `retrieve_memory`, `explore_memory_graph`, `draft_memory`, `reflect_session`, `manage_memory`, `get_latest_briefing`, `record_outcome`, `save_document`, `list_memories`.
- Cursor may ask you to trust the project before it enables the server.

## Using it in Chat / Composer

Once connected, Cursor's agent can retrieve context you've browsed. Try asking:

> "Based on the Stripe documentation I was just reading, how do I create a checkout session?"

> "Search my Kiomon library for what I saved about Cloudflare Workers."

Cursor routes the request through the MCP server, queries your knowledge base (hybrid search), and returns the exact references you were looking at — with sources.

### Autonomous session lifecycle

Cursor receives Kiomon's MCP agent contract, and the project skill/`AGENTS.md` reinforces it. At session start it should discover and select the workspace, load `get_workspace_context`, and use `retrieve_memory` before context-sensitive work. At task end it should record reliable memory outcomes and reflect durable learnings without waiting for a separate save request.

### End-of-session reflection

Kiomon shines when Cursor recaps. It may also be triggered automatically by the agent after a long task:

> "Reflect on this session and save what you learned about our deploy process as memories."

Cursor records the learnings (facts, routines, moments) through the write gate. In default autonomous mode, high-confidence learnings (`confidence >= 0.75`) auto-activate immediately into your brain, while lower-confidence ones land in your **Review Inbox** for approval (or all writes wait for review if your workspace uses `review` mode). Once active, they become permanent, searchable memories with `derived_from` links back to the docs they came from.

## Tips

- **Let it orient:** at the start of a workspace-heavy task, Cursor's `get_workspace_context` loads your pinned memories and routines — the more you pin, the better its behavior.
- **Save what you read:** using the extension while you browse means Cursor answers from *your* research, not the open web.
- **Staged follow-ups:** RAG answers prefer already-cited documents, so drill into a topic with follow-up questions rather than re-asking from scratch.