import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/shared/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-card text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: { size: "md" },
  }
)

interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  variant?: "default" | "search";
  size?: "sm" | "md" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", size = "md", type, ...props }, ref) => {
    if (variant === "search") {
      return (
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type={type}
            ref={ref}
            className={cn(inputVariants({ size }), "pl-10", className)}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(inputVariants({ size }), className)}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input, inputVariants }
