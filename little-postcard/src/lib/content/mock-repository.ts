import { categories } from "@/data/categories";
import { moods } from "@/data/moods";
import { videos } from "@/data/videos";
import { getRelatedVideos, sortVideos } from "@/lib/video-query";
import type { ContentRepository } from "./repository";
import { isListed, isViewable } from "./visibility";

/** Serves the development fixtures in src/data. */
export function createMockRepository(): ContentRepository {
  const listed = sortVideos(videos.filter(isListed), "newest");
  const viewable = videos.filter(isViewable);

  return {
    source: "mock",

    async getPublicVideos() {
      return listed;
    },

    async getFeaturedVideo() {
      return listed.find((v) => v.isFeatured) ?? null;
    },

    async getLatestVideos({ limit, excludeIds = [] }) {
      return listed.filter((v) => !excludeIds.includes(v.id)).slice(0, limit);
    },

    async getVideoBySlug(slug) {
      return viewable.find((v) => v.slug === slug) ?? null;
    },

    async getVideoSlugs() {
      return viewable.map((v) => v.slug);
    },

    async getRelatedVideos(video, limit = 3) {
      return getRelatedVideos(listed, video, limit);
    },

    async getCategories() {
      return categories;
    },

    async getMoods() {
      return moods;
    },
  };
}
