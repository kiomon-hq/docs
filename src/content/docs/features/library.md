---
title: The Library
description: Manage every saved document — browse, filter, tag, read in reader mode, link, archive, and delete.
---

The **Library** is the dashboard view of everything you've saved. It's where captured content becomes a usable knowledge base.

## Browsing

The library lists documents as cards, newest first, paginated. Each card shows:

- **Title and domain** — where the content came from
- **Excerpt** — the auto-extracted summary
- **Tags** — auto-tagged or manually assigned
- **Source badge** — how it got in (extension, connector, note, highlight)
- **Thumbnail** — when available

Use the filter bar to narrow the list down:

- **Search** — live full-text search across titles, bodies, and excerpts
- **Tags** — filter by one or more tags
- **Source/connector** — show only content from a specific source (Notion, Drive, Confluence, manual saves)
- **Type** — documents vs. memories vs. highlights

## Reader mode

Click any card to open the **reader**: a distraction-free markdown view with:

- Clean typography and full-screen reading
- Syntax-highlighted code blocks
- Inline rendering of links within the saved content
- **Edit** — you can edit title, excerpt, body, and tags
- **Link suggestions** — approve/reject auto-linker suggestions from the sidebar
- **Copy / Archive / Delete** actions

The reader supports the same markdown your content was saved in, so code-heavy documentation reads exactly as intended.

## Actions on documents

| Action | What it does |
|---|---|
| **Edit** | Update title, excerpt, body, or tags |
| **Tag** | Add/remove tags; tagging normalizes duplicates |
| **Link** | Manually connect this document to another (free on every plan) |
| **Unlink** | Remove a manual or approved link |
| **Archive** | Soft-hide the document from lists and search (restorable) |
| **Restore** | Bring an archived document back |
| **Forget / Delete** | Permanently purge the document and its index entries |

Archived documents stay in your storage and can be restored any time. Deleting is permanent and removes the document from search, embeddings and the graph.

## Bulk actions

Select multiple documents to run bulk operations:

- **Bulk delete** — with a confirmation dialog listing exactly what will be removed
- **Bulk archive** — tidy up a workspace without destroying content

## Where the library data lives

The library is powered by a [REST API](/reference/api). Everything you see is retrieved on demand, and search results come back with matching snippets so even a huge library stays instant. Large documents are always available in full when you open them in the reader.