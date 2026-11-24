import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { Mood } from "@/types/mood";
import { routes } from "@/lib/routes";

interface MoodExplorerProps {
  moods: Mood[];
  /** Number of public videos per mood id. */
  counts: Record<string, number>;
}

export function MoodExplorer({ moods, counts }: MoodExplorerProps) {
  return (
    <section aria-labelledby="mood-title" className="bg-surface-secondary py-20 md:py-28 lg:py-32">
      <Container>
        <SectionHeader
          titleId="mood-title"
          eyebrow="Theo tâm trạng"
          title="Hôm nay bạn cảm thấy thế nào?"
          description="Chọn một cảm xúc, và để những thước phim phù hợp tìm đến bạn."
        />
      </Container>

      {/* Mobile: horizontal scroller that bleeds to the screen edge. md+: grid. */}
      <Container className="max-md:px-0">
        <ul className="reveal mt-12 flex snap-x snap-mandatory scroll-px-(--gutter) gap-3 overflow-x-auto px-(--gutter) pb-2 scrollbar-none md:mt-16 md:grid md:snap-none md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6">
          {moods.map((mood, index) => {
            const count = counts[mood.id] ?? 0;
            return (
              <li key={mood.id} className="w-[64%] shrink-0 snap-start sm:w-[42%] md:w-auto">
                <Link
                  href={routes.library({ moods: [mood.slug] })}
                  className="group flex h-full min-h-48 flex-col justify-between border border-transparent bg-surface p-5 transition-[border-color,transform] duration-500 ease-soft hover:-translate-y-1 hover:border-foreground/15 lg:min-h-56"
                >
                  <span className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                      strokeWidth={1.5}
                    />
                  </span>
                  <span>
                    <span className="block font-display text-[1.875rem] leading-none text-foreground transition-colors duration-300 group-hover:text-accent">
                      {mood.label}
                    </span>
                    <span className="mt-3 block min-h-[2lh] text-[0.8125rem] leading-snug text-muted">
                      {mood.description}
                    </span>
                    <span className="mt-4 block text-xs text-muted-foreground">
                      {count} thước phim
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
