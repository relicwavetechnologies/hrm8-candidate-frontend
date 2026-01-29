import { Separator } from "@/shared/components/ui/separator";
import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";
import { CandidateUserNav } from "./CandidateUserNav";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";

interface PublicCandidateHeaderProps {
  breadcrumbActions?: ReactNode;
}

export function PublicCandidateHeader({ breadcrumbActions }: PublicCandidateHeaderProps = {}) {
  const { isAuthenticated } = useCandidateAuth();

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-5">
          <Link to="/jobs" className="flex items-center gap-2">
            <span className="font-semibold">HRM8</span>
          </Link>
          <Separator orientation="vertical" className="h-6" />

          <div className="flex-1 flex items-center gap-4">
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs..."
                className="pl-10 bg-muted/50"
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <CandidateUserNav />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/candidate/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/candidate/register">Sign Up</Link>
                </Button>
              </div>
            )}
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


