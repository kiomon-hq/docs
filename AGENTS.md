# Agent guidelines — kiomon-hq/docs

The public documentation site for Kiomon. It publishes [docs.kiomon.com](https://docs.kiomon.com).
Read `README.md` for the repository map.

## Ground rules

1. **These pages are for users, not builders.** A page explains what a feature does, how to
   use it, what it costs, and what behaviour to expect. It never explains how Kiomon is put
   together.
2. **No implementation detail, anywhere in this repository.** No infrastructure, service or
   vendor names, no environment variables, no schema or table names, no queue or endpoint
   internals, no code-level specifics (chunk sizes, cache tiers, model params), no deploy
   steps beyond the generic "merge to `main` deploys". Internal material lives in a separate
   repository, not here.
3. **Do not invent figures.** No testimonials, benchmarks, retention or performance numbers
   exist beyond what is measured and committed. If a page needs a number and the repository
   does not have one, leave it out.
4. **Limits must match.** Plan caps, quotas and prices appear on more than one page; the
   comparison table in `account/billing.md` is the reference. When a number changes, every
   page that states it changes in the same commit.

## Commands

```bash
npm ci
npm run dev              # http://localhost:4321
npm run build            # must pass before you claim a change works
npm run check:sidebar    # after a build: every sidebar slug resolves
npm run preview
```

The dev server can be backgrounded — `astro dev --background`, then
`astro dev status` / `astro dev logs` / `astro dev stop`.

`npm run build` is the whole check. CI runs the same build plus
`scripts/check-sidebar.mjs`; there are no tests, no linters and no typecheck of page content.

## Adding or changing a page

- Markdown or MDX under `src/content/docs/`. The sidebar in `astro.config.mjs` is the only
  navigation — a page missing from it is orphaned. Every sidebar `slug` must map to a rendered
  page (`check-sidebar.mjs` enforces it, so a typo is a red CI run, not a 404 in production).
- Do not change existing slugs casually: they are live URLs
  (`https://docs.kiomon.com/...`) and external sites link to them. Renaming one means finding
  the old path elsewhere first.
- Cross-link with relative slugs (`/features/search`), not full URLs, so a future domain change
  does not rot the content.
- Use MDX components (`Tabs`, `Steps`, `CardGrid`, `LinkCard`) from
  `@astrojs/starlight/components` for how-tos and parallel options.
- Keep the reader's vocabulary. Public pages explain behaviour a user can rely on, not the
  implementation that produces it.

## Theme

`public/custom.css` is the runtime source of truth, served verbatim and linked straight from
`<head>`; it must not go through the Vite/Lightning CSS pipeline, which re-nests the flat
overrides into invalid `&` chains and silences them. `src/styles/custom.css` mirrors it by
copy. Edit both, or the change is invisible in one of the two places it is read. `DESIGN.md`
is the design system of record.

Starlight overrides live in `src/components/`: `SiteTitle.astro` (mark + wordmark + Docs chip),
`ThemeToggle.astro` (segmented Light/Dark, replacing Starlight's cycling select). They depend
on Starlight's contract — `localStorage 'starlight-theme'`, `documentElement.dataset.theme`,
`StarlightThemeProvider.updatePickers` — not on private internals.

## Deployment

Merge to `main` deploys. There is no dev/staging environment and no manual step: the workflow
builds, verifies `dist/index.html`, and uploads the directory to the Pages project. Credentials
are repository Actions secrets, never files in this repository.

Two consequences:

- **A broken `main` is a broken public site.** The workflow can verify that a page built, not
  that it is true. Run `npm run build` locally, and do not merge on a red run hoping to fix it
  after.
- **Do not add a second deploy path.** One owner per site is the point — no Pages
  "connect to git" build, and no workflow that deploys from a branch other than `main`.

## Publication checklist

Before a change lands, the questions worth asking:

- Does any sentence here describe how the system is built, rather than what a user gets?
- Does any identifier, hostname, project name, table, queue or environment variable appear?
- Is every number (price, cap, limit) the same number the rest of the site states?
- Does every relative link resolve to a page that exists?

## Documentation of the harness itself

Astro documentation: https://docs.astro.build. Consult these before working on related tasks:

- [Routing, dynamic routes, middleware](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling](https://docs.astro.build/en/guides/styling/)
