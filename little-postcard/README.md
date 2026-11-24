# Little Postcard

_A little place to pause._ — a cinematic video archive (Vietnamese, light theme).

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · Supabase-ready content layer.

> This app lives in `little-postcard/` so it does not affect the Rabbit Tarot GitHub Pages site at the repository root.

## Run locally

```bash
cd little-postcard
npm install
npm run dev              # http://localhost:3000 — uses mock data automatically
```

Production-style preview with the development data:

```bash
npm run build:preview    # CONTENT_SOURCE=mock next build
npm run start:preview    # CONTENT_SOURCE=mock next start
```

Checks: `npm run typecheck`, `npm run lint`.

On Windows (no POSIX env syntax), set `CONTENT_SOURCE=mock` in `.env.local` and use `npm run build` / `npm start`.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Hero, featured postcard, latest 6, mood explorer, category index, closing |
| `/library` | Search (300 ms debounce), category (single), moods (multi, OR), sort, 12 per page + “Xem thêm”; all state in the URL |
| `/postcard/[slug]` | Breadcrumb, custom 16:9 player, details, credit, up to 3 related |
| `/search` | Debounced, ≥ 2 characters, accent-insensitive search over title and description; `?q=` in the URL |
| `/about` | Editorial About page |
| not found | Custom 404 (real 404 status for unknown, draft and private postcards via `src/proxy.ts`) |

Library URL contract: `?q=…&category=<slug>&mood=<slug>&mood=<slug>&sort=newest|oldest|featured`.

## Content

UI reads content only through `ContentRepository` (`src/lib/content/repository.ts`), which never
returns drafts or private videos. Unlisted videos are reachable by link (with `noindex`) but never listed.

| `CONTENT_SOURCE` | Behaviour |
| --- | --- |
| `mock` | Development fixtures in `src/data/` |
| `supabase` | `src/lib/content/supabase-repository.ts` (draft schema in `supabase/schema.sql`, not yet connected) |
| unset | `next dev` → mock; **production build/server → throws**, so mock data can never ship silently |

Library and search filtering is the pure module `src/lib/video-query.ts` (filter, sort, search,
related, URL parsing), run client-side this sprint and ready to be mapped onto database queries.

### Media credits

Postcard footage is real: clips from Wikimedia Commons (public domain, CC0, CC BY 3.0/4.0,
CC BY-SA 4.0), trimmed and re-encoded to 720p H.264 in `public/media/`. Each thumbnail is a frame
of its own clip. Author, licence and source are in `src/data/videos.ts` and on each postcard page.
Editorial photographs (hero, About) are from Unsplash.

## Structure

```
src/
  app/                    routes, not-found, error boundary, template (page transition)
  proxy.ts                404 status for missing / non-public postcards
  components/
    layout/               PublicHeader, PublicFooter, nav, mobile drawer, PageIntro
    home/                 HeroSection, FeaturedPostcard, LatestPostcards, MoodExplorer,
                          CategoryExplorer, ClosingStatement
    library/              LibraryExplorer, FilterChip, SortSelect
    search/               SearchField (debounced, URL-synced), SearchExperience
    player/               VideoPlayer
    postcard/             VideoCard, VideoGrid, Breadcrumb
    shared/               EmptyState, ErrorState, Skeleton
    ui/                   shadcn Button / Badge / Sheet / Select (restyled), Container, SectionHeader, ArrowLink
  data/                   mock videos, categories, moods; navigation
  types/                  Video, Category, Mood
  lib/
    content/              repository interface, visibility rules, mock + Supabase implementations
    video-query.ts        filtering / sorting / search / related (pure)
    format.ts, routes.ts
public/media/             demo clips (MP4)
public/images/            postcard frames, editorial photographs
```

Design tokens live in `src/app/globals.css` (`:root` brand tokens mapped into Tailwind via `@theme`).
