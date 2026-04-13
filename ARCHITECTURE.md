# afourblog Architecture Guide

This file is the day-to-day maintenance map for the Astro blog. `CLAUDE.md` remains the authority for project decisions and constraints; this file explains where to make changes and how to verify them.

## Mental Model

The site is a static Astro blog.

- Markdown content lives in `src/content/posts`.
- Astro pages in `src/pages` generate routes at build time.
- Shared page chrome and metadata live in `src/layouts/BaseLayout.astro`.
- Article rendering is wrapped by `src/layouts/PostLayout.astro`.
- Most React components are server-rendered only. A component becomes browser JavaScript only when an Astro `client:*` directive is used.
- Search is static. Pagefind scans built HTML after `astro build`.
- Deployment is GitHub Actions to GitHub Pages for the user site `https://a444447.github.io`.

## Key Files

| Area | File | Purpose |
|---|---|---|
| Astro config | `astro.config.mjs` | Site URL, integrations, Markdown plugins, sitemap |
| Site constants | `src/lib/site.ts` | Site title, author, description, RSS, sitemap, OG defaults |
| Content schema | `src/content/config.ts` | Front matter validation for posts |
| Content helpers | `src/lib/content.ts` | Published post filtering, sorting, categories, tags |
| Base layout | `src/layouts/BaseLayout.astro` | HTML shell, head metadata, header, theme init, search, Pagefind body marker |
| Post layout | `src/layouts/PostLayout.astro` | Article title block and markdown wrapper |
| Global CSS | `src/styles/global.css` | Fonts, tokens, paper grain, prose styles, KaTeX/Expressive Code spacing |
| Home | `src/pages/index.astro` | Homepage and latest post list |
| Article route | `src/pages/posts/[...slug].astro` | Static article page generation |
| Archive | `src/pages/archive.astro` | Chronological post list |
| Categories | `src/pages/categories.astro`, `src/pages/categories/[category].astro` | Category index and category pages |
| Tags | `src/pages/tags.astro`, `src/pages/tags/[tag].astro` | Tag index and tag pages |
| RSS | `src/pages/rss.xml.ts` | Full-content RSS feed |
| Search island | `src/components/islands/SearchBox.tsx` | Client-side Pagefind search UI |
| Theme island | `src/components/islands/ThemeToggle.tsx` | Client-side theme toggle |
| Static card | `src/components/static/PostCard.tsx` | Build-time rendered post card |
| Deploy workflow | `.github/workflows/deploy.yml` | Build and deploy to GitHub Pages |
| Hugo migration | `scripts/migrate-hugo-posts.mjs` | One-off/re-runnable Hugo content migration helper |
| Migration report | `migration-report.md` | Record of migrated and skipped old Hugo posts |

## Common Changes

### Add A New Post

Create a directory under `src/content/posts`:

```text
src/content/posts/YYYY-MM-DD-english-slug/index.md
```

Use front matter that matches `src/content/config.ts`:

```md
---
title: "文章标题"
date: 2026-04-13
description: "一到两句话摘要。"
category: "技术"
tags:
  - astro
  - blog
draft: false
---

正文内容。
```

Rules:

- Do not add a manual `slug` field. The directory name is the slug.
- `category` must be exactly one of `技术`, `读书`, `生活`, `随笔`.
- Put images beside the article and reference them with relative paths, for example `![alt](./diagram.png)`.
- Use `draft: true` for private drafts. Drafts are filtered from routes, RSS, sitemap, and search.

Verify:

```bash
npm run build
```

### Add Or Rename A Category

Edit `src/content/config.ts` and `src/lib/content.ts` together.

- Add the category to the Zod enum in `src/content/config.ts`.
- Add it to the display order in `getAllCategories()` inside `src/lib/content.ts`.
- Update any existing posts that should use the new category.

Do not put categories into article URLs. Article URLs stay `/posts/<slug>`.

Verify:

```bash
npm run build
```

### Change Site Metadata

Edit `src/lib/site.ts` first.

Common changes:

- `SITE.name` and `SITE.title`: visible site name and RSS/head title.
- `SITE.description`: default meta description.
- `SITE.author`: RSS author.
- `SITE.ogImage`: default Open Graph image.

If changing the deployed domain, edit both:

- `src/lib/site.ts`: `SITE.url`
- `astro.config.mjs`: `site`

The current site does not need an Astro `base` because it is deployed as a GitHub Pages user site at the domain root.

Verify:

```bash
npm run build
```

### Change Header Or Page Chrome

Edit `src/layouts/BaseLayout.astro`.

This file owns:

