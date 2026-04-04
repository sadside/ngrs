import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        success: "bg-accent/15 text-accent border border-accent/20",
        warning: "bg-warning/15 text-warning border border-warning/20",
        danger: "bg-destructive/15 text-destructive border border-destructive/20",
        info: "bg-primary/15 text-primary border border-primary/20",
        neutral: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
