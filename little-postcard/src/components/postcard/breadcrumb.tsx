import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** The last item is the current page and is not linked. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Đường dẫn">
      <ol className="flex flex-wrap items-center gap-x-1 text-sm text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="-my-3 inline-flex min-h-11 items-center py-3 transition-colors duration-300 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-foreground">
                  {item.label}
                </span>
              )}
              {!last ? (
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
