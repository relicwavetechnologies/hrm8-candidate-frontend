import type { ReactNode } from "react";

interface AtsPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function AtsPageHeader({ title, subtitle, children, className }: AtsPageHeaderProps) {
  return (
    <div className={className ? className : ""}>
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {children && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 min-w-0 max-w-full rounded-xl border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 py-1.5 shadow-sm overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
