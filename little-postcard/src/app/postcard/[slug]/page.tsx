import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VideoGrid } from "@/components/postcard/video-grid";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getContentRepository } from "@/lib/content";
import { labelLookup } from "@/lib/content/stats";
import { formatDate, formatDuration, formatDurationLong } from "@/lib/format";
import { routes } from "@/lib/routes";

export async function generateStaticParams() {
  const repo = await getContentRepository();
  return (await repo.getVideoSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/postcard/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const video = await (await getContentRepository()).getVideoBySlug(slug);
  if (!video) return { title: "Không tìm thấy" };
  return {
    title: video.title,
    description: video.shortDescription,
    openGraph: { images: [video.thumbnailUrl] },
  };
}

/*
 * Sprint 01A placeholder: poster, details and related postcards.
 * The video player arrives with the media integration.
 */
export default async function PostcardPage({ params }: PageProps<"/postcard/[slug]">) {
  const { slug } = await params;
  const repo = await getContentRepository();
  const video = await repo.getVideoBySlug(slug);
  if (!video) notFound();

  const [moods, categories, sameCategory] = await Promise.all([
    repo.getMoods(),
    repo.getCategories(),
    repo.getVideos({ category: video.category }),
  ]);
  const categoryLabel = labelLookup(categories);
  const related = sameCategory.filter((v) => v.id !== video.id).slice(0, 3);
  const fallback =
    related.length > 0
      ? related
      : (await repo.getLatestVideos({ limit: 3, excludeIds: [video.id] }));
  const videoMoods = moods.filter((m) => video.moods.includes(m.slug));

  return (
    <article>
      <Container className="pt-8 md:pt-10">
        <Link
          href={routes.library()}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} />
          Thư viện
        </Link>
      </Container>

      <Container className="mt-6">
        <figure>
          <div className="relative aspect-video overflow-hidden bg-media">
            <Image
              src={video.thumbnailUrl}
              alt={`Khung hình từ “${video.title}”`}
              fill
              preload
              sizes="(min-width: 1376px) 1280px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-xs text-muted">
            Bản xem trước — trình phát video sẽ có trong giai đoạn tiếp theo.
          </figcaption>
        </figure>
      </Container>

      <Container className="editorial-grid gap-y-10 pt-12 pb-20 md:pt-16 lg:pb-28">
        <header className="col-span-4 md:col-span-8 lg:col-span-7">
          <p className="eyebrow text-accent">{categoryLabel(video.category)}</p>
          <h1 className="mt-4 font-display text-display-xl font-medium text-balance">
            {video.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-foreground/80 md:text-lg">
            {video.description}
          </p>
        </header>

        <dl className="col-span-4 grid grid-cols-2 gap-x-6 gap-y-6 self-end border-t border-border pt-6 text-sm md:col-span-8 lg:col-span-4 lg:col-start-9">
          <div>
            <dt className="eyebrow text-muted-foreground">Thời lượng</dt>
            <dd className="mt-2">
              <span aria-hidden>{formatDuration(video.durationSeconds)}</span>
              <span className="sr-only">{formatDurationLong(video.durationSeconds)}</span>
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted-foreground">Ngày gửi</dt>
            <dd className="mt-2">
              <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
            </dd>
          </div>
          {videoMoods.length > 0 ? (
            <div className="col-span-2">
              <dt className="eyebrow text-muted-foreground">Tâm trạng</dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {videoMoods.map((mood) => (
                  <Badge key={mood.slug} asChild>
                    <Link href={routes.library({ mood: mood.slug })}>{mood.label}</Link>
                  </Badge>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </Container>

      {fallback.length > 0 ? (
        <section aria-labelledby="related-title" className="border-t border-border py-20 lg:py-28">
          <Container>
            <h2 id="related-title" className="mb-12 font-display text-display-md font-medium">
              {related.length > 0 ? "Cùng chủ đề" : "Những thước phim khác"}
            </h2>
            <VideoGrid videos={fallback} categories={categories} />
          </Container>
        </section>
      ) : null}
    </article>
  );
}
