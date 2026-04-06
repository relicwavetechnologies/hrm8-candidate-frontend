import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-[background,color,border-color,box-shadow] duration-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
        secondary: "border-border/70 bg-secondary/55 text-secondary-foreground hover:bg-secondary/70",
        destructive: "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15",
        outline: "text-foreground",

        // Status Variants
        success: "border-success/25 bg-success/10 text-success hover:bg-success/15",
        warning: "border-warning/25 bg-warning/12 text-amber-700 dark:text-amber-300 hover:bg-warning/18",

        // Vibrant Brand Colors (Design System)
        coral: "border-coral/20 bg-coral/12 text-coral hover:bg-coral/18",
        teal: "border-teal/20 bg-teal/12 text-teal hover:bg-teal/18",
        purple: "border-purple/20 bg-purple/12 text-purple hover:bg-purple/18",
        orange: "border-orange/20 bg-orange/12 text-orange hover:bg-orange/18",

        // Soft Variants for subtle distinction
        "coral-soft": "border-coral/20 bg-coral/10 text-coral hover:bg-coral/20",
        "teal-soft": "border-teal/20 bg-teal/10 text-teal hover:bg-teal/20",
        "purple-soft": "border-purple/20 bg-purple/10 text-purple hover:bg-purple/20",
        "orange-soft": "border-orange/20 bg-orange/10 text-orange hover:bg-orange/20",

        // Neutral variant for non-critical info
        neutral: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
