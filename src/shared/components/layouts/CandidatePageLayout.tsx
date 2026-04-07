import type { ReactNode } from 'react';
import { CandidateHeader } from './CandidateHeader';

interface CandidatePageLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  breadcrumbActions?: ReactNode;
  fullWidth?: boolean;
  showSidebarTrigger?: boolean;
  showSearch?: boolean;
}

export function CandidatePageLayout({
  children,
  breadcrumbActions,
  fullWidth = true,
  showSidebarTrigger = true,
}: CandidatePageLayoutProps) {
  return (
    <>
      <CandidateHeader breadcrumbActions={breadcrumbActions} showSidebarTrigger={showSidebarTrigger} />
      <div className={fullWidth ? "flex-1 w-full" : "flex-1 container"}>
        {children}
      </div>
    </>
  );
}
