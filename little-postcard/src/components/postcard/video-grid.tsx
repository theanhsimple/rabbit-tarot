import type { Category, Video } from "@/lib/content/types";
import { labelLookup } from "@/lib/content/stats";
import { VideoCard } from "./video-card";

interface VideoGridProps {
  videos: Video[];
  categories: Category[];
  headingLevel?: "h2" | "h3";
}

/** 3 columns on desktop, 2 on tablet, 1 on mobile. */
export function VideoGrid({ videos, categories, headingLevel }: VideoGridProps) {
  const categoryLabel = labelLookup(categories);
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
      {videos.map((video) => (
        <li key={video.id} className="reveal">
          <VideoCard
            video={video}
            categoryLabel={categoryLabel(video.category)}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  );
}
