import { Separator } from "@/shared/components/ui/separator";
import { CandidateUserNav } from "./CandidateUserNav";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface PublicCandidateHeaderProps {
  breadcrumbActions?: ReactNode;
  showSearch?: boolean;
}

export function PublicCandidateHeader({ breadcrumbActions }: PublicCandidateHeaderProps = {}) {
  const { isAuthenticated } = useCandidateAuth();

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-3 px-4">
          <Link to="/jobs" className="flex items-center gap-2">
            <img src={logoDark} alt="HRM8" className="block h-7 dark:hidden" />
            <img src={logoLight} alt="HRM8" className="hidden h-7 dark:block" />
          </Link>
          <Separator orientation="vertical" className="h-5" />

          <div className="flex-1">
            <Breadcrumbs />
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {isAuthenticated ? (
              <CandidateUserNav />
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" className="h-8 text-xs" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
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
