"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { VideoCard } from "@/components/postcard/video-card";
import { SearchField } from "@/components/search/search-field";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  EMPTY_QUERY,
  PAGE_SIZE,
  hasActiveFilters,
  isSearchable,
  parseLibraryQuery,
  queryVideos,
  toSearchParams,
  type LibraryQuery,
} from "@/lib/video-query";
import type { Category } from "@/types/category";
import type { Mood } from "@/types/mood";
import type { Video } from "@/types/video";
import { FilterChip } from "./filter-chip";
import { SortSelect } from "./sort-select";

interface LibraryExplorerProps {
  /** Public catalogue, already stripped of drafts and private videos. */
  videos: Video[];
  categories: Category[];
  moods: Mood[];
}

/**
 * Library browsing: search, category (single), moods (multi), sort and
 * "load more". All filter state lives in the URL; the filtering itself is
 * the pure `queryVideos` from lib/video-query.
 */
export function LibraryExplorer({ videos, categories, moods }: LibraryExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  const taxonomy = useMemo(() => ({ categories, moods }), [categories, moods]);
  const query = useMemo(() => parseLibraryQuery(searchParams, taxonomy), [searchParams, taxonomy]);
  const results = useMemo(() => queryVideos(videos, query, taxonomy), [videos, query, taxonomy]);
  const queryKey = toSearchParams(query).toString();

  // Reset pagination whenever the filters change.
  const [visible, setVisible] = useState({ key: queryKey, count: PAGE_SIZE });
  if (visible.key !== queryKey) setVisible({ key: queryKey, count: PAGE_SIZE });
  const shown = results.slice(0, visible.count);
  const remaining = results.length - shown.length;

  const categoryLabels = useMemo(() => new Map(categories.map((c) => [c.id, c.label])), [categories]);

  /**
   * Discrete choices (chips, sort, clear) push a history entry so Back
   * steps through them; debounced typing replaces, to avoid one entry
   * per keystroke.
   */
  function update(next: Partial<LibraryQuery>, history: "push" | "replace" = "push") {
    const params = toSearchParams({ ...query, ...next }).toString();
    const href = params ? `${pathname}?${params}` : pathname;
    startTransition(() => {
      if (history === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    });
  }

  function toggleMood(slug: string) {
    const selected = query.moods.includes(slug)
      ? query.moods.filter((m) => m !== slug)
      : [...query.moods, slug];
    update({ moods: moods.filter((m) => selected.includes(m.slug)).map((m) => m.slug) });
  }

  function loadMore() {
    const firstNew = visible.count;
    setVisible({ key: queryKey, count: visible.count + PAGE_SIZE });
    // Move focus to the first newly shown postcard for keyboard users.
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLAnchorElement>("li a")[firstNew]?.focus();
    });
  }

  const clearAll = () => update(EMPTY_QUERY);
  const active = hasActiveFilters(query);

  const summary = [
    isSearchable(query.q) ? `“${query.q.trim()}”` : null,
    categories.find((c) => c.slug === query.category)?.label,
    ...moods.filter((m) => query.moods.includes(m.slug)).map((m) => m.label),
  ].filter(Boolean);

  return (
    <div>
      {/* Search + sort */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <SearchField
          value={query.q}
          onCommit={(q) => update({ q }, "replace")}
          label="Tìm trong thư viện"
          placeholder="Tìm theo tên hoặc mô tả…"
          className="w-full md:max-w-md"
        />
        <SortSelect value={query.sort} onChange={(sort) => update({ sort })} />
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-5 border-y border-border py-6">
        <fieldset className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <legend className="sr-only">Chủ đề (chọn một)</legend>
          <span aria-hidden className="eyebrow w-28 shrink-0 text-muted-foreground">
            Chủ đề
          </span>
          <div className="-mx-(--gutter) flex gap-2 overflow-x-auto px-(--gutter) pb-1 scrollbar-none lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0">
            <FilterChip pressed={!query.category} onClick={() => update({ category: null })}>
              Tất cả
            </FilterChip>
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                pressed={query.category === category.slug}
                onClick={() =>
                  update({ category: query.category === category.slug ? null : category.slug })
                }
              >
                {category.label}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <legend className="sr-only">Tâm trạng (chọn nhiều)</legend>
          <span aria-hidden className="eyebrow w-28 shrink-0 text-muted-foreground">
            Tâm trạng
          </span>
          <div className="-mx-(--gutter) flex gap-2 overflow-x-auto px-(--gutter) pb-1 scrollbar-none lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0">
            {moods.map((mood) => (
              <FilterChip
                key={mood.id}
                showCheck
                pressed={query.moods.includes(mood.slug)}
                onClick={() => toggleMood(mood.slug)}
              >
                {mood.label}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Result summary */}
      <div className="mt-6 mb-10 flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">
          <span className="text-foreground">{results.length}</span> thước phim
          {summary.length > 0 ? <span> · {summary.join(" · ")}</span> : null}
        </p>
        {active ? (
          <Button variant="link" onClick={clearAll} className="h-11 text-sm">
            Xoá bộ lọc
          </Button>
        ) : null}
      </div>

      {/* Results */}
      <div aria-busy={isPending} className={cn("transition-opacity duration-300", isPending && "opacity-50")}>
        {shown.length > 0 ? (
          <ul
            ref={listRef}
            className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16"
          >
            {shown.map((video, index) => (
              <li key={video.id}>
                <VideoCard
                  video={video}
                  categoryLabel={categoryLabels.get(video.categoryId) ?? ""}
                  headingLevel="h2"
                  eager={index < 3}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Chưa có thước phim nào phù hợp."
            description="Thử bỏ bớt một vài bộ lọc, hoặc tìm bằng một từ khác."
          >
            <Button variant="outline" onClick={clearAll}>
              Xoá bộ lọc
            </Button>
          </EmptyState>
        )}

        {remaining > 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3">
            <Button variant="outline" size="lg" onClick={loadMore}>
              Xem thêm
            </Button>
            <p className="text-xs text-muted">
              Đang xem {shown.length} / {results.length} thước phim
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
