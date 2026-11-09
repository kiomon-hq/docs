---
title: API Keys
description: Create and manage the API keys that let agents, scripts, and tools authenticate to Kiomon.
---

Every agent, script, and tool that talks to Kiomon — MCP servers, the OpenAI-compatible API, REST calls — authenticates with an **API key**.

## Creating a key

1. Open the dashboard → **Settings → API Keys**.
2. Click **Generate Key** (optionally give it a label, e.g. *cursor*, *n8n*, *ci-scripts*).
3. **Copy the key immediately** — it's shown only once at creation and stored securely, so it can't be recovered later.

## Using a key

| Surface | Where the key goes |
|---|---|
| MCP server | `Authorization: Bearer <key>` header |
| OpenAI-compatible API | `Authorization: Bearer <key>` |
| REST API | `Authorization: Bearer <key>` |
| Extension | Automatic — uses your dashboard session cookie instead |

## Finding your keys

`GET /api/keys` lists your keys with their `id`, `prefix` (first 16 chars, for identification), `label`, `tier`, and `created_at`. You'll never see the full key again — only the prefix for recognition.

## Managing keys

- **Security best practice** — one key per tool, labeled, so you can revoke a single access path without breaking others.
- **Revoke** — delete the key (the DELETE endpoint or the dashboard). Revocation is immediate: any client using the key starts getting `401`s.
- **Create more** — Free accounts can hold **2** keys; Pro **25**, Enterprise **50**. The cap is per billing entity (your account, or an organization) and the API enforces it with a `402` upgrade response.

## Scoping a key to workspaces

A key does not have to carry your whole account. When you create one you can grant it specific
workspaces and a permission:

| Field | Values | Effect |
|---|---|---|
| `workspace_ids` | workspace ids | With grants present, the key reaches **only** those workspaces — never your other workspaces, even the ones you are a member of. |
| `permission` | `read` \| `write` | `read` maps to a viewer role (reads and searches only); `write` maps to an editor role (may ingest, draft, and manage memories). |
| `type` + `org_id` | `"organization"` | Creates an **organization service key** owned by the org rather than by you. Admin-only. It is always grants-only, so it needs at least one `workspace_ids` entry. |
| `service_account` | name | Optional durable identity for an org service key, so its requests and audit entries are attributable. |
| `expires_at` | ISO-8601 | Optional expiry; after it the key answers `401`. |

Rules that matter when integrating:

- A key with grants and no `workspace_id` on the request resolves to its **single** grant; with
  several grants it fails closed (`400`) rather than guessing, and with none it is refused.
- `GET /api/workspaces` with a scoped key lists exactly the granted workspaces, with `my_role`
  derived from the grant — that is how a client discovers which ids it may pass.
- A connector token issued over OAuth is narrower still: it can reach only the memory routes, and
  its scope (`memory:read` / `memory:write`) caps what it can do there.

## Rotating a key

1. Create a new key.
2. Update your MCP configs / scripts to the new key.
3. Delete the old key.

Because both keys work until the old one is deleted, rotation is zero-downtime.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `401` on every call | Key wrong, revoked, or regenerated since your config was written |
| `402` on key creation | At the plan's key limit — upgrade or delete an unused key |
| MCP calls return `401` | The `Authorization` header is missing, or the key was revoked |