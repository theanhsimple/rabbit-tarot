import type { Category } from "@/types/category";
import type { Mood } from "@/types/mood";
import type { Video } from "@/types/video";

/**
 * The only way pages read content. Every method returns public-safe data:
 * drafts and private videos never leave the repository.
 *
 * Implementations: `createMockRepository` (./mock-repository.ts) and
 * `createSupabaseRepository` (./supabase-repository.ts, Sprint 02).
 */
export interface ContentRepository {
  readonly source: ContentSource;

  /** Published + public videos, newest first. Feeds library and search. */
  getPublicVideos(): Promise<Video[]>;

  getFeaturedVideo(): Promise<Video | null>;

  getLatestVideos(options: { limit: number; excludeIds?: string[] }): Promise<Video[]>;

  /** Published videos that are public or unlisted (reachable by link). */
  getVideoBySlug(slug: string): Promise<Video | null>;

  /** Slugs of every video reachable by link, for static generation. */
  getVideoSlugs(): Promise<string[]>;

  /** Up to `limit` public videos related to `video`. */
  getRelatedVideos(video: Video, limit?: number): Promise<Video[]>;

  getCategories(): Promise<Category[]>;

  getMoods(): Promise<Mood[]>;
}

export type ContentSource = "mock" | "supabase";
