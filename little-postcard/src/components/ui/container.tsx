import * as React from "react";
import { cn } from "cn";

/** Centres content at a 1280px maximum with responsive side gutters. */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[calc(var(--container-max)+2*var(--gutter))] px-(--gutter)",
        className,
      )}
      {...props}
    />
  );
}
