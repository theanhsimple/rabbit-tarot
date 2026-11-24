import { cn } from "cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Recovery actions, e.g. a retry button. */
  children?: React.ReactNode;
  /** "inverse" for use over dark media surfaces. */
  tone?: "default" | "inverse";
  className?: string;
}

export function ErrorState({
  title = "Đã có điều gì đó không như mong đợi.",
  description = "Bạn thử lại sau một chút nhé.",
  children,
  tone = "default",
  className,
}: ErrorStateProps) {
  const inverse = tone === "inverse";
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 text-center", className)}>
      <p
        className={cn(
          "max-w-md font-display text-display-sm font-medium text-balance",
          inverse ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </p>
      {description ? (
        <p
          className={cn(
            "mt-3 max-w-sm text-sm leading-relaxed text-pretty",
            inverse ? "text-white/70" : "text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}
