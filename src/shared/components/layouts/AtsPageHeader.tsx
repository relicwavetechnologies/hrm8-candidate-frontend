import type { ReactNode } from "react";

interface AtsPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode; // action bar content
  className?: string;
}

// Consistent ATS page header with an iOS-like subtle look
// Usage:
// <AtsPageHeader title="Background Checks" subtitle="Manage ...">
//   ...action bar content (buttons, pill groups)...
// </AtsPageHeader>
export function AtsPageHeader({ title, subtitle, children, className }: AtsPageHeaderProps) {
  return (
    <div className={className ? className : ""}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>

      {children && (
        <div
          className="mt-4 flex flex-wrap items-center gap-2 min-w-0 max-w-full rounded-xl border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 py-2 shadow-sm overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
