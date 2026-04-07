import * as React from "react";
import { Separator } from "@/shared/components/ui/separator";
import { CandidateUserNav } from "./CandidateUserNav";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import type { ReactNode } from "react";

interface CandidateHeaderProps {
  breadcrumbActions?: ReactNode;
  showSidebarTrigger?: boolean;
  showSearch?: boolean;
}

// Error boundary component for SidebarTrigger
class SidebarTriggerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.message.includes("useSidebar must be used within a SidebarProvider")) {
      // Expected, do nothing
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function SafeSidebarTrigger() {
  const [SidebarTriggerComponent, setSidebarTriggerComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    import("@/shared/components/ui/sidebar")
      .then((module) => {
        setSidebarTriggerComponent(() => module.SidebarTrigger);
      })
      .catch(() => {});
  }, []);

  if (!SidebarTriggerComponent) return null;

  return (
    <SidebarTriggerErrorBoundary>
      <SidebarTriggerComponent />
    </SidebarTriggerErrorBoundary>
  );
}

export function CandidateHeader({ breadcrumbActions, showSidebarTrigger = true }: CandidateHeaderProps = {}) {
  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-3 px-4">
          {showSidebarTrigger && (
            <>
              <SafeSidebarTrigger />
              <Separator orientation="vertical" className="h-5" />
            </>
          )}

          <div className="flex-1">
            <Breadcrumbs />
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationsDropdown />
            <CandidateUserNav />
          </div>
        </div>

        {breadcrumbActions && (
          <div className="px-4 h-9 border-t bg-muted/30 flex items-center justify-end gap-2">
            {breadcrumbActions}
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}
