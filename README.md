# Kiomon documentation

The public documentation for Kiomon — the context engine for AI agents. Published at
[docs.kiomon.com](https://docs.kiomon.com): product guides, the REST API, the SDK, the MCP
server, and the ingest and webhook contracts.

Built with [Astro Starlight](https://starlight.astro.build) and deployed to Cloudflare Pages.
Everything under `src/content/docs/` is the published site; the rest of the repository is the
build, the theme and the CI that ships it.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:4321
```

Build, preview, verify:

```bash
npm run build            # → dist/
npm run preview
npm run check:sidebar    # every sidebar slug must have a rendered page (CI runs this)
```

## What lives here

```
src/content/docs/          ← the published site. Nothing outside this is served.
├── index.mdx              Welcome
├── getting-started/       Quickstart, core concepts
├── features/              Extension, library, workspaces, memories, knowledge
│                          graph, search, chat, connectors
├── integrations/          MCP server, Cursor, Claude Desktop, OpenAI-compatible API
├── sdk/                   SDK overview, reference, errors & retries
├── account/               API keys, plans & quotas
└── reference/             REST API, the ingest contract, webhooks, glossary

public/                    verbatim assets: theme CSS, logos, favicons, OG image
src/components/            Starlight overrides (SiteTitle, ThemeToggle)
src/styles/custom.css      mirror of public/custom.css — see "Theme" below
scripts/check-sidebar.mjs  CI check: no sidebar link may point at an unbuilt page
.github/workflows/         ci.yml (PR build) and deploy.yml (merge → Pages)
```

## The one rule

**These pages are written for people who use Kiomon, not for people who build it.**

A page explains what a feature does, how to use it, what it costs, and what behaviour to
expect. It never explains how Kiomon is put together: no infrastructure, service or vendor
names, no environment configuration, no schema, no deploy steps, no internal endpoints.

Implementation detail does not belong in this repository at all. If a sentence is only
useful to someone operating the system, it is in the wrong place.

## Writing pages

- Docs are Markdown (`.md`) or MDX (`.mdx`) under `src/content/docs/`. Grouping and slugs are
  defined in the sidebar in `astro.config.mjs`; adding a page means adding it there too, or
  nothing links to it.
- Use Starlight components (`Tabs`, `Steps`, `CardGrid`, `LinkCard`) for interactive how-tos,
  imported from `@astrojs/starlight/components`.
- Cross-link with relative slugs (`/integrations/mcp-server`), not full URLs.
- Do not rename existing slugs casually: they are live URLs, and other sites link to them.
- Update the docs in the same change that changes user-facing behaviour. A page that
  describes last quarter's behaviour is worse than no page.

## Theme

`public/custom.css` is the runtime source of truth for the visual theme and is linked directly
from `<head>`. It deliberately bypasses the Vite/Lightning CSS transform, which re-nests the
flat overrides into invalid `&` chains and silences them.

`src/styles/custom.css` is a mirror kept by copy. Editing the theme means editing both — if
they disagree, the served one is `public/`.

The design system (tokens, type, chrome, behaviour) is written down in [`DESIGN.md`](DESIGN.md).

## Deploying

Merge to `main` publishes to production. There is no staging site and no manual step: the
deploy workflow builds the site and uploads `dist/` to the Pages project configured for this
repository, which serves `docs.kiomon.com`.

Project name and credentials live in the repository's Actions variables and secrets, never in
the repository. A pull request runs the same build plus `scripts/check-sidebar.mjs`, so a typo
in a sidebar slug is a red build rather than a 404 in production.

## Licence

© Kiomon. All rights reserved. The documentation text and brand assets are not licensed for
redistribution; the site's build configuration is published for transparency.
