/**
 * Library / search query logic — pure functions, no React, no I/O.
 *
 * Sprint 01B runs these on the client against the public catalogue.
 * In Sprint 02 the same `LibraryQuery` can be translated into database
 * queries (see `toSearchParams` / `parseLibraryQuery` for the URL contract)
 * without changing the UI.
 */
import type { Category } from "@/types/category";
import type { Mood } from "@/types/mood";
import type { Video } from "@/types/video";

export const PAGE_SIZE = 12;
export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;

export type SortOption = "newest" | "oldest" | "featured";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "featured", label: "Nổi bật" },
];

/** Filter state as it appears in the URL: slugs, not ids. */
export interface LibraryQuery {
  q: string;
  category: string | null;
  moods: string[];
  sort: SortOption;
}

export interface Taxonomy {
  categories: Category[];
  moods: Mood[];
}

export const EMPTY_QUERY: LibraryQuery = { q: "", category: null, moods: [], sort: "newest" };

interface ParamReader {
  get(name: string): string | null;
  getAll(name: string): string[];
}

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.some((o) => o.value === value);
}

/** Reads ?q=&category=&mood=&mood=&sort= and drops anything unknown. */
export function parseLibraryQuery(params: ParamReader, taxonomy: Taxonomy): LibraryQuery {
  const category = params.get("category");
  const moodSlugs = new Set(params.getAll("mood"));
  const sort = params.get("sort");
  return {
    q: (params.get("q") ?? "").slice(0, 100),
    category: taxonomy.categories.some((c) => c.slug === category) ? category : null,
    // keep taxonomy order so equivalent selections share one URL
    moods: taxonomy.moods.filter((m) => moodSlugs.has(m.slug)).map((m) => m.slug),
    sort: isSortOption(sort) ? sort : "newest",
  };
}

/** Inverse of parseLibraryQuery; default values are omitted. */
export function toSearchParams(query: Partial<LibraryQuery>): URLSearchParams {
  const params = new URLSearchParams();
  const q = query.q?.trim();
  if (q) params.set("q", q);
  if (query.category) params.set("category", query.category);
  for (const mood of query.moods ?? []) params.append("mood", mood);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  return params;
}

export function hasActiveFilters(query: LibraryQuery): boolean {
  return Boolean(query.q.trim() || query.category || query.moods.length || query.sort !== "newest");
}

/**
 * Lower-cases and strips Vietnamese diacritics so "binh yen" finds "Bình yên".
 * "đ" has no combining-mark decomposition, so it is mapped explicitly.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** A search term only applies once it has at least MIN_SEARCH_LENGTH characters. */
export function isSearchable(q: string): boolean {
  return q.trim().length >= MIN_SEARCH_LENGTH;
}

/**
 * Case- and accent-insensitive match on title and description.
 * Every query word must begin a word in the text, so "yen" finds "yên"
 * but not "thuyền".
 */
export function matchesSearch(video: Video, q: string): boolean {
  const terms = normalizeForSearch(q).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const words = normalizeForSearch(
    `${video.title} ${video.shortDescription} ${video.description}`,
  ).split(/[^\p{L}\p{N}]+/u);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

/** Category AND (any of the selected moods) AND search. */
export function filterVideos(videos: Video[], query: LibraryQuery, taxonomy: Taxonomy): Video[] {
  const categoryId = query.category
    ? taxonomy.categories.find((c) => c.slug === query.category)?.id
    : undefined;
  const moodIds = new Set(
    taxonomy.moods.filter((m) => query.moods.includes(m.slug)).map((m) => m.id),
  );
  const search = isSearchable(query.q) ? query.q : "";

  return videos.filter(
    (v) =>
      (!categoryId || v.categoryId === categoryId) &&
      (moodIds.size === 0 || v.moodIds.some((id) => moodIds.has(id))) &&
      (!search || matchesSearch(v, search)),
  );
}

const time = (v: Video) => Date.parse(v.publishedAt);

export function sortVideos(videos: Video[], sort: SortOption): Video[] {
  const sorted = [...videos];
  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => time(a) - time(b));
    case "featured":
      return sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || time(b) - time(a));
    case "newest":
    default:
      return sorted.sort((a, b) => time(b) - time(a));
  }
}

export function queryVideos(videos: Video[], query: LibraryQuery, taxonomy: Taxonomy): Video[] {
  return sortVideos(filterVideos(videos, query, taxonomy), query.sort);
}

/**
 * Up to `limit` videos: same category first (newest first), then the
 * latest of the rest. Never includes the current video.
 */
export function getRelatedVideos(videos: Video[], current: Video, limit = 3): Video[] {
  const others = sortVideos(
    videos.filter((v) => v.id !== current.id),
    "newest",
  );
  const sameCategory = others.filter((v) => v.categoryId === current.categoryId);
  const rest = others.filter((v) => v.categoryId !== current.categoryId);
  return [...sameCategory, ...rest].slice(0, limit);
}

export function countBy(videos: Video[], key: (v: Video) => string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of videos) for (const k of key(v)) counts[k] = (counts[k] ?? 0) + 1;
  return counts;
}
