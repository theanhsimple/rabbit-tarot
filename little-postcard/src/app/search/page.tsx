import type { Metadata } from "next";
import Form from "next/form";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { VideoGrid } from "@/components/postcard/video-grid";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getContentRepository } from "@/lib/content";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm một thước phim trong kho lưu trữ Little Postcard.",
};

/*
 * Sprint 01A placeholder: GET form with client-side navigation (next/form)
 * and diacritic-insensitive matching. Suggestions and recent searches
 * come with the Search sprint.
 */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <PageIntro eyebrow="Tìm kiếm" title="Bạn đang tìm điều gì?" />
      <Container className="pb-24 lg:pb-32">
        <Suspense fallback={<SearchForm />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

function SearchForm({ query = "" }: { query?: string }) {
  return (
    <Form action={routes.search()} role="search" className="flex max-w-2xl gap-3 border-b border-foreground/25 pb-3 focus-within:border-foreground">
      <label htmlFor="search-q" className="sr-only">
        Từ khoá
      </label>
      <Search aria-hidden className="mt-3 size-5 shrink-0 text-muted" strokeWidth={1.5} />
      <input
        id="search-q"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Biển, rừng, bình yên…"
        autoComplete="off"
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent font-display text-[1.75rem] leading-tight text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Button type="submit" variant="outline" size="sm" className="self-center">
        Tìm
      </Button>
    </Form>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);

  const repo = await getContentRepository();
  const [videos, categories] = await Promise.all([
    query ? repo.getVideos({ query }) : Promise.resolve([]),
    repo.getCategories(),
  ]);

  return (
    <>
      <SearchForm key={query} query={query} />
      {query ? (
        <section aria-label="Kết quả tìm kiếm" className="mt-12">
          <p className="mb-10 text-sm text-muted" aria-live="polite">
            {videos.length > 0
              ? `${videos.length} thước phim cho “${query}”`
              : `Không tìm thấy thước phim nào cho “${query}”.`}
          </p>
          {videos.length > 0 ? (
            <VideoGrid videos={videos} categories={categories} headingLevel="h2" />
          ) : null}
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted">
          Tìm theo tên, chủ đề hoặc cảm xúc — có dấu hay không dấu đều được.
        </p>
      )}
    </>
  );
}
