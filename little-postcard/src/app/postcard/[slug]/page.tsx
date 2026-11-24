import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoPlayer } from "@/components/player/video-player";
import { Breadcrumb } from "@/components/postcard/breadcrumb";
import { Skeleton } from "@/components/shared/skeleton";
import { VideoGrid } from "@/components/postcard/video-grid";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getContentRepository } from "@/lib/content";
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
    openGraph: { type: "video.other", images: [video.thumbnailUrl] },
    // unlisted postcards are reachable by link but kept out of search engines
    robots: video.visibility === "unlisted" ? { index: false, follow: false } : undefined,
  };
}

/*
 * The page shell renders instantly; URL-dependent content streams inside
 * Suspense (Cache Components instant navigation). Known slugs are still
 * fully prerendered via generateStaticParams, and src/proxy.ts returns a
 * real 404 for unknown, draft and private slugs before rendering starts.
 */
export default function PostcardPage({ params }: PageProps<"/postcard/[slug]">) {
  return (
    <Suspense fallback={<PostcardSkeleton />}>
      <PostcardView params={params} />
    </Suspense>
  );
}

function PostcardSkeleton() {
  return (
    <div role="status" aria-label="Đang tải tấm bưu thiếp">
      <Container className="pt-6 md:pt-8">
        <Skeleton className="h-11 w-64 max-w-full" />
      </Container>
      <Container className="mt-4 md:mt-6">
        <div className="aspect-video bg-media" />
      </Container>
      <Container className="pt-12 pb-20 md:pt-16">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-14 w-2/3" />
        <Skeleton className="mt-6 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-4 w-5/6 max-w-2xl" />
      </Container>
    </div>
  );
}

async function PostcardView({ params }: Pick<PageProps<"/postcard/[slug]">, "params">) {
  const { slug } = await params;
  const repo = await getContentRepository();
  const video = await repo.getVideoBySlug(slug);
  if (!video) notFound();

  const [moods, categories, related] = await Promise.all([
    repo.getMoods(),
    repo.getCategories(),
    repo.getRelatedVideos(video, 3),
  ]);
  const category = categories.find((c) => c.id === video.categoryId);
  const videoMoods = moods.filter((m) => video.moodIds.includes(m.id));
  const allSameCategory = related.every((v) => v.categoryId === video.categoryId);

  return (
    <article>
      <Container className="pt-6 md:pt-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: routes.home },
            { label: "Thư viện", href: routes.library() },
            ...(category
              ? [{ label: category.label, href: routes.library({ category: category.slug }) }]
              : []),
            { label: video.title },
          ]}
        />
      </Container>

      <Container className="mt-4 md:mt-6">
        {video.playbackUrl ? (
          <VideoPlayer
            src={video.playbackUrl}
            poster={video.thumbnailUrl}
            title={video.title}
            durationSeconds={video.durationSeconds}
          />
        ) : (
          <div className="relative aspect-video overflow-hidden bg-media">
            <Image
              src={video.thumbnailUrl}
              alt={`Khung hình từ “${video.title}”`}
              fill
              preload
              sizes="(min-width: 1376px) 1280px, 100vw"
              className="object-cover opacity-80"
            />
            <p className="absolute inset-x-0 bottom-0 bg-media/70 px-5 py-4 text-sm text-white/85">
              Thước phim này chưa có bản phát trực tuyến.
            </p>
          </div>
        )}
      </Container>

      <Container className="editorial-grid gap-y-10 pt-12 pb-20 md:pt-16 lg:pb-28">
        <header className="col-span-4 md:col-span-8 lg:col-span-7">
          {category ? (
            <Link
              href={routes.library({ category: category.slug })}
              className="eyebrow -my-3 inline-flex min-h-11 items-center py-3 text-accent transition-colors hover:text-foreground"
            >
              {category.label}
            </Link>
          ) : null}
          <h1 className="mt-3 font-display text-display-xl font-medium text-balance">{video.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-foreground/80 md:text-lg">
            {video.description}
          </p>
        </header>

        <aside className="col-span-4 self-end md:col-span-8 lg:col-span-4 lg:col-start-9">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-6 text-sm">
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
                <dd className="mt-3">
                  <ul className="flex flex-wrap gap-2">
                    {videoMoods.map((mood) => (
                      <li key={mood.id}>
                        <Badge asChild>
                          <Link href={routes.library({ moods: [mood.slug] })}>{mood.label}</Link>
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>

          {video.credit ? (
            <p className="mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted">
              Thước phim gốc:{" "}
              <a
                href={video.credit.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                “{video.credit.title}”
              </a>{" "}
              — {video.credit.author}.{" "}
              {video.credit.licenseUrl ? (
                <a
                  href={video.credit.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer license"
                  className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                >
                  {video.credit.license}
                </a>
              ) : (
                video.credit.license
              )}
              , qua Wikimedia Commons. Đã trích đoạn và chuyển định dạng.
            </p>
          ) : null}
        </aside>
      </Container>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="border-t border-border py-20 lg:py-28">
          <Container>
            <h2 id="related-title" className="mb-12 font-display text-display-md font-medium">
              {allSameCategory ? "Cùng chủ đề" : "Có thể bạn cũng thích"}
            </h2>
            <VideoGrid videos={related} categories={categories} />
          </Container>
        </section>
      ) : null}
    </article>
  );
}
