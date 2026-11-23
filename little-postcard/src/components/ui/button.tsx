import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/*
 * shadcn/ui Button, restyled for Little Postcard: square-ish corners,
 * generous height, quiet colour shifts instead of heavy effects.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-300 ease-soft outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Dark ink on light pages */
        default: "bg-foreground text-surface hover:bg-foreground/85",
        /** Light button over cinematic imagery */
        inverse: "bg-surface text-foreground hover:bg-surface/85",
        /** Hairline button over imagery */
        "outline-inverse":
          "border-white/45 text-white hover:border-white hover:bg-white/10",
        outline:
          "border-foreground/20 bg-transparent text-foreground hover:border-foreground/60",
        ghost: "text-foreground hover:bg-surface-secondary",
        link: "h-auto px-0 text-foreground underline-offset-[6px] hover:text-accent hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-[0.8125rem]",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
