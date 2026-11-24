import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm font-medium [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        /** Over imagery, e.g. a duration stamp */
        media:
          "bg-media/70 px-2 py-1 text-[0.6875rem] tracking-wide text-white tabular-nums",
        /** Hairline tag on light surfaces */
        outline:
          "border border-border px-2.5 py-1 text-xs text-muted [a&]:relative [a&]:min-h-9 [a&]:px-3 [a&]:transition-colors [a&]:after:absolute [a&]:after:inset-x-0 [a&]:after:-inset-y-1 [a&]:hover:border-foreground/40 [a&]:hover:text-foreground",
        /** Quiet filled tag */
        secondary: "bg-surface-secondary px-2.5 py-1 text-xs text-foreground",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

function Badge({
  className,
  variant = "outline",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
