---
title: Claude Desktop Integration
description: Connect Claude Desktop, claude.ai, and the Claude mobile apps to Kiomon's hosted MCP endpoint with a custom connector.
---

Kiomon is a **remote MCP server**, and Claude reaches remote MCP servers through
**custom connectors**. There is nothing to install, no config file to edit, and no API key
to copy: Claude discovers Kiomon's authorization server on its own and asks you to approve
the connection once.

This is the same connector across Claude Desktop, claude.ai, the Claude mobile apps, and
Cowork. Add it once on one surface and it is available on the others.

## Connect

1. In Claude, open **Settings → Connectors**.
2. Click **Add custom connector**.
3. Give it a name (for example `Kiomon`) and set the URL to:

   ```
   https://mcp.kiomon.com/mcp
   ```

4. Save. Claude connects, receives a `401`, discovers Kiomon's OAuth metadata, and opens
   the Kiomon consent screen in your browser.
5. Sign in to Kiomon if you are not already, then choose:
   - **which workspaces** the connector may reach, and
   - **read only** (default) or **read and write**.
6. Click **Allow**. Claude now has the Kiomon tools.

Nothing is pasted into a config file, and the credential that results is scoped to the
workspaces you picked — not to your whole account.

## What you are granting

Kiomon issues the connector its own credential. You can see and revoke it at any time under
**Settings → Connected Apps** in the [Kiomon dashboard](https://app.kiomon.com/settings/connected-apps).

- **Read only** lets Claude search and read your memories.
- **Read and write** additionally lets it capture new ones. Those writes still pass through
  Kiomon's write gate: high-confidence learnings auto-activate, lower-confidence ones land in
  your **Review Inbox** as pending drafts, and a workspace in `review` mode sends everything
  to review.
- Revoking under **Connected Apps** takes effect immediately — live tokens stop working, not
  just future ones.

## Using Kiomon with Claude

The MCP server supplies an autonomous agent contract during connection. When Claude is
working in a repository, also install the Kiomon `AGENTS.md` snippet or skill so the same
lifecycle is reinforced by project instructions: discover/select a workspace, load context,
retrieve task-relevant memories, then record outcomes and durable learnings without waiting
for the user to ask.

### Grounded research

> "Search my library for what I saved about vector search. Summarize the key concepts with citations."

Claude runs `search_memory` (hybrid search) and `get_memory` for the strongest hits, then answers from the retrieved content.

### Workspace briefing

> "Get context for my 'Product' workspace and tell me what I should know before working on the pricing page."

Claude calls `get_workspace_context`, loading your pinned memories, routines, and topic facts — a true pre-flight brief.

### Memory capture

Claude doesn't remember anything between sessions — that's exactly what Kiomon fixes. After a task, Claude should capture durable decisions and procedures automatically, not only when prompted:

> "Save what we decided about the onboarding flow as memories."

Claude writes the learnings via `draft_memory` or `reflect_session`. Through Kiomon's write gate, high-confidence learnings (`confidence >= 0.75`) auto-activate immediately into your brain, while lower-confidence items wait as pending drafts in your **Review Inbox**. Once active, they become permanent, retrievable knowledge — with `derived_from` edges back to the source documents.

## Troubleshooting

| Symptom | Fix |
|---|---|
| The connector saves but shows no tools | Claude could not reach `https://mcp.kiomon.com/mcp`. Check the URL has no trailing slash or typo. |
| No Kiomon consent screen appears | Your browser blocked the pop-up, or you are signed out of Kiomon. Try adding the connector again. |
| Tools appear but calls fail with `401` | The grant was revoked. Disconnect the connector in Claude and add it again. |
| Claude asks for an API key | You are on an older client without connector support. Update Claude, or use **Claude Code**, which supports headers directly. |
| Nothing in the library | Point Claude at `list_workspaces` first to discover which workspace holds your content. |
| Want to change workspace access | Revoke under **Settings → Connected Apps**, then reconnect and pick different workspaces. |

## Related

- [MCP Server](/integrations/mcp-server) — the toolset, and every other supported client.
- [API keys](/account/api-keys) — for clients that use a bearer token instead of OAuth.
