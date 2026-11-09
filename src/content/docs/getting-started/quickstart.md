---
title: Quickstart
description: Get Kiomon running in five minutes — account, first save, and a connected agent.
---

import { Steps, Tabs, TabItem } from '@astrojs/starlight/components';

This guide gets you from zero to a connected agent in about five minutes. You'll sign up, save
your first page, create the key an agent uses, and wire Kiomon into your AI coding assistant.

## 1. Create your account

Open the [Kiomon dashboard](https://app.kiomon.com) and sign up with Google or GitHub.

Every new account starts with a **14-day Pro trial** — no card required. You get full Pro features
(auto-linking, connectors) and fall back to Free automatically when the trial ends.

<Steps>
	1. Go to **app.kiomon.com** and sign in.
	2. Kiomon creates a default workspace for you (you can rename it, or add more — Free accounts get 5, Pro gets 50).
	3. That's it. Your library is empty and ready.
</Steps>

## 2. Save your first page

The [browser extension](/features/extension) is how you save pages and highlights while you browse.

<Steps>
	1. Install Kiomon in Chrome, Edge, or Brave from the Chrome Web Store.
	2. Pin it to the toolbar so it is one click away.
	3. Open a page you want to keep, click the **Kiomon** icon, and confirm the workspace at the bottom.
	4. Click **Save**. The badge turns to a green ✓.
</Steps>

The extension signs in with the same session as the dashboard, so there is no second login. A saved
page appears in your [library](/features/library) immediately and is searchable within seconds —
tagging and the knowledge graph catch up in the background.

:::tip[Save as you read]
Saving while you browse is what makes the next step useful: your agent answers from *your*
reading, not from the open web.
:::

## 3. Create an API key

Agents authenticate with an API key — the dashboard session is for you, a key is for your tools.

<Steps>
	1. Open **Settings → API Keys** in the dashboard.
	2. Click **Generate Key** and label it for the tool you are about to connect (for example `cursor`).
	3. Copy the key now. It is shown once; only its prefix is readable afterwards.
</Steps>

Keep it out of source control — set it as an environment variable, or paste it where the client
stores credentials. [API Keys](/account/api-keys) covers scoping, rotation and revocation.

## 4. Connect your agent

<Tabs>
	<TabItem label="Cursor">

	1. Open **Cursor Settings** (⌘+, on Mac / Ctrl+, on Windows) → **Features** tab.
	2. Scroll to **MCP** and click **+ Add New MCP Server**.
	3. Set:
		- **Name:** `kiomon`
		- **Type:** `url`
		- **URL:** `https://mcp.kiomon.com/mcp`
		- **Headers:** `Authorization: Bearer <your-api-key>`
	4. Restart Cursor (or toggle the server) and check that the Kiomon tools appear.

	</TabItem>
	<TabItem label="Claude Code">

	```bash
	claude mcp add kiomon --transport http https://mcp.kiomon.com/mcp --header "Authorization: Bearer <your-api-key>"
	```

	</TabItem>
	<TabItem label="Claude Desktop">

	Claude Desktop uses a **custom connector** rather than a config file, so there is no key to
	paste. Open **Settings → Connectors → Add custom connector** and set the URL to:

	```
	https://mcp.kiomon.com/mcp
	```

	Approve the Kiomon consent screen, choose your workspaces, and allow. The same connector
	covers claude.ai and the Claude mobile apps. See the
	[Claude Desktop guide](/integrations/claude).

	</TabItem>
</Tabs>

Any other remote-capable MCP client takes the same two inputs — the endpoint and your key:

```json
{
  "url": "https://mcp.kiomon.com/mcp",
  "headers": { "Authorization": "Bearer <your-api-key>" }
}
```

## 5. Ask your agent

With the MCP server connected, your agent can query your library. Try:

> "Search my Kiomon library for what I saved about Cloudflare Workers and summarize the key points."

Or after a focused reading session:

> "Based on the Stripe docs I just saved, how would I create a checkout session?"

Anything your agent decides is worth remembering can be drafted as a memory — through Kiomon's autonomous write gate, high-confidence reflections (`confidence >= 0.75`) auto-activate immediately, while lower-confidence items land in your dashboard **Review Inbox** for approval (or switch your workspace to `review` mode to require manual approval for everything).

## Next steps

- Learn the [core concepts](/getting-started/concepts) — documents, memories, workspaces, and the graph.
- Deep-dive the [browser extension](/features/extension) and [library](/features/library).
- Set up [content connectors](/features/connectors) to sync Notion, Google Drive, or Confluence.
- Read the [MCP tool reference](/integrations/mcp-server) to see what your agent can actually do.
- Writing code instead of prompting? Start with the [SDK](/sdk) or the [REST API](/reference/api).
