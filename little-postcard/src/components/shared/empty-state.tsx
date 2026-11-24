import { cn } from "cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Usually one or two buttons / links that get the visitor unstuck. */
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center border-y border-border px-6 py-20 text-center md:py-24",
        className,
      )}
    >
      <span aria-hidden className="mb-8 block h-10 w-px bg-accent/50" />
      <p className="max-w-md font-display text-display-sm font-medium text-balance">{title}</p>
      {description ? (
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}
