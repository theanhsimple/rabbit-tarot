import { Check } from "lucide-react";
import { cn } from "cn";

interface FilterChipProps {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Show a check mark while pressed (used for multi-select moods). */
  showCheck?: boolean;
}

/** Toggle button for filters; 44px tall for touch. */
export function FilterChip({ pressed, onClick, children, showCheck }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-1.5 rounded-sm border px-4 text-[0.8125rem] whitespace-nowrap transition-colors duration-300",
        pressed
          ? "border-foreground bg-foreground text-surface"
          : "border-border bg-transparent text-muted hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {showCheck && pressed ? <Check aria-hidden className="-ml-1 size-3.5" strokeWidth={2} /> : null}
      {children}
    </button>
  );
}
