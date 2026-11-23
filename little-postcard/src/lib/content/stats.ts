import type { CategorySlug, MoodSlug, Video } from "./types";

export function countByMood(videos: Video[]): Partial<Record<MoodSlug, number>> {
  const counts: Partial<Record<MoodSlug, number>> = {};
  for (const video of videos) {
    for (const mood of video.moods) counts[mood] = (counts[mood] ?? 0) + 1;
  }
  return counts;
}

export function countByCategory(videos: Video[]): Partial<Record<CategorySlug, number>> {
  const counts: Partial<Record<CategorySlug, number>> = {};
  for (const video of videos) counts[video.category] = (counts[video.category] ?? 0) + 1;
  return counts;
}

export function labelLookup<T extends { slug: string; label: string }>(items: T[]) {
  const map = new Map(items.map((item) => [item.slug, item.label]));
  return (slug: string) => map.get(slug) ?? "";
}
