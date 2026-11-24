import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { SearchExperience } from "@/components/search/search-experience";
import { Skeleton } from "@/components/shared/skeleton";
import { Container } from "@/components/ui/container";
import { getContentRepository } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm một thước phim trong kho lưu trữ Little Postcard.",
};

export default async function SearchPage() {
  const repo = await getContentRepository();
  const [videos, categories, moods] = await Promise.all([
    repo.getPublicVideos(),
    repo.getCategories(),
    repo.getMoods(),
  ]);

  return (
    <>
      <PageIntro eyebrow="Tìm kiếm" title="Bạn đang tìm điều gì?" />
      <Container className="pb-24 lg:pb-32">
        <Suspense
          fallback={
            <div role="status" aria-label="Đang tải">
              <Skeleton className="h-[4.25rem] max-w-3xl" />
            </div>
          }
        >
          <SearchExperience videos={videos} categories={categories} moods={moods} />
        </Suspense>
      </Container>
    </>
  );
}
