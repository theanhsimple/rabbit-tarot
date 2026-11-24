import type { Category } from "@/types/category";
import type { Video } from "@/types/video";
import { VideoCard } from "./video-card";

interface VideoGridProps {
  videos: Video[];
  categories: Category[];
  headingLevel?: "h2" | "h3";
  /** Set when the grid can start above the fold. */
  eagerFirstRow?: boolean;
}

/** 3 columns on desktop, 2 on tablet, 1 on mobile. */
export function VideoGrid({ videos, categories, headingLevel, eagerFirstRow }: VideoGridProps) {
  const labels = new Map(categories.map((c) => [c.id, c.label]));
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
      {videos.map((video, index) => (
        <li key={video.id} className="reveal">
          <VideoCard
            video={video}
            categoryLabel={labels.get(video.categoryId) ?? ""}
            headingLevel={headingLevel}
            eager={eagerFirstRow && index < 3}
          />
        </li>
      ))}
    </ul>
  );
}
