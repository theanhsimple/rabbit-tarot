import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { Category, CategorySlug } from "@/lib/content/types";
import { routes } from "@/lib/routes";

interface CategoryExplorerProps {
  categories: Category[];
  counts: Partial<Record<CategorySlug, number>>;
}

/** An editorial index of categories rather than a grid of tiles. */
export function CategoryExplorer({ categories, counts }: CategoryExplorerProps) {
  return (
    <section aria-labelledby="category-title" className="py-20 md:py-28 lg:py-36">
      <Container className="editorial-grid gap-y-12">
        <div className="col-span-4 md:col-span-6 lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+48px)]">
            <SectionHeader
              titleId="category-title"
              eyebrow="Theo chủ đề"
              title="Khám phá theo cách của bạn."
              description="Sáu chủ đề, sáu cách để nhìn thế giới chậm hơn một chút."
            />
          </div>
        </div>

        <ol className="reveal col-span-4 border-t border-border md:col-span-8 lg:col-span-7 lg:col-start-6">
          {categories.map((category, index) => {
            const count = counts[category.slug] ?? 0;
            return (
              <li key={category.slug} className="border-b border-border">
                <Link
                  href={routes.library({ category: category.slug })}
                  className="group grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-4 py-6 md:grid-cols-[3rem_1fr_auto] md:gap-x-6 md:py-8"
                >
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-display text-display-md text-foreground transition-[color,transform] duration-500 ease-soft group-hover:translate-x-1 group-hover:text-accent">
                      {category.label}
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted">
                      {category.description}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 self-center text-xs text-muted whitespace-nowrap">
                    <span className="hidden sm:inline">{count} thước phim</span>
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform duration-500 ease-soft group-hover:translate-x-1 group-hover:text-accent"
                      strokeWidth={1.5}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
