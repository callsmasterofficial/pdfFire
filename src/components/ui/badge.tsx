import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-surface-secondary text-foreground border border-border/60",
        outline:
          "border border-border text-foreground bg-surface",
        success:
          "bg-success/15 text-success border border-success/30 dark:bg-success/20",
        warning:
          "bg-warning/15 text-warning border border-warning/30 dark:bg-warning/20",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/30 dark:bg-destructive/20",
        accent:
          "bg-accent/15 text-accent border border-accent/30 dark:bg-accent/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
