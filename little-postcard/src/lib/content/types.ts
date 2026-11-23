/**
 * Content model for Little Postcard.
 *
 * These types are what UI components consume. Every content source
 * (development mock data today, Supabase later) must map into them, so
 * components never depend on where content comes from.
 */

export const MOOD_SLUGS = [
  "binh-yen",
  "hy-vong",
  "hoai-niem",
  "lang-le",
  "thu-gian",
  "cam-hung",
] as const;

export type MoodSlug = (typeof MOOD_SLUGS)[number];

export const CATEGORY_SLUGS = [
  "thien-nhien",
  "am-nhac",
  "nghe-thuat",
  "nhung-chuyen-di",
  "chiem-nghiem",
  "nhung-khoanh-khac",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Mood {
  slug: MoodSlug;
  label: string;
  /** One short line shown under the mood name. */
  description: string;
}

export interface Category {
  slug: CategorySlug;
  label: string;
  description: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  /** Absolute URL or a path under /public. */
  thumbnailUrl: string;
  durationSeconds: number;
  category: CategorySlug;
  moods: MoodSlug[];
  /** ISO 8601 date-time string. */
  publishedAt: string;
  isFeatured: boolean;
}

export interface VideoFilter {
  mood?: MoodSlug;
  category?: CategorySlug;
  /** Free-text search over title, descriptions, category and moods. */
  query?: string;
}

export function isMoodSlug(value: unknown): value is MoodSlug {
  return typeof value === "string" && (MOOD_SLUGS as readonly string[]).includes(value);
}

export function isCategorySlug(value: unknown): value is CategorySlug {
  return (
    typeof value === "string" && (CATEGORY_SLUGS as readonly string[]).includes(value)
  );
}
