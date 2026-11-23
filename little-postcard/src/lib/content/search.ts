import type { Category, Mood, Video } from "./types";

/**
 * Lower-cases and strips Vietnamese diacritics so "binh yen" finds "Bình yên".
 * "đ" has no combining-mark decomposition, so it is mapped explicitly.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when every query word starts some word in the postcard's text.
 * Prefix (not substring) matching, so "yen" finds "yên" but not "thuyền".
 */
export function matchesQuery(
  video: Video,
  query: string,
  moods: Mood[],
  categories: Category[],
): boolean {
  const terms = normalizeForSearch(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;

  const words = normalizeForSearch(
    [
      video.title,
      video.shortDescription,
      video.description,
      categories.find((c) => c.slug === video.category)?.label ?? "",
      ...video.moods.map((m) => moods.find((mood) => mood.slug === m)?.label ?? ""),
    ].join(" "),
  )
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  return terms.every((term) => words.some((word) => word.startsWith(term)));
}
