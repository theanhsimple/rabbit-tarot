"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "cn";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "@/lib/video-query";

interface SearchFieldProps {
  /** Committed value (normally the `q` URL parameter). */
  value: string;
  /** Called 300ms after typing stops, on Enter, and on clear. */
  onCommit: (value: string) => void;
  label: string;
  placeholder?: string;
  size?: "default" | "lg";
  autoFocus?: boolean;
  className?: string;
}

/**
 * Debounced search input. Typing is local and instant; the committed value
 * (usually the URL) updates after a pause. If the committed value changes
 * from outside — back/forward navigation, "clear filters" — the field follows.
 */
export function SearchField({
  value,
  onCommit,
  label,
  placeholder,
  size = "default",
  autoFocus,
  className,
}: SearchFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  const [pending, setPending] = useState<string | null>(null);

  // Follow external changes, but not the echo of our own debounced commit.
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== pending) setText(value);
    setPending(null);
  }

  function commit(next: string) {
    setPending(next);
    onCommit(next);
  }
  const commitAfterPause = useEffectEvent((next: string) => commit(next));

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = setTimeout(() => commitAfterPause(text), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  const tooShort = text.trim().length > 0 && text.trim().length < MIN_SEARCH_LENGTH;
  const large = size === "lg";

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        commit(text);
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 border-b transition-colors duration-300 focus-within:border-foreground",
          large ? "border-foreground/25 pb-3" : "border-foreground/20 pb-1",
        )}
      >
        <Search
          aria-hidden
          strokeWidth={1.5}
          className={cn("shrink-0 text-muted", large ? "size-6" : "size-[1.125rem]")}
        />
        <input
          id={id}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
          maxLength={100}
          autoFocus={autoFocus}
          aria-describedby={hintId}
          className={cn(
            "h-11 min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden",
            large ? "h-14 font-display text-[1.75rem] md:text-[2.25rem]" : "text-[0.9375rem]",
          )}
        />
        {text ? (
          <button
            type="button"
            onClick={() => {
              setText("");
              commit("");
            }}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            <X aria-hidden className="size-4" strokeWidth={1.5} />
            <span className="sr-only">Xoá từ khoá</span>
          </button>
        ) : null}
      </div>
      <p id={hintId} className={cn("mt-2 text-xs text-muted", !tooShort && "sr-only")} aria-live="polite">
        {tooShort
          ? `Nhập ít nhất ${MIN_SEARCH_LENGTH} ký tự để tìm.`
          : "Kết quả cập nhật khi bạn ngừng gõ."}
      </p>
    </form>
  );
}
