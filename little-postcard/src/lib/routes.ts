import { toSearchParams, type LibraryQuery } from "@/lib/video-query";

/** Every internal URL is built here so links stay consistent. */
export const routes = {
  home: "/",
  about: "/about",
  library(query: Partial<LibraryQuery> = {}) {
    const params = toSearchParams(query).toString();
    return params ? `/library?${params}` : "/library";
  },
  postcard: (slug: string) => `/postcard/${encodeURIComponent(slug)}`,
  search(q?: string) {
    const term = q?.trim();
    return term ? `/search?q=${encodeURIComponent(term)}` : "/search";
  },
} as const;
