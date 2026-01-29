import * as React from "react";
import { Separator } from "@/shared/components/ui/separator";
import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";
import { CandidateUserNav } from "./CandidateUserNav";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import type { ReactNode } from "react";

interface CandidateHeaderProps {
  breadcrumbActions?: ReactNode;
  showSidebarTrigger?: boolean;
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
    // Silently handle the error - we're not in a SidebarProvider
    if (error.message.includes("useSidebar must be used within a SidebarProvider")) {
      // This is expected, do nothing
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

// Safe wrapper for SidebarTrigger that handles missing provider gracefully
function SafeSidebarTrigger() {
  const [SidebarTriggerComponent, setSidebarTriggerComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    // Dynamically import SidebarTrigger
    import("@/shared/components/ui/sidebar")
      .then((module) => {
        setSidebarTriggerComponent(() => module.SidebarTrigger);
      })
      .catch(() => {
        // Failed to import, component will not render
      });
  }, []);

  if (!SidebarTriggerComponent) {
    return null;
  }

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
        <div className="flex h-14 items-center gap-3 px-5">
          {showSidebarTrigger && (
            <>
              <SafeSidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          <div className="flex-1 flex items-center gap-4">
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs..."
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsDropdown />
            <CandidateUserNav />
          </div>
        </div>

        {/* Breadcrumbs Row */}
        <div className="px-6 h-10 border-t bg-muted/30 flex items-center justify-between gap-4">
          <Breadcrumbs />
          {breadcrumbActions && (
            <div className="flex items-center gap-2">{breadcrumbActions}</div>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}

































