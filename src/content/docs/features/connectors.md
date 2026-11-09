---
title: Content Connectors
description: Sync content from Notion, Google Drive, and Confluence — OAuth setup, sync behavior, and what happens to the content.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

Connectors bring your existing content into Kiomon automatically — no copy-pasting. Connect a source once; Kiomon syncs it on a schedule and on demand, converting each item into a searchable document.

## Available connectors

| Connector | Status | Type | What syncs |
|---|---|---|---|
| **Notion** | Active | OAuth | Pages from your workspace(s) |
| **Google Drive** | Active | OAuth | Files (Google Docs, Sheets-ish, PDFs, text) from your Drive |
| **Confluence Cloud** | Active | OAuth | Pages from a Confluence space (offset-paginated, full space sync) |

:::note[Roadmap]
GitHub, Slack, Linear, Jira, Dropbox, and Discord are on the roadmap (shown as *Coming soon* in the dashboard's connector catalog).
:::

## Connecting a source

<Tabs>
	<TabItem label="Notion">

	1. Dashboard → **Connectors** → *Add connection* → **Notion**.
	2. Authorize with your Notion account (OAuth, scoped and revocable).
	3. Kiomon catalogues your workspace pages and kicks off the initial sync immediately.
	4. The connector stays in `syncing` until the first pass completes; afterwards it re-syncs on schedule and via the **Sync now** button.

	</TabItem>
	<TabItem label="Google Drive">

	1. Dashboard → **Connectors** → *Add connection* → **Google Drive**.
	2. Authorize with Google. Tokens are stored encrypted and **auto-refreshed** when they expire.
	3. Choose what to sync (a file picker lets you select files or folders).
	4. Syncs convert documents to clean text; subsequent syncs pick up changes.

	</TabItem>
	<TabItem label="Confluence Cloud">

	1. Dashboard → **Connectors** → *Add connection* → **Confluence Cloud**.
	2. Authorize with Confluence.
	3. Pick the **spaces** you want (the dashboard lists them).
	4. Large spaces sync fully in one trigger thanks to offset-based **sync continuation** — Kiomon re-dispatchs itself hop-by-hop until the space is complete, instead of waiting for the next scheduled run.

	</TabItem>
</Tabs>

## How sync works under the hood

The sync pipeline is asynchronous and chunked:

```
Connector trigger (connect, manual "Sync now", or schedule)
    │
    ▼
Source content is fetched (paginated, rate-limit safe)
    │
    ▼
Items stream back in batches and become documents
    │
    ▼
A "synced" state once the run completes; new items are
indexed, auto-tagged, and graphed like any other save
```

Key properties:

- **Bulk-safe** — a large Notion workspace or Drive folder syncs fully in one trigger (no waiting for the next scheduled run)
- **Consistent state** — the connector stays in `syncing` until the run completes, then flips to `synced`; a stalled sync is surfaced so you can re-trigger it
- **Reconciliation** — content removed from the source is cleaned up during sync
- **Usage is checked before each sync**, so you're never surprised by a half-sync at your plan limit

## Managing connectors

| Action | Where |
|---|---|
| Connect | Dashboard → Connectors → *Add connection* |
| Sync now | Connector card → *Sync* (or via API `POST /api/connectors/:id/sync`) |
| Rename / toggle | Connector settings |
| Remove | Disconnect — token and synced items are cleaned up (content you already saved is kept unless you delete it) |
| Flows | Notion spaces, Google Drive picker, Confluence spaces provide purpose-built selection UIs |

## Plan limits

Connectors are a **Pro feature**. Free has no connector access at all — the catalog, the connect
flow, and **Sync / Import** are refused with a `402` and an upgrade prompt.

- **Free**: not available
- **Pro** (incl. trial): up to 300 connectors
- **Enterprise**: up to 1,000 connectors

The API enforces this at every entry point (connect start, OAuth callback, create, sync, provider
browsing, and the sync write-back), so the tier cannot be bypassed by calling the API directly.

Already-connected sources are **not deleted** when a plan drops to Free: they stay listed so you can
see them and disconnect them, and documents they already imported stay in your library. Only new
connections and further syncs are blocked.

## Security model

- OAuth tokens are **encrypted at rest** and never returned by the API
- Credentials are scoped per user; disconnecting a connector revokes access to your provider account
- Sync runs entirely server-side; nothing about it is callable from your client

## API surface

| Endpoint | Purpose |
|---|---|
| `GET /api/connectors` | List connectors |
| `POST /api/connectors` | Create a connector (OAuth stub) |
| `GET /api/connectors/connections` | List the user's OAuth connections |
| `DELETE /api/connectors/connections/:id` | Disconnect |
| `PATCH /api/connectors/:id` | Update config (spaces, folders, label) |
| `POST /api/connectors/:id/sync` | Trigger a manual sync |
| `GET /api/connectors/:id/confluence/spaces` | List Confluence spaces |
| `POST /api/connectors/:id/google/token` | Exchange a Drive token |

Sync processing runs server-side and is not callable from your client.