import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Mood } from "@/types/mood";
import type { Video } from "@/types/video";
import { formatDate, formatDuration, formatDurationLong } from "@/lib/format";
import { routes } from "@/lib/routes";

interface FeaturedPostcardProps {
  video: Video;
  categoryLabel: string;
  moods: Mood[];
}

export function FeaturedPostcard({ video, categoryLabel, moods }: FeaturedPostcardProps) {
  const href = routes.postcard(video.slug);
  const videoMoods = moods.filter((m) => video.moodIds.includes(m.id));

  return (
    <section aria-labelledby="featured-title" className="reveal py-20 md:py-28 lg:py-36">
      <Container className="editorial-grid items-center gap-y-10">
        {/* Media: decorative duplicate of the CTA, so it is skipped by keyboard and AT */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="group relative col-span-4 block aspect-[16/10] overflow-hidden lg:aspect-[4/3] bg-media md:col-span-8 lg:col-span-7"
        >
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1376px) 728px, (min-width: 1024px) 56vw, 100vw"
            className="object-cover transition-transform duration-[1600ms] ease-soft group-hover:scale-[1.03]"
          />
          <Badge variant="media" className="absolute right-4 bottom-4">
            {formatDuration(video.durationSeconds)}
          </Badge>
        </Link>

        <div className="col-span-4 md:col-span-6 lg:col-span-5 lg:pl-6">
          <p className="eyebrow text-accent">Selected Postcard</p>
          <h2
            id="featured-title"
            className="mt-4 font-display text-display-lg font-medium text-balance"
          >
            Một thước phim dành cho hôm nay.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Mỗi khoảnh khắc đều có cách riêng để chạm đến chúng ta.
          </p>

          <div className="mt-10 border-t border-border pt-8">
            <h3 className="font-display text-display-md italic">{video.title}</h3>
            <p className="mt-3 flex flex-wrap gap-x-2 text-sm text-muted">
              <span>{categoryLabel}</span>
              <span aria-hidden>·</span>
              <span>
                <span aria-hidden>{formatDuration(video.durationSeconds)}</span>
                <span className="sr-only">{formatDurationLong(video.durationSeconds)}</span>
              </span>
              <span aria-hidden>·</span>
              <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
            </p>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-pretty text-foreground/80">
              {video.shortDescription}
            </p>

            {videoMoods.length > 0 ? (
              <ul aria-label="Tâm trạng" className="mt-6 flex flex-wrap gap-2">
                {videoMoods.map((mood) => (
                  <li key={mood.id}>
                    <Badge asChild>
                      <Link href={routes.library({ moods: [mood.slug] })}>{mood.label}</Link>
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button asChild size="lg" className="mt-8">
              <Link href={href}>
                Xem postcard
                <ArrowRight aria-hidden className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
