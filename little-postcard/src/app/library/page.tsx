import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { FilterBar } from "@/components/postcard/filter-bar";
import { VideoGrid } from "@/components/postcard/video-grid";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { getContentRepository, isCategorySlug, isMoodSlug } from "@/lib/content";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Thư viện",
  description: "Tất cả những tấm bưu thiếp của Little Postcard, lọc theo tâm trạng và chủ đề.",
};

/*
 * Sprint 01A placeholder: a working, URL-driven filter over the archive.
 * Pagination, sorting and richer layouts come with the Library sprint.
 */
export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <>
      <PageIntro
        eyebrow="Thư viện"
        title="Tất cả những tấm bưu thiếp."
        description="Lọc theo tâm trạng hoặc chủ đề để tìm thước phim dành cho lúc này."
      />
      <Container className="pb-24 lg:pb-32">
        <Suspense fallback={<LibrarySkeleton />}>
          <LibraryResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function LibraryResults({
  searchParams,
}: {
  searchParams: PageProps<"/library">["searchParams"];
}) {
  const params = await searchParams;
  const mood = isMoodSlug(params.mood) ? params.mood : undefined;
  const category = isCategorySlug(params.category) ? params.category : undefined;

  const repo = await getContentRepository();
  const [videos, moods, categories] = await Promise.all([
    repo.getVideos({ mood, category }),
    repo.getMoods(),
    repo.getCategories(),
  ]);

  const activeLabels = [
    moods.find((m) => m.slug === mood)?.label,
    categories.find((c) => c.slug === category)?.label,
  ].filter(Boolean);

  return (
    <>
      <FilterBar
        moods={moods}
        categories={categories}
        activeMood={mood}
        activeCategory={category}
      />
      <p className="mt-8 mb-10 text-sm text-muted" aria-live="polite">
        {videos.length} thước phim
        {activeLabels.length > 0 ? ` · ${activeLabels.join(" · ")}` : ""}
      </p>
      {videos.length > 0 ? (
        <VideoGrid videos={videos} categories={categories} headingLevel="h2" />
      ) : (
        <div className="border border-dashed border-border px-6 py-16 text-center">
          <p className="font-display text-display-sm">Chưa có thước phim nào ở đây.</p>
          <p className="mt-3 text-sm text-muted">Thử bỏ bớt một bộ lọc nhé.</p>
          <ArrowLink href={routes.library()} className="mt-6">
            Xem tất cả
          </ArrowLink>
        </div>
      )}
    </>
  );
}

function LibrarySkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="h-[118px] border-y border-border" />
      <div className="mt-8 mb-10 h-4 w-32 bg-surface-secondary" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="aspect-[3/2] bg-surface-secondary" />
        ))}
      </div>
    </div>
  );
}
