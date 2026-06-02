# Saints Search MVP

Vite + React + TypeScript app for searching and filtering saints by location, with markdown as the source of truth and Cloudflare Workers deployment support.

## What this MVP includes

- Client-side saint search and filter UI (query, continent, country)
- Markdown ingestion pipeline that builds JSON files
- Support for two markdown input styles:
  - One saint per file in frontmatter
  - Region file with a frontmatter `saints` array
- Cloudflare Worker config that serves built assets and exposes `/api/health`

## Project structure

- `content/saints`: markdown source files
- `scripts/build-saints-index.mjs`: builds `public/data/saints.json` and `public/data/filters.json`
- `src/App.tsx`: search/filter UI
- `worker/index.ts`: Worker entry for assets + health route
- `wrangler.jsonc`: Cloudflare Worker deployment config

## Markdown format

### Option A: Region file with `saints`

```md
---
continent: Europe
country: Italy
city_or_region: Assisi
tags: [Franciscan]
saints:
  - name: Saint Francis of Assisi
    feast_day: October 4
    aliases: [Francis of Assisi]
    summary: Founder of the Franciscan Order.
---
```

### Option B: Single saint per file

```md
---
name: Saint Mary of Egypt
feast_day: April 1
continent: Africa
country: Egypt
city_or_region: Desert of the Jordan
tags: [Penitence]
aliases: [Mary of Egypt]
summary: Revered for repentance and ascetic devotion.
---
```

## Commands

- `npm run dev`: generate data and start Vite dev server
- `npm run generate:data`: build JSON from markdown only
- `npm run build`: generate data and create production bundle
- `npm run preview`: preview production build locally
- `npm run deploy`: build and deploy with Wrangler

## Cloudflare deployment

1. Build assets with `npm run build`
2. Deploy Worker and static assets with `npm run deploy`

Wrangler is configured to serve `dist` as static assets with SPA fallback.
