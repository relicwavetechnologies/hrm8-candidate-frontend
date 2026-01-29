import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface RouteInfo {
  title: string;
  path: string;
}

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  candidates: 'Candidates',
  jobs: 'Jobs',
  applications: 'Applications',
  analytics: 'Analytics',
  calendar: 'Calendar',
  settings: 'Settings',
  help: 'Help Center',
  hrm8: 'HRM8',
  consultant: 'Consultant',
  candidate: 'Candidate',
  regions: 'Regions',
  licensees: 'Licensees',
  consultants: 'Consultants',
  commissions: 'Commissions',
  revenue: 'Revenue',
  reports: 'Reports',
  profile: 'Profile',
  'saved-jobs': 'Saved Jobs',
  messages: 'Messages',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  // Determine home path based on route prefix
  const firstSegment = pathSegments[0];
  let homePath = '/home';
  if (firstSegment === 'hrm8') {
    homePath = '/hrm8/dashboard';
  } else if (firstSegment === 'consultant') {
    homePath = '/consultant/dashboard';
  } else if (firstSegment === 'candidate') {
    homePath = '/candidate/dashboard';
  }

  const breadcrumbs: RouteInfo[] = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { title, path };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={homePath} className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path} className="flex items-center gap-1.5">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}