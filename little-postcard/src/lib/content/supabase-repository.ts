import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentRepository } from "./repository";
import { matchesQuery } from "./search";
import {
  isCategorySlug,
  isMoodSlug,
  type Category,
  type Mood,
  type Video,
  type VideoFilter,
} from "./types";

/**
 * Supabase-backed repository — PREPARED, NOT YET CONNECTED.
 *
 * Written against the draft schema in supabase/schema.sql and type-checked,
 * but not yet run against a live project. Verify it against the real
 * schema before switching CONTENT_SOURCE to "supabase".
 */

interface VideoRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  duration_seconds: number;
  category_slug: string;
  mood_slugs: string[];
  published_at: string;
  is_featured: boolean;
}

interface TaxonomyRow {
  slug: string;
  label: string;
  description: string;
}

const VIDEO_COLUMNS =
  "id, slug, title, description, short_description, thumbnail_url, duration_seconds, category_slug, mood_slugs, published_at, is_featured";

/** Maps a row to the UI model; rows with an unknown category are dropped. */
function toVideo(row: VideoRow): Video | null {
  if (!isCategorySlug(row.category_slug)) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    shortDescription: row.short_description,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    category: row.category_slug,
    moods: row.mood_slugs.filter(isMoodSlug),
    publishedAt: row.published_at,
    isFeatured: row.is_featured,
  };
}

function toVideos(rows: VideoRow[] | null): Video[] {
  return (rows ?? []).map(toVideo).filter((v): v is Video => v !== null);
}

export function createSupabaseRepository(client: SupabaseClient): ContentRepository {
  const published = () =>
    client
      .from("videos")
      .select(VIDEO_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false });

  async function getMoods(): Promise<Mood[]> {
    const { data, error } = await client
      .from("moods")
      .select("slug, label, description")
      .order("sort_order");
    if (error) throw error;
    return (data as TaxonomyRow[]).flatMap((r) =>
      isMoodSlug(r.slug) ? [{ ...r, slug: r.slug }] : [],
    );
  }

  async function getCategories(): Promise<Category[]> {
    const { data, error } = await client
      .from("categories")
      .select("slug, label, description")
      .order("sort_order");
    if (error) throw error;
    return (data as TaxonomyRow[]).flatMap((r) =>
      isCategorySlug(r.slug) ? [{ ...r, slug: r.slug }] : [],
    );
  }

  return {
    source: "supabase",

    async getFeaturedVideo() {
      const { data, error } = await published().eq("is_featured", true).limit(1);
      if (error) throw error;
      return toVideos(data as VideoRow[])[0] ?? null;
    },

    async getLatestVideos({ limit, excludeIds = [] }) {
      let query = published();
      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return toVideos(data as VideoRow[]);
    },

    async getVideos(filter: VideoFilter = {}) {
      let query = published();
      if (filter.mood) query = query.contains("mood_slugs", [filter.mood]);
      if (filter.category) query = query.eq("category_slug", filter.category);
      const { data, error } = await query;
      if (error) throw error;
      const videos = toVideos(data as VideoRow[]);
      if (!filter.query) return videos;
      // Small archive: diacritic-insensitive matching in memory. Move to
      // Postgres full-text search (unaccent) once the archive grows.
      const [moods, categories] = await Promise.all([getMoods(), getCategories()]);
      return videos.filter((v) => matchesQuery(v, filter.query!, moods, categories));
    },

    async getVideoBySlug(slug) {
      const { data, error } = await published().eq("slug", slug).limit(1);
      if (error) throw error;
      return toVideos(data as VideoRow[])[0] ?? null;
    },

    async getVideoSlugs() {
      const { data, error } = await client
        .from("videos")
        .select("slug")
        .eq("status", "published");
      if (error) throw error;
      return (data as { slug: string }[]).map((r) => r.slug);
    },

    getMoods,
    getCategories,
  };
}
