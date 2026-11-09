# Kiomon Docs — Design System

> Written from the built world (2026-08-24). The docs surface inherits the
> established brand world of the Kiomon marketing site; operative file: `public/custom.css`
> (served verbatim — see "CSS pipeline" below).

## World

The documentation site is a **Read-mode surface inside the brand's visual
world**: a warm **cream canvas** (`#F8F7F5`) with **ink structural plates**
(`#141412`-family), a **signal-orange accent** (`#CF4500` / `#C33F00` light,
`#F37338` dark), and a floating **glass header** (`blur(16px) saturate(180%)`
+ hairline bottom border). Dark and light are **equal citizens** behind a
segmented Light/Dark toggle in the header — no default, both tuned.

## Tokens

Mapped onto Starlight's color roles (`--sl-color-*`) per theme:

| Role | Light | Dark |
|---|---|---|
| Canvas (`--sl-color-bg`) | `#F8F7F5` | `#050505` |
| Raised surface (`--sl-color-surface`) | `#FFFFFF` | `#0D0D0D` |
| Headings (`--sl-color-white`) | `#141413` | `#EDEDED` |
| Body (`--sl-color-gray-2`) | `#4C4941` | `#D4D4D8` |
| Muted (`--sl-color-gray-3`) | `#746F63` | `#A1A1AA` |
| Hairline | `rgba(20,20,19,.07)` | `rgba(255,255,255,.07)` |
| Accent (`--sl-color-accent`) | `#C33F00` (≥4.5:1 on canvas) | `#F37338` |
| Accent text / links | `#B53C00` (resting), hover `#C33F00` | `#FF8F5E` / `#FF8F5E` |
| Tint (`--sl-color-accent-low`, bg-accent) | `#FFF7F2` | `#2E1405` |

Semantic callout colors (note/tip/caution/danger) are brand-warm derivations
(blue/green/orange/red) with light `*-low` tints and dark `*-low` inks above.

## Type

- **Display:** Bricolage Grotesque (headings, wordmark) — 620 weight,
  `-0.02em` letter-spacing, `text-wrap: balance`
- **Body:** Inter, 17px (1.0625rem), line-height 1.7, 48rem measure
- **Data/mono:** JetBrains Mono — code, table headers, sidebar group labels
  (10.5–11px, uppercase, `0.06–0.08em` tracking), the "Docs" chip

## Chrome

- **Header:** 64px glass shell; mark (`/logo.svg`) + "Kiomon" wordmark + Docs
  chip; search (hairline pill, ⌘K hint); **Light/Dark segmented toggle**
  (replaces Starlight's cycling select; honors `localStorage 'starlight-theme'`
  + `documentElement.dataset.theme` + `StarlightThemeProvider.updatePickers`);
  stays visible on mobile (`right-group` display override under 51rem)
- **Sidebar:** flat group labels, hairline item hover, orange-tinted active
  item with a 3px left rail
- **Content:** inline code tinted hairline chips; code blocks ink plates
  (rounded 12px) in both themes; tables = hairline frame, **row-only
  separators**, 16px first-column padding, JetBrains Mono uppercase header,
  12px radius + soft shadow, tinted row hover; callouts = tinted panels with
  1px colored edge; cards 14px radius with lift-on-hover
- **On-this-page:** raised hairline panel, quiet links, orange current item
- **Browser surfaces:** orange `::selection` (inverted text), warm thin
  scrollbar, orange caret + focus ring, `prefers-reduced-motion` honored

## Behavior

- Theme choice persists (Starlight's contract); initial theme follows the
  stored choice else system preference.
- Motion is restrained: hover lifts on cards/pagination/link-cards (exponential
  ease-out `cubic-bezier(0.16,1,0.3,1)`); no entrance animation in docs.

## CSS pipeline (important constraint)

`public/custom.css` is the **runtime source of truth** and is linked directly
in `<head>` (`/custom.css`). It **must not** go through the Vite/Lightning CSS
transform, which re-nests flat overrides into invalid `&` chains and silences
them. `src/styles/custom.css` mirrors it by copy — keep both in sync.

## Assets

Brand assets in `public/` are copied verbatim from the marketing site's brand set:
`logo.svg` (header mark), `favicon.ico` + `favicon-16x16.png` +
`favicon-32x32.png` + `apple-touch-icon.png`, `kiomon-open-graph.png` (OG).