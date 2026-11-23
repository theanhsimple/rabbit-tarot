import type { Category, Mood, Video, VideoFilter } from "./types";

/**
 * The only way UI code reads content. Implementations:
 *  - `createMockRepository` (development data, src/lib/content/mock)
 *  - `createSupabaseRepository` (src/lib/content/supabase-repository.ts)
 */
export interface ContentRepository {
  /** Which implementation is serving content. */
  readonly source: ContentSource;

  /** The postcard currently highlighted on the home page, if any. */
  getFeaturedVideo(): Promise<Video | null>;

  /** Newest first. `excludeIds` lets the home page skip the featured postcard. */
  getLatestVideos(options: { limit: number; excludeIds?: string[] }): Promise<Video[]>;

  /** All published postcards matching the filter, newest first. */
  getVideos(filter?: VideoFilter): Promise<Video[]>;

  getVideoBySlug(slug: string): Promise<Video | null>;

  /** Slugs of every published postcard, for static generation. */
  getVideoSlugs(): Promise<string[]>;

  getMoods(): Promise<Mood[]>;

  getCategories(): Promise<Category[]>;
}

export type ContentSource = "mock" | "supabase";
