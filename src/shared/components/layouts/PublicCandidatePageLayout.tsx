import type { ReactNode } from 'react';
import { PublicCandidateHeader } from './PublicCandidateHeader';

interface PublicCandidatePageLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  breadcrumbActions?: ReactNode;
  fullWidth?: boolean;
  showSidebarTrigger?: boolean;
  showSearch?: boolean;
}

export function PublicCandidatePageLayout({
  children,
  breadcrumbActions,
  fullWidth = true,
  showSearch = true,
}: PublicCandidatePageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicCandidateHeader breadcrumbActions={breadcrumbActions} showSearch={showSearch} />
      <div className={fullWidth ? "flex-1 w-full" : "flex-1 container"}>
        {children}
      </div>
    </div>
  );
}
