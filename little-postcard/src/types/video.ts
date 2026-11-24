export type VideoStatus = "published" | "draft";

/**
 * public   – listed in library, search and home
 * unlisted – reachable by direct link only, never listed
 * private  – never shown on the public site
 */
export type VideoVisibility = "public" | "unlisted" | "private";

/** Attribution for third-party footage, required by its licence. */
export interface MediaCredit {
  /** Original title of the work. */
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  /** Page describing the source file. */
  sourceUrl: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  /** Absolute URL or a path under /public. */
  thumbnailUrl: string;
  playbackUrl?: string;
  durationSeconds: number;
  categoryId: string;
  moodIds: string[];
  /** ISO 8601 date-time string. */
  publishedAt: string;
  isFeatured: boolean;
  status: VideoStatus;
  visibility: VideoVisibility;
  credit?: MediaCredit;
}
