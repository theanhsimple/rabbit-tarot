import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";

interface ArrowLinkProps extends React.ComponentProps<typeof Link> {
  tone?: "default" | "inverse";
}

/** Text link with a trailing arrow that nudges forward on hover. */
export function ArrowLink({ className, children, tone = "default", ...props }: ArrowLinkProps) {
  return (
    <Link
      className={cn(
        "group/arrow -my-3 inline-flex min-h-11 items-center gap-2 py-3 text-sm font-medium underline-offset-[6px] transition-colors duration-300 hover:underline",
        tone === "inverse" ? "text-white" : "text-foreground hover:text-accent",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-300 ease-soft group-hover/arrow:translate-x-1"
      />
    </Link>
  );
}
