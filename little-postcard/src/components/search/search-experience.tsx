"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { VideoGrid } from "@/components/postcard/video-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { MIN_SEARCH_LENGTH, isSearchable, matchesSearch, sortVideos } from "@/lib/video-query";
import type { Category } from "@/types/category";
import type { Mood } from "@/types/mood";
import type { Video } from "@/types/video";
import { SearchField } from "./search-field";

interface SearchExperienceProps {
  videos: Video[];
  categories: Category[];
  moods: Mood[];
}

export function SearchExperience({ videos, categories, moods }: SearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = (searchParams.get("q") ?? "").slice(0, 100);
  const term = q.trim();
  const searchable = isSearchable(term);
  const results = useMemo(
    () => (searchable ? sortVideos(videos.filter((v) => matchesSearch(v, term)), "newest") : []),
    [videos, term, searchable],
  );

  function commit(next: string) {
    const value = next.trim();
    startTransition(() => {
      router.replace(value ? `${pathname}?q=${encodeURIComponent(value)}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div>
      <SearchField
        value={q}
        onCommit={commit}
        label="Tìm một thước phim"
        placeholder="Biển, rừng, hoàng hôn…"
        size="lg"
        autoFocus={!q}
        className="max-w-3xl"
      />

      <div aria-busy={isPending} className={cn("transition-opacity duration-300", isPending && "opacity-50")}>
        {!searchable ? (
          <div className="mt-14">
            <p className="text-sm text-muted">
              Tìm theo tên hoặc mô tả, có dấu hay không dấu đều được (ít nhất {MIN_SEARCH_LENGTH} ký tự).
            </p>
            <p className="eyebrow mt-12 mb-5 text-muted-foreground">Hoặc bắt đầu từ một tâm trạng</p>
            <ul className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <li key={mood.id}>
                  <Link
                    href={routes.library({ moods: [mood.slug] })}
                    className="inline-flex h-11 items-center rounded-sm border border-border px-4 font-display text-xl text-foreground transition-colors duration-300 hover:border-foreground/40 hover:text-accent"
                  >
                    {mood.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <section aria-label="Kết quả tìm kiếm" className="mt-12">
            <p className="mb-10 text-sm text-muted" aria-live="polite" aria-atomic="true">
              <span className="text-foreground">{results.length}</span> thước phim cho “{term}”
            </p>
            {results.length > 0 ? (
              <VideoGrid videos={results} categories={categories} headingLevel="h2" eagerFirstRow />
            ) : (
              <EmptyState
                title={`Không tìm thấy thước phim nào cho “${term}”.`}
                description="Thử một từ ngắn hơn, hoặc ghé thư viện để xem tất cả."
              >
                <Button variant="outline" onClick={() => commit("")}>
                  Xoá tìm kiếm
                </Button>
                <Button asChild variant="link" className="h-11 px-3">
                  <Link href={routes.library()}>Đến thư viện</Link>
                </Button>
              </EmptyState>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
