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

## Branches, review and merge

Two long-lived branches, and one rule about each:

| Branch | What it is | How a change reaches it |
|---|---|---|
| `develop` | The integration branch. Everything lands here first. | A pull request from a feature branch. |
| `main` | Production. A push to it publishes. | `develop` merged into it by a person, after review. |

**Never push a content change straight to `main`.** Merge to `main` deploys a public site with
no staging environment behind it, so the last thing between a typo and `docs.kiomon.com` is the
review on the pull request that put it on `develop`.

### The loop

```sh
cd docs
git fetch origin
git worktree add ../wt-<task> -b <branch> origin/develop
cd ../wt-<task>
# edit, then:
npm run build && npm run check:sidebar
git add <paths>
git commit
gh pr create --base develop --fill
```

After the merge:

```sh
git worktree remove ../wt-<task>
```

Then, when `develop` is ready to publish, a person opens a pull request from `develop` into
`main`, reads the diff as a reader rather than as an author, and merges it. That merge is the
deploy. It is not a routine step: it is the only moment anyone looks at what is about to be
live, all at once.

### One checkout per agent

A checkout has one HEAD and one index, shared by every process using it. Two agents in one
checkout commit onto each other's branches, and one agent's `git switch` moves the other's work
out from under it. If a checkout holds a branch that is not yours — or files you do not own —
make a worktree instead of switching.

Before committing, check three things: you are on your branch (`git branch --show-current`), the
tree holds only your files (`git status --short`), and you are not behind (`git fetch origin`,
then compare with `origin/develop`). Stage explicitly (`git add <path>`), never `git add -A`,
unless the worktree is yours alone.

### What a pull request has to say

CI checks that the site builds and that every sidebar slug resolves. It cannot check whether a
sentence is true, whether a number matches the rest of the site, or whether a page describes
how Kiomon is built instead of what a user gets. That is what the description is for:

- which pages changed, and the one sentence worth reading in each;
- any number (price, cap, limit) touched, and the page it now has to agree with;
- whether a slug moved. A changed slug is a broken external link unless the old path is
  redirected, so say so explicitly.

## Deployment

`main` publishes. Merging `develop` into `main` is the release: there is no staging site and no
manual step after it. The deploy workflow builds the site and uploads `dist/` to the Pages
project configured for this repository, which serves `docs.kiomon.com`.

Project name and credentials live in the repository's Actions variables and secrets, never in
the repository. A pull request runs the same build plus `scripts/check-sidebar.mjs`, so a typo
in a sidebar slug is a red build rather than a 404 in production.

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
