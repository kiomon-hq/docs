---
title: Browser Extension
description: Install, configure, and use the Kiomon browser extension to save pages, highlights, and notes while you browse.
---

import { Tabs, TabItem, Steps } from '@astrojs/starlight/components';

The Kiomon extension is the fastest way to get content into your library. It runs in your browser, extracts clean readable content from any page, and saves it to your chosen workspace with one click.

## Install

<Tabs>
	<TabItem label="Chrome / Edge / Brave">

	1. Visit the [Chrome Web Store listing](#) and click **Add to Browser**.
	2. In the extensions menu, click the **pin** icon next to Kiomon so it stays accessible in your toolbar.
	3. Open the popup to confirm it shows your dashboard session.

	</TabItem>
	<TabItem label="Firefox">

	1. Visit the [Firefox Add-ons listing](#) and click **Add to Firefox**.
	2. Pin the extension to your toolbar.
	3. Open the popup to confirm it recognizes your session.

	</TabItem>
</Tabs>

## Sign in

The extension authenticates with the same **session cookie** as the dashboard — there's no separate login. As long as you're signed in at app.kiomon.com, the extension is signed in too.

If the popup shows a sign-in screen instead of the save form, click **Sign in** or **Continue with Google** in the popup to open the dashboard and complete authentication.

## Saving pages

<Steps>
	1. Open the page you want to save.
	2. Click the **Kiomon** toolbar icon. The popup shows the page title, domain, and favicon.
	3. Pick a **workspace** from the dropdown (or choose **+ Create New Workspace**).
	4. (Optional) Add a **quick note** (up to 200 characters) and **tags** (comma-separated).
	5. Click **Save**.
</Steps>

The extension extracts the readable content of the page and converts it to clean markdown before sending it to Kiomon — no junk navigation, ads, or scripts end up in your library. When the save completes, the toolbar icon shows a green ✓ badge and the popup offers **View Saved**, which opens the document in your dashboard reader.

### Save a highlight

To save just a quote or a specific snippet:

1. Select the text on any page.
2. Right-click and choose **Save highlight to Kiomon**.

The selection is captured with the page's title and URL as a lightweight note document.

## Popup reference

| Element | What it does |
|---|---|
| Status badge | Shows save state (Ready / Saving / Saved ✓) |
| Open Dashboard | Jumps to app.kiomon.com |
| Sign in / Sign up / Google | Authentication actions when you're logged out |
| Page title, domain, favicon | Preview of what will be saved |
| Workspace selector | Where the save lands; supports creating a new workspace |
| Note input | Optional short note attached to the save (200 char max) |
| Tags input | Comma-separated tags applied to the document |
| Save button | Captures the page |
| View Saved | Opens the saved document in the reader |
| Block this Domain | Prevents saves from this domain (useful for noisy sites) |

## Permissions

The extension requests the minimum it needs:

- **activeTab & scripting** — to extract readable content from the current tab
- **storage** — to remember your last workspace
- **contextMenus** — for the *Save highlight* right-click action
- **cookies** — to read your dashboard session so you don't have to sign in separately
- **Host access** — limited to Kiomon's own domains; page extraction happens locally in your browser and only the cleaned content is sent to the Kiomon API

## What happens after a save

Behind the scenes, a save triggers the full pipeline:

1. The document is stored and indexed into the full-text search index.
2. AI auto-tagging extracts tags, entities, claims, and a domain.
3. The **auto-linker** (Pro) finds related documents and proposes link suggestions.
4. The page appears instantly in your [Library](/features/library) and is searchable immediately.