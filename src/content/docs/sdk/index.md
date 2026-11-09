---
title: SDK
description: Build Kiomon memory into your own product with the typed TypeScript client — install, authentication, quickstart, and how it relates to MCP and the REST API.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

The **Kiomon SDK** is a typed TypeScript client for building persistent memory into your own
product. It gives you the same **memory-native verbs** as Kiomon's hosted MCP server, method for
method, so a capability you already use from an agent you can call from code — capture what your
users read and decide, retrieve it with provenance, and govern its lifecycle. (Library capture and
the Review Inbox listing are MCP/REST-only today; the SDK mirrors the 12 memory verbs the two
surfaces share.)

It has **zero runtime dependencies** and uses the global `fetch`, so it runs anywhere: Node 18+,
browsers, Bun, Deno, and Cloudflare Workers.

## Install

<Tabs>
	<TabItem label="npm">

	```bash
	npm install @kiomon/kiomon
	```

	</TabItem>
	<TabItem label="unscoped alias">

	```bash
	npm install kiomon
	```

	</TabItem>
</Tabs>

Both names are the same SDK — `kiomon` re-exports `@kiomon/kiomon`, so they cannot differ in
behaviour. Use whichever import you prefer:

```ts
import { Kiomon } from "@kiomon/kiomon";
// or
import { Kiomon } from "kiomon";
```

## Quickstart

```ts
import { Kiomon } from "@kiomon/kiomon";

const kiomon = new Kiomon({ apiKey: process.env.KIOMON_API_KEY! });

// 1. Ask for a decision-ready packet rather than a list of documents.
const packet = await kiomon.retrieveMemory({
  intent: "execute",
  query: "how does our deploy pipeline work?",
});

// packet.facts / packet.procedure / packet.episodes carry claims, confidence
// and source provenance. packet.conflicts and packet.warnings tell you where the
// brain disagrees with itself — surface those instead of silently picking one.

// 2. Tell the brain whether it helped. This is what makes ranking and decay honest.
await kiomon.recordOutcome({
  outcome: "success",
  items: packet.retrieved_ids.map((memory_id) => ({
    memory_id,
    assessment: "helpful",
  })),
});
```

Saving works the same way round:

```ts
await kiomon.reflectSession({
  learnings: [
    {
      kind: "semantic",
      title: "Deploys go through the GitHub Actions workflow",
      body: "Prod deploys are a manual workflow_dispatch on deploy.yml, never on push.",
      // Providing entities/claims/domain makes the memory immediately searchable
      // and skips a paid AI extraction pass.
      entities: ["deploy.yml", "GitHub Actions"],
      claims: ["Production deploys require a manual workflow dispatch"],
      domain: "release engineering",
    },
  ],
});
```

Writes go through the same **write gate** as the dashboard: a high-confidence learning may
activate immediately, anything uncertain lands in the Review Inbox rather than silently becoming
knowledge. See [The tools](/integrations/mcp-server/#the-write-gate-and-review-inbox-contract)
for what that gate does in detail.

## Authentication

| Mode | Option | Header | Use for |
|---|---|---|---|
| Server-side key | `apiKey` | `X-API-Key` | Your backend, worker, or agent service |
| Delegated OAuth | `token` | `Authorization: Bearer` | Acting on behalf of *your* user |

```ts
// A function is resolved per request, so refreshing a token needs no client rebuild.
const kiomon = new Kiomon({ token: async () => await getKiomonTokenFor(user) });
```

Create a key in **Settings → API keys** in the dashboard. A key is scoped to a workspace with a
`read` or `write` permission; `write` is required for any of the writing verbs.

:::caution[Delegated tokens are confined]
An OAuth token is restricted by the API's default-deny allowlist to the memory routes
(`/workspaces`, `/documents`, `/memories`, `/retrieve`, `/search`, `/graph`). It cannot reach key
management, account, organisation or billing endpoints — so `request()` is **not** a general escape
hatch in that mode. A read-only grant also maps to a `viewer` role, and write verbs then fail with
`insufficient_role`.
:::

## Workspaces

Every memory lives in a workspace. Pass `workspaceId` to the constructor, or let the SDK resolve it:

- **Exactly one workspace** — resolved silently and cached, matching the MCP server's behaviour.
- **Several workspaces** — an error naming them, rather than a guess. Writing a memory into the
  wrong brain is worse than failing.
- **None** — an error pointing you at the dashboard to create one.

```ts
const kiomon = new Kiomon({ apiKey }).selectWorkspace("ws_…");
```

## SDK, MCP, or REST?

| Surface | Reach for it when |
|---|---|
| **SDK** | You are writing application code — a backend, an agent service, a scheduled job, a product feature. Typed responses, retries and safe write retries included. |
| [**MCP server**](/integrations/mcp-server) | You are connecting an existing MCP client (Cursor, Claude Code, VS Code, Windsurf) and want the agent to use memory as a tool. No code to write. |
| [**REST API**](/reference/api) | You are in a language the SDK does not cover yet, or need a route the SDK does not wrap. `request()` reaches any route from TypeScript. |
| [**OpenAI-compatible API**](/integrations/openai) | You have an OpenAI-shaped client and want a drop-in base URL. |

The SDK and the MCP server speak the same vocabulary on purpose: a method here and a tool there take
the same arguments and mean the same thing, so you can move between them without relearning
anything.

## Next

- [**SDK reference**](/sdk/reference) — the client options, all 12 verbs, and the shapes they return.
- [**Errors & retries**](/sdk/errors) — the failure contract, error codes, and idempotent writes.
