/**
 * Kiomon
 * Copyright (c) 2026 Kiomon. All rights reserved.
 *
 * Documentation Astro Configuration
 * Configures Starlight documentation theme and build settings.
 *
 * This repository owns the public documentation surface: the product guides
 * published at docs.kiomon.com. Only `src/content/docs/` is built and served;
 * nothing here describes how Kiomon is built — see README.md for the rule.
 *
 * Visual direction: inherits the Kiomon brand world (cream canvas, ink
 * structural plates, signal-orange accent, Bricolage Grotesque / Inter /
 * JetBrains Mono) with a floating glass header and a segmented Light/Dark
 * toggle. The theme is served verbatim from public/custom.css — it bypasses
 * the Vite/Lightning CSS transform, which re-nested the flat overrides into
 * invalid `&` chains and silenced them. Keep src/styles/custom.css in sync
 * by copying it to public/ when editing.
 */

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const FONT_STACK = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';

// https://astro.build/config
export default defineConfig({
	// Docs are served at docs.kiomon.com — used for canonical URLs and SEO
	// metadata. Committed rather than read from the environment so a local build
	// and a CI build cannot disagree.
	site: 'https://docs.kiomon.com',
	integrations: [
		starlight({
			title: 'Kiomon Docs',
			favicon: '/favicon.ico',
			head: [
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{
					tag: 'link',
					attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
				},
				{ tag: 'link', attrs: { rel: 'stylesheet', href: FONT_STACK } },
				{ tag: 'link', attrs: { rel: 'stylesheet', href: '/custom.css' } },
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: '/kiomon-open-graph.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
			],
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
				ThemeSelect: './src/components/ThemeToggle.astro',
			},
			lastUpdated: true,
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Welcome', slug: '' },
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
						{ label: 'Core Concepts', slug: 'getting-started/concepts' },
					],
				},
				{
					label: 'Core Features',
					items: [
						{ label: 'Browser Extension', slug: 'features/extension' },
						{ label: 'The Library', slug: 'features/library' },
						{ label: 'Workspaces', slug: 'features/workspaces' },
						{ label: 'Memories & Review Inbox', slug: 'features/memories' },
						{ label: 'Knowledge Graph', slug: 'features/knowledge-graph' },
						{ label: 'Search', slug: 'features/search' },
						{ label: 'Chat & RAG', slug: 'features/chat' },
						{ label: 'Content Connectors', slug: 'features/connectors' },
					],
				},
				{
					label: 'Agents & Integrations',
					items: [
						{ label: 'MCP Server', slug: 'integrations/mcp-server' },
						{ label: 'Cursor', slug: 'integrations/cursor' },
						{ label: 'Claude Desktop', slug: 'integrations/claude' },
						{ label: 'OpenAI-Compatible API', slug: 'integrations/openai' },
					],
				},
				{
					label: 'SDK',
					items: [
						{ label: 'Overview', slug: 'sdk' },
						{ label: 'SDK Reference', slug: 'sdk/reference' },
						{ label: 'Errors & Retries', slug: 'sdk/errors' },
					],
				},
				{
					label: 'Account & Billing',
					items: [
						{ label: 'API Keys', slug: 'account/api-keys' },
						{ label: 'Plans & Billing', slug: 'account/billing' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'REST API', slug: 'reference/api' },
						{ label: 'The Ingest Contract', slug: 'reference/ingest' },
						{ label: 'Webhooks', slug: 'reference/webhooks' },
						{ label: 'Glossary', slug: 'reference/glossary' },
					],
				},
				{
					label: 'Research',
					items: [
						{ label: 'Memory Benchmarks', slug: 'research/memory-benchmarks' },
					],
				},
				{
					label: 'Help',
					items: [{ label: 'Contact & Support', slug: 'contact' }],
				},
			],
		}),
	],
});