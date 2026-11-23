import Link from "next/link";
import { cn } from "cn";
import type { Category, CategorySlug, Mood, MoodSlug } from "@/lib/content/types";
import { routes } from "@/lib/routes";

interface FilterBarProps {
  moods: Mood[];
  categories: Category[];
  activeMood?: MoodSlug;
  activeCategory?: CategorySlug;
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-sm border px-3.5 text-[0.8125rem] whitespace-nowrap transition-colors duration-300",
        active
          ? "border-foreground bg-foreground text-surface"
          : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Mood and category filters, expressed entirely as links so every filter
 * state has a shareable URL. Choosing the active chip again clears it.
 */
export function FilterBar({ moods, categories, activeMood, activeCategory }: FilterBarProps) {
  const rows = [
    {
      label: "Tâm trạng",
      allHref: routes.library({ category: activeCategory }),
      allActive: !activeMood,
      items: moods.map((m) => ({
        key: m.slug,
        label: m.label,
        active: m.slug === activeMood,
        href: routes.library({
          mood: m.slug === activeMood ? undefined : m.slug,
          category: activeCategory,
        }),
      })),
    },
    {
      label: "Chủ đề",
      allHref: routes.library({ mood: activeMood }),
      allActive: !activeCategory,
      items: categories.map((c) => ({
        key: c.slug,
        label: c.label,
        active: c.slug === activeCategory,
        href: routes.library({
          mood: activeMood,
          category: c.slug === activeCategory ? undefined : c.slug,
        }),
      })),
    },
  ];

  return (
    <div className="flex flex-col gap-5 border-y border-border py-6">
      {rows.map((row) => (
        <nav
          key={row.label}
          aria-label={`Lọc theo ${row.label.toLowerCase()}`}
          className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6"
        >
          <p className="eyebrow w-28 shrink-0 text-muted-foreground">{row.label}</p>
          <ul className="-mx-(--gutter) flex gap-2 overflow-x-auto px-(--gutter) scrollbar-none md:mx-0 md:flex-wrap md:px-0">
            <li>
              <FilterChip href={row.allHref} active={row.allActive}>
                Tất cả
              </FilterChip>
            </li>
            {row.items.map((item) => (
              <li key={item.key}>
                <FilterChip href={item.href} active={item.active}>
                  {item.label}
                </FilterChip>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}
