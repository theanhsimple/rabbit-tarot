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

## Content source

UI components only consume `ContentRepository` (`src/lib/content/repository.ts`).
`getContentRepository()` picks the implementation from `CONTENT_SOURCE`:

| `CONTENT_SOURCE` | Behaviour |
| --- | --- |
| `mock` | Development fixtures in `src/lib/content/mock/` |
| `supabase` | `src/lib/content/supabase-repository.ts` (draft schema in `supabase/schema.sql`) |
| unset | `next dev` → mock; **production build/server → throws**, so mock data can never ship silently |

When mock data is served, the footer shows “Bản xem trước · nội dung mẫu”.

The Supabase repository is type-checked but has **not** been run against a live project yet.

## Structure

```
src/
  app/                    routes: / · /library · /postcard/[slug] · /search · /about · not-found
  components/
    layout/               PublicHeader, PublicFooter, nav, mobile menu, PageIntro
    home/                 HeroSection, FeaturedPostcard, LatestPostcards, MoodExplorer,
                          CategoryExplorer, ClosingStatement
    postcard/             VideoCard, VideoGrid, FilterBar
    ui/                   shadcn Button / Badge / Sheet (restyled), Container, SectionHeader, ArrowLink
  lib/
    content/              types, repository interface, mock + Supabase implementations, search
    supabase/             server client factory
    format.ts, routes.ts
public/images/            Unsplash photographs (unsplash.com/license)
```

Design tokens live in `src/app/globals.css` (`:root` brand tokens mapped into Tailwind via `@theme`).
