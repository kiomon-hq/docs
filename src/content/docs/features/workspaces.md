---
title: Workspaces
description: Named, isolated spaces for your documents and memories — how they work, how many you get, and how agents use them.
---

A **workspace** is a named, isolated container for documents and memories. Think of it as a folder at the top level of your brain: everything saved into a workspace stays scoped to it, and search/chat/agents operate within a workspace context.

## Why workspaces?

- **Separation of concerns** — keep "Work" research separate from "Personal" reading and an "Agent Handbook" for your assistants.
- **Clean agent context** — when an agent loads `get_workspace_context`, it gets an orienting pack for *one* workspace: pinned memories, routines, topic facts, and stats. A well-organized workspace makes your agents dramatically better.
- **Isolation** — searches, retrieval, and quotas apply per user, but documents and memories never bleed across workspace boundaries.

## Managing workspaces (dashboard)

- **Create** — Settings → Workspaces → *Create workspace*. Give it a name; Kiomon generates a slug (used in the URL) and a stable workspace ID (`ws_...`).
- **Rename** — update the name; the slug follows.
- **Switch** — the sidebar lists your workspaces; the library, memories, graph, and chat all operate in the active workspace.
- **Delete** — removes the workspace and its contents (with confirmation). Deleting a workspace is permanent.

## Workspaces from the extension

The extension popup has a workspace picker on every save. You can:

- Choose an existing workspace
- Select **+ Create New Workspace** and name it right from the popup (a small modal appears)

The extension remembers your last workspace (`lastWorkspaceId`) and preselects it next time.

## Workspaces from agents (MCP)

Agents discover and use workspaces through the toolset:

1. `list_workspaces` — returns every workspace with its ID, name, and document count. **Always call this first.**
2. `get_workspace_context(workspace_id, topic?)` — the one-shot pre-flight orient: pinned memories, procedural routines, topic-relevant facts, and stats.
3. `draft_memory` / `reflect_session` — take a `workspace_id` and write memories evaluated through the workspace's autonomous write gate. In default `autonomous` mode, high-confidence learnings (`confidence >= 0.75`) auto-activate immediately while lower-confidence items route to that workspace's Review Inbox (or all writes if set to `review` mode).

Each workspace configures its own `review_mode` toggle: `autonomous` (default) or `review` (manual approval).

:::tip[Agent best practice]
If you only operate in one workspace, cache the `workspace_id` you discover from `list_workspaces` rather than asking for it repeatedly — and always pass it explicitly so writes land in the right place.
:::

## Workspaces from the API

The REST API exposes full CRUD:

| Endpoint | Purpose |
|---|---|
| `GET /api/workspaces` | List workspaces |
| `POST /api/workspaces` | Create a workspace (plan-gated) |
| `PATCH /api/workspaces/:id` | Rename |
| `DELETE /api/workspaces/:id` | Delete |
| `GET /api/workspaces/:id/context` | Pre-flight context pack (same shape the MCP tool uses) |

## Plan limits

| Plan | Max workspaces |
|---|---|
| Free | 5 |
| Pro (incl. trial) | 50 |

Hitting the cap returns a clear error from the API; the dashboard shows an *Upgrade required* dialog where relevant. Workspaces are cheap to create, so on Free, name them intentionally.