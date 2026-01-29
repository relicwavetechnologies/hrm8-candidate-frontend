import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-[background,color,border-color,box-shadow] duration-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",

        // Status Variants
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",

        // Vibrant Brand Colors (Design System)
        coral: "border-transparent bg-coral text-coral-foreground hover:bg-coral/80 shadow-sm",
        teal: "border-transparent bg-teal text-teal-foreground hover:bg-teal/80 shadow-sm",
        purple: "border-transparent bg-purple text-purple-foreground hover:bg-purple/80 shadow-sm",
        orange: "border-transparent bg-orange text-orange-foreground hover:bg-orange/80 shadow-sm",

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

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
