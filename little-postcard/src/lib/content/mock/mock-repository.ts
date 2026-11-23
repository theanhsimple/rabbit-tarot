import type { ContentRepository } from "../repository";
import type { Video, VideoFilter } from "../types";
import { matchesQuery } from "../search";
import { mockCategories, mockMoods, mockVideos } from "./data";

const byNewest = (a: Video, b: Video) =>
  Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

/** Serves the development fixtures in ./data.ts. */
export function createMockRepository(): ContentRepository {
  const videos = [...mockVideos].sort(byNewest);

  return {
    source: "mock",

    async getFeaturedVideo() {
      return videos.find((v) => v.isFeatured) ?? null;
    },

    async getLatestVideos({ limit, excludeIds = [] }) {
      return videos.filter((v) => !excludeIds.includes(v.id)).slice(0, limit);
    },

    async getVideos(filter: VideoFilter = {}) {
      return videos.filter((v) => {
        if (filter.mood && !v.moods.includes(filter.mood)) return false;
        if (filter.category && v.category !== filter.category) return false;
        if (filter.query && !matchesQuery(v, filter.query, mockMoods, mockCategories)) {
          return false;
        }
        return true;
      });
    },

    async getVideoBySlug(slug) {
      return videos.find((v) => v.slug === slug) ?? null;
    },

    async getVideoSlugs() {
      return videos.map((v) => v.slug);
    },

    async getMoods() {
      return mockMoods;
    },

    async getCategories() {
      return mockCategories;
    },
  };
}
