import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRelatedVideos } from "@/lib/video-query";
import type { Category } from "@/types/category";
import type { Mood } from "@/types/mood";
import type { Video, VideoStatus, VideoVisibility } from "@/types/video";
import type { ContentRepository } from "./repository";

/**
 * Supabase-backed repository — PREPARED, NOT CONNECTED (Sprint 02).
 *
 * Type-checked against the draft schema in supabase/schema.sql but never
 * run against a live project. Visibility is enforced twice: by the query
 * filters here and by Row Level Security in the schema.
 */

interface VideoRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  playback_url: string | null;
  duration_seconds: number;
  category_id: string;
  mood_ids: string[];
  published_at: string;
  is_featured: boolean;
  status: VideoStatus;
  visibility: VideoVisibility;
}

const VIDEO_COLUMNS =
  "id, slug, title, description, short_description, thumbnail_url, playback_url, duration_seconds, category_id, mood_ids, published_at, is_featured, status, visibility";

function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    shortDescription: row.short_description,
    thumbnailUrl: row.thumbnail_url,
    playbackUrl: row.playback_url ?? undefined,
    durationSeconds: row.duration_seconds,
    categoryId: row.category_id,
    moodIds: row.mood_ids,
    publishedAt: row.published_at,
    isFeatured: row.is_featured,
    status: row.status,
    visibility: row.visibility,
  };
}

export function createSupabaseRepository(client: SupabaseClient): ContentRepository {
  const listed = () =>
    client
      .from("videos")
      .select(VIDEO_COLUMNS)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("published_at", { ascending: false });

  async function getPublicVideos(): Promise<Video[]> {
    const { data, error } = await listed();
    if (error) throw error;
    return (data as VideoRow[]).map(toVideo);
  }

  async function getTaxonomy<T>(table: "categories" | "moods"): Promise<T[]> {
    const { data, error } = await client
      .from(table)
      .select("id, slug, label, description")
      .order("sort_order");
    if (error) throw error;
    return data as T[];
  }

  return {
    source: "supabase",
    getPublicVideos,

    async getFeaturedVideo() {
      const { data, error } = await listed().eq("is_featured", true).limit(1);
      if (error) throw error;
      const row = (data as VideoRow[])[0];
      return row ? toVideo(row) : null;
    },

    async getLatestVideos({ limit, excludeIds = [] }) {
      let query = listed();
      if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return (data as VideoRow[]).map(toVideo);
    },

    async getVideoBySlug(slug) {
      const { data, error } = await client
        .from("videos")
        .select(VIDEO_COLUMNS)
        .eq("slug", slug)
        .eq("status", "published")
        .in("visibility", ["public", "unlisted"])
        .limit(1);
      if (error) throw error;
      const row = (data as VideoRow[])[0];
      return row ? toVideo(row) : null;
    },

    async getVideoSlugs() {
      const { data, error } = await client
        .from("videos")
        .select("slug")
        .eq("status", "published")
        .in("visibility", ["public", "unlisted"]);
      if (error) throw error;
      return (data as { slug: string }[]).map((r) => r.slug);
    },

    async getRelatedVideos(video, limit = 3) {
      return getRelatedVideos(await getPublicVideos(), video, limit);
    },

    getCategories: () => getTaxonomy<Category>("categories"),
    getMoods: () => getTaxonomy<Mood>("moods"),
  };
}
