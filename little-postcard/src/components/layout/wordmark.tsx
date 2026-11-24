import Link from "next/link";
import { cn } from "cn";
import { routes } from "@/lib/routes";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home}
      className={cn(
        "inline-flex items-baseline gap-2 py-2.5 font-display text-[1.625rem] leading-none font-medium tracking-[-0.01em] text-foreground",
        className,
      )}
    >
      Little Postcard
      <span aria-hidden className="size-1.5 translate-y-[-0.1em] rounded-full bg-accent" />
    </Link>
  );
}
