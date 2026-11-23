import type { CategorySlug, MoodSlug } from "@/lib/content/types";

/** Every internal URL is built here so links stay consistent. */
export const routes = {
  home: "/",
  about: "/about",
  library(filter: { mood?: MoodSlug; category?: CategorySlug } = {}) {
    const params = new URLSearchParams();
    if (filter.mood) params.set("mood", filter.mood);
    if (filter.category) params.set("category", filter.category);
    const query = params.toString();
    return query ? `/library?${query}` : "/library";
  },
  postcard: (slug: string) => `/postcard/${encodeURIComponent(slug)}`,
  search(query?: string) {
    return query ? `/search?q=${encodeURIComponent(query)}` : "/search";
  },
} as const;

export const primaryNav = [
  { href: routes.home, label: "Trang chủ" },
  { href: routes.library(), label: "Thư viện" },
  { href: routes.about, label: "Giới thiệu" },
] as const;
