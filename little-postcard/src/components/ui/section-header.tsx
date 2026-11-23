import * as React from "react";
import { cn } from "cn";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** id for the heading so the section can reference it with aria-labelledby */
  titleId?: string;
  as?: "h1" | "h2";
  /** Rendered beside the text on wide screens, e.g. a "view all" link */
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  titleId,
  as: Heading = "h2",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-4 text-muted">{eyebrow}</p> : null}
        <Heading
          id={titleId}
          className="font-display text-display-lg font-medium text-balance text-foreground"
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
