---
title: MCP Server
description: Connect any MCP client to Kiomon — setup, authentication, and a full reference for the memory-native tools and control plane.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

The **Kiomon MCP server** is a standard Model Context Protocol server that exposes your Kiomon brain to any MCP-capable client: Cursor, Claude Desktop, Windsurf, Cline/Roo, Zed, and more. Agents get a **memory-native toolset** — read, search, retrieve, and write to your brain through an **autonomous write gate** that auto-activates high-confidence memories (`confidence >= 0.75` or high-authority sources) while routing lower-confidence drafts to your Review Inbox (or opt into manual `review` mode per workspace).

## Connect remotely (no install)

The fastest way to get going is the **hosted MCP endpoint** — no Node, no `npx`, no
local process to run. Point your agent at one URL with your **API key** as a bearer
token, and Kiomon serves the same tools (always the latest version) from the cloud.

- **Endpoint:** `https://mcp.kiomon.com/mcp`
- **Auth:** your [API key](https://app.kiomon.com) as an `Authorization: Bearer <key>` header
- **Requires:** an MCP client that supports remote / Streamable HTTP servers

<Tabs>
	<TabItem label="Claude Code (CLI)">

	```bash
	claude mcp add kiomon --transport http https://mcp.kiomon.com/mcp --header "Authorization: Bearer <your-kiomon-token>"
	```

	</TabItem>
	<TabItem label="Cursor">

	File `.cursor/mcp.json` (or *Settings → Features → MCP* → **+ Add New MCP Server** with type `url`):

	```json
	{
	  "mcpServers": {
	    "kiomon": {
	      "type": "http",
	      "url": "https://mcp.kiomon.com/mcp",
	      "headers": { "Authorization": "Bearer <your-kiomon-token>" }
	    }
	  }
	}
	```

	</TabItem>
	<TabItem label="Gemini CLI">

	File `~/.gemini/settings.json` (project-level `.gemini/settings.json` works too) — note
	`httpUrl`, which selects the Streamable HTTP transport; a plain `url` is read as SSE:

	```json
	{
	  "mcpServers": {
	    "kiomon": {
	      "httpUrl": "https://mcp.kiomon.com/mcp",
	      "headers": { "Authorization": "Bearer <your-kiomon-token>" }
	    }
	  }
	}
	```

	</TabItem>
	<TabItem label="Codex CLI">

	File `~/.codex/config.toml`:

	```toml
	[mcp_servers.kiomon]
	url = "https://mcp.kiomon.com/mcp"
	http_headers = { "Authorization" = "Bearer <your-kiomon-token>" }
	```

	</TabItem>
	<TabItem label="VS Code">

	File `.vscode/mcp.json`:

	```json
	{
	  "servers": {
	    "kiomon": {
	      "type": "http",
	      "url": "https://mcp.kiomon.com/mcp",
	      "headers": { "Authorization": "Bearer <your-kiomon-token>" }
	    }
	  }
	}
	```

	</TabItem>
	<TabItem label="Windsurf">

	File `~/.codeium/windsurf/mcp_config.json`:

	```json
	{
	  "mcpServers": {
	    "kiomon": {
	      "serverUrl": "https://mcp.kiomon.com/mcp",
	      "headers": { "Authorization": "Bearer <your-kiomon-token>" }
	    }
	  }
	}
	```

	</TabItem>
</Tabs>

## Claude Desktop

Claude Desktop reaches remote MCP servers through **custom connectors**, so there is no config
file to edit and no API key to copy — Claude discovers the authorization server itself and asks
you to approve the connection once.

1. In Claude, open **Settings → Connectors → Add custom connector**.
2. Set the URL to `https://mcp.kiomon.com/mcp`.
3. Approve the Kiomon consent screen: choose which workspaces Claude may reach, and read-only
   (default) or read-and-write.

The same connector covers claude.ai, the Claude mobile apps, and Cowork. Revoke it under
**Settings → Connected Apps** in the Kiomon dashboard. The
[Claude Desktop guide](/integrations/claude) has the full walkthrough.

`claude_desktop_config.json` is **stdio-only**: a remote `url` entry there is ignored, and a
malformed one can corrupt the file. Remote MCP lives in the Connectors UI, not that file.

## The tools

### `list_workspaces`

Discover your **organizations and workspaces**: org id/name/role, per-workspace id/name/role, document counts, plus the default workspace and your connection's selected workspace.

| Param | Type | Required | Notes |
|---|---|---|---|
| — | — | — | No arguments |

**Agent guidance:** call this first in any session to learn the layout. If one workspace is dominant, `select_workspace` it so optional-workspace tools use it by default.

### `select_workspace`

Set this connection's **working workspace**. Tools with an optional `workspace_id` (`search_memory`, `retrieve_memory`, `record_outcome`) fall back to it; an explicit `workspace_id` argument on a call always overrides. Writes (`draft_memory`, `reflect_session`, `get_workspace_context`) still require an explicit `workspace_id`.

| Param | Type | Required | Notes |
|---|---|---|---|
| `workspace_id` | string | ✅ | From `list_workspaces`; must be an accessible workspace |

**Agent guidance:** select once after discovery instead of repeating `workspace_id` on every read call. Selection is per-connection and Kiomon re-validates every request — it is a convenience, not an authorization mechanism.

### `get_workspace_context`

One-shot **pre-flight orient**: pinned memories, active Routines (procedural rules the user wants followed), topic-relevant Facts, and workspace stats.

| Param | Type | Required | Notes |
|---|---|---|---|
| `workspace_id` | string | ✅ | From `list_workspaces` |
| `topic` | string | — | Surfaces the top facts about a topic |

**Agent guidance:** call once up front before doing work in a workspace. It also reports pending Review Inbox items you may manage.

### `search_memory`

Hybrid search (full-text + semantic) with clean snippets and friendly kind labels.

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | ✅ | Keywords, phrases, or natural language |
| `kind` | string | — | Filter: `semantic` (Facts), `procedural` (Routines), `episodic` (Moments), `reference` (Files); comma-separated |
| `workspace_id` | string | — | Restrict search to a workspace |
| `limit` | number | — | Default 10, max 50 |

**Agent guidance:** use this FIRST before answering questions about topics the user may have saved.

### `get_memory`

Fetch a memory or reference document in full — body, strength/decay stats, and 1-hop graph relations.

| Param | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✅ | ID from search/results |
| `include_relations` | boolean | — | Include connected graph edges (default `true`) |

Returns: kind (friendly label), source, created date, strength, confidence, pinned flag, tags, body, relations.

### `retrieve_memory`

Intent-aware retrieval: declare what you are doing (`intent`) and receive a decision-ready ContextPacket (top facts, one best procedure, relevant episodes, evidence references, and warnings) re-ranked by applicability (not just similarity).

| Param | Type | Required | Notes |
|---|---|---|---|
| `intent` | string | ✅ | What you are trying to do: `execute`, `plan`, `answer`, `verify`, `debug` |
| `query` | string | ✅ | Retrieval query (keywords, phrases, or natural language) |
| `entities` | string[] | — | Optional entity IDs/names the task concerns |
| `constraints` | string[] | — | Optional current-state hints for applicability (e.g. `"order status is pending"`). Never persisted. |
| `kinds` | string[] | — | Optional memory-kind filter: `semantic`, `procedural`, `episodic`, `reference` |
| `workspace_id` | string | — | Restrict retrieval to a workspace |
| `risk_level` | string | — | Optional risk level: `low`, `medium`, `high` |
| `limit` | number | — | Maximum items to return (default 6, max 20) |

**Agent guidance:** use this INSTEAD of `search_memory` when you know your goal (`execute | plan | answer | verify | debug`). It delivers an actionable packet instead of raw search hits.

### `explore_memory_graph`

Walk the knowledge graph from a starting memory; trace evidence trails.

| Param | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✅ | Starting memory |
| `relation` | string | — | One of `derived_from`, `supports`, `contradicts`, `related_to`, `precedes`, `follows`, `part_of` |
| `depth` | number | — | `1` or `2` hops (default 1) |
| `workspace_id` | string | — | Workspace the memory lives in (defaults to the selected one) |

### `reflect_session`

**Batch-commit learnings** at the end of a session (1–25 items).

| Param | Type | Required | Notes |
|---|---|---|---|
| `workspace_id` | string | ✅ | Target workspace |
| `learnings[]` | array | ✅ | Each: `kind`, `title`, `body` (+ optional `excerpt`, `confidence`, `tags`, `source_refs`, `entities`, `claims`, `domain`) |

Each learning:

| Field | Required | Notes |
|---|---|---|
| `kind` | ✅ | `semantic` (Teach it / a Fact), `procedural` (Automate it / a Routine), `episodic` (Log this / a Moment) |
| `title` | ✅ | Short title |
| `body` | ✅ | Full content |
| `excerpt` | — | Card subheading (the line under the title) |
| `confidence` | — | 0–1 (controls the autonomous write gate; `>= 0.75` auto-activates) |
| `tags` | — | Up to 20 |
| `source_refs` | — | IDs of memories/docs derived from (wired as `derived_from` on activation) |
| `entities` | — | People/products/projects — **skips Kiomon's paid extraction** when provided |
| `claims` | — | Verifiable facts — skips extraction when provided |
| `domain` | — | Topic label — skips extraction when provided |

:::tip[Why supply entities/claims/domain?]
You, the agent, already understand the content you're writing. Supplying these three fields makes memories immediately searchable and consolidatable (filters, graph, contradiction checks), and saves a paid AI extraction pass per memory. The receive-side schema maxes at 60 entities / 60 claims / 120-char domain.
:::

### `draft_memory`

Single-memory variant of `reflect_session` for one focused fact, rule, or event (same fields as a single learning + `workspace_id`).

### `manage_memory`

Memory governance, feedback, and decision reversal.

| Param | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✅ | Target memory |
| `action` | string | ✅ | `pin`, `unpin`, `archive`, `restore`, `forget`, `rate`, `approve`, `reject`, `revert` |
| `value` | number | only for `rate` | `1` (useful) or `-1` (not useful) |

Actions:

- `pin` — exempt from decay, ranks top
- `unpin` — return to normal dynamics
- `archive` — soft-hide from retrieval (recoverable)
- `restore` — un-archive
- `forget` — permanent purge
- `rate` — ±1 feedback (requires `value`)
- `approve` — promote a pending Review Inbox draft to active memory
- `reject` — archive a pending draft
- `revert` — undo a write-gate decision (restores a superseded/quarantined memory, or demotes an auto-activated memory back to pending)

### `get_latest_briefing`

Read the workspace's weekly proactive knowledge digest.

| Param | Type | Required | Notes |
|---|---|---|---|
| `workspace_id` | string | ✅ | Workspace ID from `list_workspaces` |

Returns the headline, week-over-week delta, active themes, hidden connections (recent ↔ historical), resurfaced evergreen pearls, open commitments, and knowledge evolutions. Returns an explicit "none yet" when no edition exists.

**Agent guidance:** call this to orient on what the user has been working on and which commitments are open without re-reading the raw corpus.

### `record_outcome`

Report how retrieved memories performed after completing a task to close the learning loop.

| Param | Type | Required | Notes |
|---|---|---|---|
| `outcome` | string | ✅ | Task end state: `success` or `failure` |
| `items` | object[] | ✅ | Array of `{ memory_id: string, assessment: string }` (1–50 items) |
| `workspace_id` | string | — | Optional workspace ID |

Assessment options for each item:
- `helpful` — used and helped (+1 feedback, increases confidence)
- `unused` — retrieved but not needed (small penalty)
- `misleading` — used and caused an error (confidence multiplied by 0.85, logs failure evidence)
- `outdated` — stale or expired fact (triggers expiration)

**Agent guidance:** call this after a task when you reliably know which retrieved memories contributed. Do not guess — omitted memories remain untouched.

### `save_document`

Capture a page, note, or pasted text into the library as a **File** (`reference`). This is the capture side of the brain — source material the user wants kept and searchable — and it deliberately does **not** go through the memory write gate. Use `draft_memory` / `reflect_session` when the content is something the agent learned and should be governed as a memory.

| Param | Type | Required | Notes |
|---|---|---|---|
| `body` | string | ✅ | The content to save (markdown or plain text) |
| `title` | string | — | Short title (defaults to the URL or "Untitled") |
| `source_url` | string | — | Canonical URL; also the duplicate key for the workspace |
| `excerpt` | string | — | One-line summary shown on the library card |
| `tags` | string[] | — | Up to 20 |
| `workspace_id` | string | — | Defaults to the selected workspace |

Processing (extraction, chunking, embedding) runs in the background: the document is listed immediately and becomes searchable once ready. A document already saved at the same URL answers with its existing id instead of creating a duplicate.

### `list_memories`

The listing counterpart to `search_memory`, for questions a query cannot express: what is waiting for review, what is live, what was archived.

| Param | Type | Required | Notes |
|---|---|---|---|
| `workspace_id` | string | — | Defaults to the selected workspace |
| `status` | string | — | `pending_approval` (the Review Inbox, default), `active`, `archived`, `all` |
| `kind` | string | — | `semantic`, `procedural`, `episodic`, `reference` |
| `q` | string | — | Text filter over title and body |
| `limit` / `offset` | number | — | Page size (default 50, max 200) and offset |

**Agent guidance:** check the Review Inbox when the user asks what needs their attention, and pass a draft id to `manage_memory(id, action: "approve")` to activate it or `"reject"` to archive it.

## The write-gate and review-inbox contract

Kiomon uses an **autonomous write gate** to control memory promotion, replacing the old model where every single write required manual approval:

- **Review modes:** Each workspace has a `review_mode` toggle:
  - `autonomous` (**DEFAULT**): Memories auto-activate when their source is high-authority, OR when an agent reflection's `confidence >= 0.75`. Lower-confidence reflections wait in the Review Inbox as pending drafts.
  - `review`: All agent writes land in the Review Inbox for manual approval (the fully-manual behavior, now an opt-in mode per workspace).
- **Write-gate pre-pass:** Before saving, incoming drafts are classified against existing active semantic memories:
  - **DISCARD** — all claims already exist in active memory; nothing new to store.
  - **MERGE** — some claims are new; folded directly into the existing fact without adding a redundant row.
  - **CREATE** — nothing overlaps; drafted or auto-activated.
- **Contradiction and quarantine:** A low-authority claim that contradicts a pinned or higher-authority fact is **quarantined**: kept, hidden from retrieval, and flagged with a `contradicts` edge so it can never silently overwrite a user's fact. Contradictions can also reduce the older memory's confidence by half.
- **Auditable and revertible:** Every autonomous write-gate action is soft (archived, never hard-deleted) and visible in the **"Kiomon's decisions"** feed in the dashboard Review Inbox. Every decision can be undone via `manage_memory` with `action: "revert"` (restores a superseded or quarantined memory, or demotes an auto-activated memory back to pending).

**Agent guidance:** You control the gate directly through `confidence`. Set `confidence >= 0.75` when you are sure of a learning to allow immediate auto-activation; set lower confidence when uncertain so the user can inspect and approve it in the Review Inbox.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Tools don't appear in client | Restart the client and confirm the connector is enabled |
| `401` on tool calls | Key revoked or wrong environment — regenerate in Settings → API Keys |
| Wrong workspace data | You passed no `workspace_id` or the wrong one — run `list_workspaces` first |
| `Memory not found (404)` | The memory may be archived or deleted — search again or check the Review Inbox |
