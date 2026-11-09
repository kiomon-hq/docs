#!/usr/bin/env node
/**
 * Kiomon
 * Copyright (c) 2026 Kiomon. All rights reserved.
 *
 * Every `slug` in the Starlight sidebar (astro.config.mjs) must resolve to a
 * page the build actually rendered. The build does not fail on a typo — it
 * ships a sidebar link to a 404 — so CI runs this after `npm run build`.
 *
 * A slug maps to a directory index: '' → dist/index.html, 'sdk' →
 * dist/sdk/index.html, 'reference/api' → dist/reference/api/index.html.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = readFileSync(join(root, 'astro.config.mjs'), 'utf8');
const dist = join(root, 'dist');

const slugs = [...config.matchAll(/slug:\s*'([^']*)'/g)].map((m) => m[1]);
if (slugs.length === 0) {
	console.error('check-sidebar: no slugs found in astro.config.mjs — did the sidebar shape change?');
	process.exit(1);
}

const missing = [];
for (const slug of slugs) {
	const file = slug === '' ? join(dist, 'index.html') : join(dist, slug, 'index.html');
	if (!existsSync(file)) missing.push(slug === '' ? '/' : `/${slug}`);
}

if (missing.length > 0) {
	console.error(`check-sidebar: ${missing.length} sidebar slug(s) did not render:`);
	for (const miss of missing) console.error(`  - ${miss}`);
	process.exit(1);
}

console.log(`check-sidebar: ${slugs.length} sidebar slugs resolved to built pages`);