- `<head>` metadata
- favicon/manifest/RSS/sitemap links
- canonical URL
- Open Graph/Twitter tags
- theme initialization script
- sticky header
- global `main` wrapper
- `data-pagefind-body` marker

Keep the header mostly static. Only add a React island if the element requires browser-side JavaScript.

### Change Article Styling

Edit `src/styles/global.css` for prose rules and `src/layouts/PostLayout.astro` for the article header.

Use the existing `.article-prose` class instead of Tailwind Typography defaults. The project intentionally avoids default `prose` styling because the visual system is custom.

Code blocks are currently rendered by Expressive Code default styling with copy buttons. Do not re-enable custom Expressive Code theme overrides unless it is an explicit visual iteration.

### Change Homepage, Archive, Categories, Or Tags

Use these files:

- Homepage: `src/pages/index.astro`
- Archive: `src/pages/archive.astro`
- Categories index: `src/pages/categories.astro`
- Category page: `src/pages/categories/[category].astro`
- Tags index: `src/pages/tags.astro`
- Tag page: `src/pages/tags/[tag].astro`

Shared post-list data should come from `src/lib/content.ts`, not from duplicate `getCollection()` logic in each page.

### Change Search

Search has two parts:

- UI island: `src/components/islands/SearchBox.tsx`
- Build index: `package.json` script `build`

The build script must remain in this order:

```bash
astro build && pagefind --site dist --output-subdir _pagefind
```

Pagefind does not work during `npm run dev` because the `_pagefind` assets are generated after a production build. Test search with:

```bash
npm run build
npm run preview
```

Then open the preview URL and use the search box.

### Change Theme Toggle

Theme logic is split intentionally:

- Initial theme is set by inline JavaScript in `BaseLayout.astro` before the page renders.
- Button behavior lives in `src/components/islands/ThemeToggle.tsx`.
- Visual changes rely on the `dark` class on `<html>`.

Do not use React Context for theme state. Astro islands are independent React roots, so context does not cross island boundaries.

### Change RSS

Edit `src/pages/rss.xml.ts`.

Current policy:

- Full-content RSS.
- Drafts excluded through `getPublishedPosts()`.
- Links depend on `SITE.url`.

If RSS output changes, run a build and inspect `dist/rss.xml`.

### Change Deployment

Edit `.github/workflows/deploy.yml`.

Current policy:

- Push to `main` triggers deploy.
- Manual `workflow_dispatch` is enabled.
- Build job uses Node 20 and `npm ci`.
- Deploy job uses `actions/deploy-pages`.
- Do not add a `gh-pages` branch workflow.

GitHub repository settings must use:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

### Re-run Or Adjust Hugo Migration

The original migration source is hard-coded in `scripts/migrate-hugo-posts.mjs`:

```text
/Users/afourseven/blog/content/posts
```

Dry-run:

```bash
node scripts/migrate-hugo-posts.mjs
```

Write mode:

```bash
node scripts/migrate-hugo-posts.mjs --write
```

Important:

- The script refuses to overwrite an existing target post directory.
- It skips drafts, missing `title`, missing `date`, invalid draft values, and explicit Hugo/shortcode demo files.
- It converts Hugo shortcodes to plain Markdown or raw HTML instead of recreating a shortcode system.
- It normalizes unsupported code fence languages for Expressive Code.

## Verification Checklist

Run this before pushing meaningful changes:

```bash
npm run build
```

Use this when checking search behavior:

```bash
npm run build
npm run preview
```

Build outputs are ignored by Git:

- `dist/`
- `.astro/`
- `node_modules/`

Do not commit generated build output.

## Constraints Not To Break

- Keep the site static-first. Do not introduce SSR unless there is a concrete reason.
- Keep React islands small. Do not hydrate entire pages or headers.
- Do not use React Context for state shared across islands.
- Do not move post images to `public/` unless they are truly global assets like favicon or OG defaults.
- Do not add `slug` front matter.
- Do not make `category` multi-value.
- Do not add categories or tags to article URLs.
- Do not replace Pagefind with a backend search for the static version.
- Do not use MathJax; KaTeX is the locked math renderer.
- Do not switch deployment to `gh-pages` branch.
- Do not reintroduce Hugo-style shortcode architecture. Convert old shortcode usage into Markdown or raw HTML.

## Current Known Follow-ups

- Confirm the GitHub Pages Source setting is set to GitHub Actions.
- Check the first GitHub Actions deploy run after pushing.
- Decide whether to delete or replace the dummy article `src/content/posts/2026-04-11-astro-blog-setup/index.md`.
- Optionally clean migrated article descriptions and old remote image references over time.
