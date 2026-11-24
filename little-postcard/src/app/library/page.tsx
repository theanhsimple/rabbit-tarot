import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryExplorer } from "@/components/library/library-explorer";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton, VideoGridSkeleton } from "@/components/shared/skeleton";
import { Container } from "@/components/ui/container";
import { getContentRepository } from "@/lib/content";

export const metadata: Metadata = {
  title: "Thư viện",
  description:
    "Tất cả những tấm bưu thiếp của Little Postcard — tìm theo tên, lọc theo chủ đề và tâm trạng.",
};

export default async function LibraryPage() {
  const repo = await getContentRepository();
  const [videos, categories, moods] = await Promise.all([
    repo.getPublicVideos(),
    repo.getCategories(),
    repo.getMoods(),
  ]);

  return (
    <>
      <PageIntro
        eyebrow="Thư viện"
        title="Tất cả những tấm bưu thiếp."
        description="Tìm một thước phim theo tên, hoặc để chủ đề và tâm trạng dẫn đường."
      />
      <Container className="pb-24 lg:pb-32">
        {/* useSearchParams needs a boundary; the fallback is the loading state */}
        <Suspense fallback={<LibraryLoading />}>
          <LibraryExplorer videos={videos} categories={categories} moods={moods} />
        </Suspense>
      </Container>
    </>
  );
}

function LibraryLoading() {
  return (
    <div role="status" aria-label="Đang tải thư viện">
      <div className="flex flex-col gap-6 md:flex-row md:justify-between">
        <Skeleton className="h-12 w-full md:max-w-md" />
        <Skeleton className="h-11 w-52" />
      </div>
      <div className="mt-8 flex flex-col gap-5 border-y border-border py-6">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="mt-6 mb-10 h-11 w-40" />
      <VideoGridSkeleton />
    </div>
  );
}
