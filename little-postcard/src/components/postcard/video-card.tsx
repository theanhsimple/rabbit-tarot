import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@/lib/content/types";
import { formatDate, formatDuration, formatDurationLong } from "@/lib/format";
import { routes } from "@/lib/routes";

interface VideoCardProps {
  video: Video;
  categoryLabel: string;
  /** Heading level for the title, so cards fit the page outline. */
  headingLevel?: "h2" | "h3";
  /** `sizes` hint for the thumbnail; defaults to the 3/2/1-column grid. */
  sizes?: string;
  className?: string;
}

/**
 * A postcard in a grid. The title link is stretched over the whole card,
 * so the card has a single tab stop and a clean accessible name.
 */
export function VideoCard({
  video,
  categoryLabel,
  headingLevel: Heading = "h3",
  sizes = "(min-width: 1376px) 405px, (min-width: 1024px) calc((100vw - 160px) / 3), (min-width: 768px) calc((100vw - 88px) / 2), calc(100vw - 40px)",
  className,
}: VideoCardProps) {
  return (
    <article className={cn("group relative", className)}>
      <div className="relative aspect-[3/2] overflow-hidden bg-media">
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[1400ms] ease-soft group-hover:scale-[1.035]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-media/0 transition-colors duration-700 group-hover:bg-media/10"
        />
        <Badge variant="media" className="absolute right-3 bottom-3">
          <span aria-hidden>{formatDuration(video.durationSeconds)}</span>
          <span className="sr-only">Thời lượng {formatDurationLong(video.durationSeconds)}</span>
        </Badge>
      </div>

      <div className="mt-5">
        <p className="eyebrow flex flex-wrap items-center gap-x-2 text-muted">
          <span>{categoryLabel}</span>
          <span aria-hidden className="text-muted-foreground">·</span>
          <time dateTime={video.publishedAt} className="normal-case tracking-normal">
            {formatDate(video.publishedAt)}
          </time>
        </p>
        <Heading className="mt-3 font-display text-display-sm font-medium text-balance text-foreground">
          <Link
            href={routes.postcard(video.slug)}
            className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-soft outline-none group-hover:bg-[length:100%_1px] after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
          >
            {video.title}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {video.shortDescription}
        </p>
      </div>
    </article>
  );
}
