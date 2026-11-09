/**
 * Kiomon
 * Copyright (c) 2026 Kiomon. All rights reserved.
 *
 * Documentation Content Configuration
 * Defines content collections schema for documentation articles.
 */

import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
