import type { Video } from "@/types/video";

/** Shown in library, search, home and related lists. */
export function isListed(video: Video): boolean {
  return video.status === "published" && video.visibility === "public";
}

/** Reachable by direct link (listed videos plus unlisted ones). */
export function isViewable(video: Video): boolean {
  return video.status === "published" && video.visibility !== "private";
}
