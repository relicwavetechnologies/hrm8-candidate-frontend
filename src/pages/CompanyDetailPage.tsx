import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Clock3,
  DollarSign,
  ExternalLink,
  Facebook,
  Globe,
  Image as ImageIcon,
  Instagram,
  Layers3,
  Linkedin,
  MapPin,
  Search,
  Sparkles,
  Twitter,
} from 'lucide-react';

import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { Badge, badgeVariants, type BadgeProps } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { cn } from '@/shared/lib/utils';
import { safeOpenExternal } from '@/shared/lib/safeExternalLink';
import { jobService, type ApprovedCompany, type PublicJob } from '@/shared/services/jobService';

type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';
type SurfaceTone = 'brand' | 'success' | 'warning' | 'neutral' | 'coral';
type BadgeVariant = NonNullable<BadgeProps['variant']>;

type SocialLinkEntry = {
  id: SocialPlatform;
  label: string;
  href: string;
  icon: typeof Linkedin;
  domain: string;
  tone: SurfaceTone;
  badgeVariant: BadgeVariant;
};

type CompanySeed = {
  about: string;
  social: Partial<Record<SocialPlatform, string>>;
};

const COMPANY_PROFILE_SEEDS: Record<string, CompanySeed> = {
  'rishihood.edu.in': {
    about:
      'Rishihood University is an impact-oriented university in Sonipat, Haryana, focused on shaping future-ready leaders through interdisciplinary, industry-driven learning. Rooted in Indian civilisational wisdom and designed for real-world application, Rishihood brings together entrepreneurship, leadership, design, technology, and community engagement in one integrated learning environment.',
    social: {
      linkedin: 'https://in.linkedin.com/school/rishihood/',
      twitter: 'https://x.com/RishihoodUni',
      facebook: 'https://www.facebook.com/rishihood',
      instagram: 'https://www.instagram.com/rishihooduni',
    },
  },
};

const SOCIAL_CONFIG: Record<
  SocialPlatform,
  {
    label: string;
    icon: typeof Linkedin;
    domain: string;
    tone: SurfaceTone;
    badgeVariant: BadgeVariant;
  }
> = {
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    domain: 'linkedin.com',
    tone: 'brand',
    badgeVariant: 'purple-soft',
  },
  twitter: {
    label: 'X / Twitter',
    icon: Twitter,
    domain: 'x.com',
    tone: 'neutral',
    badgeVariant: 'neutral',
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    domain: 'facebook.com',
    tone: 'brand',
    badgeVariant: 'purple-soft',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    domain: 'instagram.com',
    tone: 'warning',
    badgeVariant: 'orange-soft',
  },
};

function badgeVariantForTone(tone: SurfaceTone): BadgeVariant {
  switch (tone) {
    case 'brand':
      return 'purple-soft';
    case 'success':
      return 'teal-soft';
    case 'warning':
      return 'orange-soft';
    case 'coral':
      return 'coral-soft';
    case 'neutral':
    default:
      return 'neutral';
  }
}

function iconToneClasses(tone: SurfaceTone, active = false) {
  switch (tone) {
    case 'brand':
      return active ? 'border-primary/25 bg-primary/12 text-primary' : 'border-primary/20 bg-primary/10 text-primary';
    case 'success':
      return active ? 'border-teal/25 bg-teal/12 text-teal' : 'border-teal/20 bg-teal/10 text-teal';
    case 'warning':
      return active ? 'border-orange/25 bg-orange/12 text-orange' : 'border-orange/20 bg-orange/10 text-orange';
    case 'coral':
      return active ? 'border-coral/25 bg-coral/12 text-coral' : 'border-coral/20 bg-coral/10 text-coral';
    case 'neutral':
    default:
      return active ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function formatEmploymentType(type: string | null | undefined) {
  if (!type) return null;
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatWorkArrangement(value: string | null | undefined) {
  if (!value) return null;
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSalary(job: PublicJob) {
  if (job.salaryMin || job.salaryMax) {
    const currency = job.salaryCurrency || 'USD';
    const min = job.salaryMin ? job.salaryMin.toLocaleString() : '';
    const max = job.salaryMax ? job.salaryMax.toLocaleString() : '';
    if (min && max) return `${currency} ${min} - ${max}`;
    if (min) return `${currency} ${min}+`;
    return `${currency} ${max}`;
  }
  return job.salaryDescription || 'Compensation shared in process';
}

const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value);

function normalizeDomain(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();
}

function getWebsiteUrl(value?: string | null) {
  if (!value) return null;
  return value.startsWith('http') ? value : `https://${value}`;
}

function getFaviconUrl(domain?: string | null) {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;
  return `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(normalized)}`;
}

function extractText(value: string | null | undefined) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function formatReadableValue(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[0-9]-[0-9]/.test(trimmed)) return trimmed;
  return trimmed
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatProfileLocation(
  location?:
    | {
        name?: string;
        city?: string;
        stateOrRegion?: string;
        country?: string;
      }
    | null
) {
  if (!location) return null;

  const parts = [location.name, location.city, location.stateOrRegion, location.country]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return parts.length > 0 ? Array.from(new Set(parts)).join(', ') : null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)));
}

function buildSocialEntries(company: ApprovedCompany | null, domain: string) {
  const seed = COMPANY_PROFILE_SEEDS[domain];
  const social = {
    ...(seed?.social || {}),
    ...(company?.social || {}),
  };

  return (Object.keys(SOCIAL_CONFIG) as SocialPlatform[])
    .map((key) => {
      const href = social[key];
      if (!href) return null;
      const config = SOCIAL_CONFIG[key];
      return {
        id: key,
        label: config.label,
        href,
        icon: config.icon,
        domain: config.domain,
        tone: config.tone,
        badgeVariant: config.badgeVariant,
      } satisfies SocialLinkEntry;
    })
    .filter((item): item is SocialLinkEntry => Boolean(item));
}

function buildResolvedAbout(company: ApprovedCompany | null, domain: string, totalJobs: number, departments: string[], locations: string[]) {
  if (company?.about?.trim()) {
    return {
      text: company.about.trim(),
      source: 'published' as const,
    };
  }

  if (company?.overview?.trim()) {
    return {
      text: company.overview.trim(),
      source: 'profile' as const,
    };
  }

  const seeded = COMPANY_PROFILE_SEEDS[domain]?.about;
  if (seeded) {
    return {
      text: seeded,
      source: 'seeded' as const,
    };
  }

  const departmentLabel = departments.length > 0 ? `${formatCount(departments.length)} departments` : 'multiple teams';
  const locationLabel = locations.length > 0 ? `${formatCount(locations.length)} locations` : 'multiple locations';

  return {
    text: `Explore ${formatCount(totalJobs)} open roles across ${departmentLabel} and ${locationLabel}. Use this page to browse live opportunities, validate official company channels, and move directly into the roles that match your background.`,
    source: 'derived' as const,
  };
}

function SectionIconChip({
  icon: Icon,
  tone,
  active = false,
  compact = false,
  className,
}: {
  icon: LucideIcon;
  tone: SurfaceTone;
  active?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        compact ? 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border' : 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
        iconToneClasses(tone, active),
        className
      )}
    >
      <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'} strokeWidth={active ? 2.1 : 1.9} />
    </span>
  );
}

function DomainAvatar({
  domain,
  companyName,
  logoUrl,
  className = '',
}: {
  domain: string;
  companyName: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const [showFallback, setShowFallback] = useState(!logoUrl && !getFaviconUrl(domain));
  const imageUrl = logoUrl || getFaviconUrl(domain);

  useEffect(() => {
    setShowFallback(!imageUrl);
  }, [imageUrl]);

  return (
    <div className={cn('overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.10)]', className)}>
      {imageUrl && !showFallback ? (
        <img
          src={imageUrl}
          alt={`${companyName} logo`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setShowFallback(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-white">
          <Building2 className="h-10 w-10" />
        </div>
      )}
    </div>
  );
}

function BrandLinkPill({
  label,
  href,
  domain,
  icon: Icon,
  variant,
  tone,
  className,
}: {
  label: string;
  href: string;
  domain: string;
  icon: LucideIcon;
  variant: BadgeVariant;
  tone: SurfaceTone;
  className?: string;
}) {
  const faviconUrl = getFaviconUrl(domain);
  const [showFallback, setShowFallback] = useState(!faviconUrl);

  useEffect(() => {
    setShowFallback(!faviconUrl);
  }, [faviconUrl]);

  return (
    <button
      type="button"
      onClick={() => safeOpenExternal(href)}
      className={cn(
        badgeVariants({ variant }),
        'inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-none',
        className
      )}
    >
      <span className={cn('inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border bg-white', iconToneClasses(tone))}>
        {faviconUrl && !showFallback ? (
          <img
            src={faviconUrl}
            alt={label}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setShowFallback(true)}
          />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

function SectionHeader({
  icon,
  tone,
  eyebrow,
  title,
  description,
  badge,
}: {
  icon: LucideIcon;
  tone: SurfaceTone;
  eyebrow: string;
  title: string;
  description?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <SectionIconChip icon={icon} tone={tone} active />
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
      </div>
      {badge ? <div className="shrink-0 self-start">{badge}</div> : null}
    </div>
  );
}

function MetricTile({
  icon,
  tone,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  tone: SurfaceTone;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-50/90 p-3">
      <div className="flex items-center gap-2.5">
        <SectionIconChip icon={icon} tone={tone} compact />
        <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[1.55rem] font-semibold leading-none tracking-tight text-slate-950">{value}</p>
        {helper ? (
          <Badge variant={badgeVariantForTone(tone)} className="px-2 py-1 text-[9px] font-semibold">
            {helper}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useCandidateAuth();
  const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

  const [company, setCompany] = useState<ApprovedCompany | null>(null);
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadCompanyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await jobService.getPublicCompanyDetail(id, {
          department: department || undefined,
          location: location || undefined,
          limit: 200,
        });

        if (!response.success || !response.data) {
          setError('Company not found');
          setCompany(null);
          setJobs([]);
          return;
        }

        setCompany(response.data.company);
        setJobs(response.data.jobs || []);
        setTotalJobs(response.data.totalJobs || 0);
        setDepartments(response.data.filters?.departments || []);
        setLocations(response.data.filters?.locations || []);
      } catch (_error) {
        setError('Failed to load company details');
        setCompany(null);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCompanyData();
  }, [id, department, location]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const requirementsText = Array.isArray(job.requirements) ? job.requirements.join(' ').toLowerCase() : '';
      return (
        job.title.toLowerCase().includes(query) ||
        (job.jobSummary || '').toLowerCase().includes(query) ||
        (job.department || '').toLowerCase().includes(query) ||
        (job.location || '').toLowerCase().includes(query) ||
        requirementsText.includes(query)
      );
    });
  }, [jobs, searchQuery]);

  const domain = normalizeDomain(company?.domain || company?.website);
  const websiteUrl = getWebsiteUrl(company?.website || company?.domain || null);
  const socialLinks = buildSocialEntries(company, domain);
  const gallery = Array.isArray(company?.images) ? company.images.filter(Boolean) : [];
  const departmentList = departments.length > 0 ? departments : uniqueValues(jobs.map((job) => job.department));
  const locationList = locations.length > 0 ? locations : uniqueValues(jobs.map((job) => job.location));
  const workArrangements = uniqueValues(jobs.map((job) => formatWorkArrangement(job.workArrangement)));
  const compensationVisibleCount = jobs.filter(
    (job) => job.salaryMin || job.salaryMax || (job.salaryDescription && job.salaryDescription.trim())
  ).length;
  const recentlyPostedCount = jobs.filter((job) => {
    if (!job.postingDate) return false;
    return Date.now() - new Date(job.postingDate).getTime() <= 1000 * 60 * 60 * 24 * 21;
  }).length;
  const promotionalTags = uniqueValues(jobs.flatMap((job) => job.promotionalTags || [])).slice(0, 6);
  const overview = buildResolvedAbout(company, domain, totalJobs, departmentList, locationList);
  const storyExists = Boolean(company?.about?.trim());
  const heroMedia = company?.bannerUrl || gallery[0] || null;
  const galleryCards = gallery.length > 0 ? gallery.slice(0, 4) : company?.bannerUrl ? [company.bannerUrl] : [];
  const heroSummary = truncateText(overview.text, 210);
  const leadingDepartments = departmentList.slice(0, 2).join(', ') || 'Multiple teams';
  const topWorkModel = workArrangements[0] || 'Role-specific';
  const verificationStatus = company?.verificationStatus || null;
  const primaryLocationLabel = formatProfileLocation(company?.primaryLocation) || null;
  const additionalLocationLabels = (company?.additionalLocations || [])
    .map((location) => formatProfileLocation(location))
    .filter((value): value is string => Boolean(value));
  const officeFootprint = uniqueValues([primaryLocationLabel, ...additionalLocationLabels]);
  type CompanyFact = {
    icon: LucideIcon;
    tone: SurfaceTone;
    label: string;
    value: string;
    helper?: string;
  };
  const companyFacts: CompanyFact[] = [
    ...(company?.industries?.length
      ? [
          {
            icon: Layers3,
            tone: 'coral' as const,
            label: 'Industry',
            value: company.industries.slice(0, 2).join(', '),
            helper: company.industries.length > 2 ? `+${company.industries.length - 2} more` : undefined,
          },
        ]
      : []),
    ...(company?.companySize
      ? [
          {
            icon: Building2,
            tone: 'brand' as const,
            label: 'Company size',
            value: formatReadableValue(company.companySize) || company.companySize,
          },
        ]
      : []),
    ...(company?.yearFounded
      ? [
          {
            icon: CalendarDays,
            tone: 'warning' as const,
            label: 'Founded',
            value: String(company.yearFounded),
          },
        ]
      : []),
    ...(primaryLocationLabel
      ? [
          {
            icon: MapPin,
            tone: 'success' as const,
            label: 'Headquarters',
            value: primaryLocationLabel,
          },
        ]
      : []),
  ];
  const hiringFocusTeams = departmentList.slice(0, 4);
  const hiringFocusLocations = locationList.slice(0, 4);

  const highlightChips = uniqueValues([
    ...promotionalTags.slice(0, 3),
    ...workArrangements.slice(0, 2),
    ...jobs.slice(0, 8).map((job) => formatEmploymentType(job.employmentType)),
  ]).slice(0, 5);

  if (error && !isLoading) {
    return (
      <Layout showSidebarTrigger={false}>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Building2 className="mx-auto mb-4 h-14 w-14 text-muted-foreground/50" />
          <h1 className="mb-2 text-2xl font-semibold">Company page unavailable</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button asChild>
            <Link to="/careers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebarTrigger={false}>
      <div className="min-h-screen bg-[linear-gradient(180deg,#fcfdff_0%,#f7f8fc_48%,#f4f6fb_100%)]">
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-6">
          <Button
            asChild
            variant="outline"
            className="mb-5 h-10 rounded-full border-slate-200 bg-white/90 px-4 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Link to="/careers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Link>
          </Button>

          {isLoading ? (
            <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <Skeleton className="h-[188px] w-full rounded-none md:h-[220px]" />
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:p-6">
                <div className="space-y-4">
                  <Skeleton className="h-28 w-28 rounded-[28px]" />
                  <Skeleton className="h-12 w-80" />
                  <Skeleton className="h-20 w-full max-w-3xl" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                  </div>
                </div>
                <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-[22px]" />
                  ))}
                </div>
              </div>
            </div>
          ) : company ? (
            <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <div className="relative h-[188px] border-b border-slate-200/80 bg-gradient-primary md:h-[220px]">
                {heroMedia ? (
                  <img
                    src={heroMedia}
                    alt={`${company.name} banner`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,40,0.10)_0%,rgba(8,15,40,0.30)_100%)]" />
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:p-6">
                <div className="min-w-0">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="relative z-10 -mt-20 shrink-0 md:-mt-24">
                      <DomainAvatar
                        domain={domain}
                        companyName={company.name}
                        logoUrl={company.logoUrl}
                        className="h-20 w-20 border-[4px] border-white md:h-24 md:w-24"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-3.5">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={verificationStatus === 'VERIFIED' ? 'teal-soft' : 'purple-soft'}
                          className="gap-1.5 px-2.5 py-1 text-[10px] font-semibold"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {verificationStatus === 'VERIFIED' ? 'Verified employer' : 'Official company profile'}
                        </Badge>
                        <Badge variant="teal-soft" className="px-2.5 py-1 text-[10px] font-semibold">
                          {formatCount(totalJobs)} live role{totalJobs === 1 ? '' : 's'}
                        </Badge>
                        {recentlyPostedCount > 0 ? (
                          <Badge variant="orange-soft" className="px-2.5 py-1 text-[10px] font-semibold">
                            {formatCount(recentlyPostedCount)} recent posting{recentlyPostedCount === 1 ? '' : 's'}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <h1 className="text-balance text-[2.15rem] font-semibold tracking-tight text-slate-950 md:text-[3.1rem]">
                          {company.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <SectionIconChip icon={Globe} tone="brand" compact />
                            {domain || 'Official website'}
                          </span>
                          {websiteUrl ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80"
                              onClick={() => safeOpenExternal(websiteUrl)}
                            >
                              Visit official site
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <p className="max-w-3xl text-pretty text-[14px] leading-6 text-slate-600">{heroSummary}</p>

                      <div className="flex flex-wrap gap-2">
                        {socialLinks.map((social) => (
                          <BrandLinkPill
                            key={social.id}
                            label={social.label}
                            href={social.href}
                            domain={social.domain}
                            icon={social.icon}
                            variant={social.badgeVariant}
                            tone={social.tone}
                            className="px-3 py-1.5"
                          />
                        ))}
                        {websiteUrl ? (
                          <BrandLinkPill
                            label="Website"
                            href={websiteUrl}
                            domain={domain}
                            icon={Globe}
                            variant="purple-soft"
                            tone="brand"
                            className="px-3 py-1.5"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <aside className="self-start rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <SectionIconChip icon={Building2} tone="brand" compact />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Hiring Snapshot</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-950">Where this team is hiring now</p>
                      </div>
                    </div>
                    {recentlyPostedCount > 0 ? (
                      <Badge variant="orange-soft" className="shrink-0 px-2.5 py-1 text-[10px] font-semibold">
                        {formatCount(recentlyPostedCount)} recent
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MetricTile icon={Briefcase} tone="brand" label="Open roles" value={formatCount(totalJobs)} />
                    <MetricTile icon={Layers3} tone="coral" label="Teams hiring" value={formatCount(departmentList.length)} />
                    <MetricTile icon={MapPin} tone="warning" label="Locations" value={formatCount(locationList.length)} />
                    <MetricTile icon={DollarSign} tone="success" label="Salary listed" value={formatCount(compensationVisibleCount)} />
                  </div>

                  <div className="mt-3 rounded-[16px] border border-slate-200 bg-white/90 p-3">
                    <div className="flex items-center justify-between gap-3 py-1">
                      <span className="text-[11px] font-medium text-slate-500">Top work model</span>
                      <span className="text-sm font-semibold text-slate-950">{topWorkModel}</span>
                    </div>
                    <Separator className="my-2 bg-slate-200/80" />
                    <div className="flex items-start justify-between gap-3 py-1">
                      <span className="text-[11px] font-medium text-slate-500">Teams hiring now</span>
                      <span className="max-w-[150px] text-right text-sm font-semibold text-slate-950">{leadingDepartments}</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10">
          <div className="space-y-5">
              <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
                <SectionHeader
                  icon={Sparkles}
                  tone="brand"
                  eyebrow="Company Story"
                  title={`About ${company?.name || 'this company'}`}
                  badge={
                    <Badge variant={storyExists ? 'teal-soft' : 'orange-soft'} className="px-2.5 py-1 text-[10px] font-semibold">
                      {storyExists ? 'Employer story' : 'Profile overview'}
                    </Badge>
                  }
                />

                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <p className="max-w-5xl whitespace-pre-wrap text-[15px] leading-7 text-slate-600">{overview.text}</p>

                    {highlightChips.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {highlightChips.map((chip, index) => (
                          <Badge
                            key={`${chip}-${index}`}
                            variant={index % 3 === 0 ? 'purple-soft' : index % 3 === 1 ? 'teal-soft' : 'orange-soft'}
                            className="px-3 py-1.5 text-xs font-semibold"
                          >
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {overview.source !== 'published' ? (
                      <div className="rounded-[22px] border border-orange/20 bg-orange/10 px-4 py-3 text-sm leading-6 text-slate-700">
                        This overview is currently combining public company profile data with live hiring signals while the employer-branded story is still being finalized.
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {companyFacts.length > 0 ? (
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Company Facts</p>
                        <div className="mt-3 space-y-3">
                          {companyFacts.map((fact) => (
                            <div key={fact.label} className="flex items-start gap-3">
                              <SectionIconChip icon={fact.icon} tone={fact.tone} compact />
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">{fact.label}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-950">{fact.value}</p>
                                {fact.helper ? <p className="mt-0.5 text-xs text-slate-500">{fact.helper}</p> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Hiring Focus</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Teams hiring now</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {hiringFocusTeams.length > 0 ? (
                              hiringFocusTeams.map((team) => (
                                <Badge key={team} variant="purple-soft" className="px-3 py-1.5 text-xs font-semibold">
                                  {team}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-slate-600">Multiple teams are actively hiring.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Work styles</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {workArrangements.length > 0 ? (
                              workArrangements.map((arrangement) => (
                                <Badge key={arrangement} variant="teal-soft" className="px-3 py-1.5 text-xs font-semibold">
                                  {arrangement}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-slate-600">Work style varies by role.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Office footprint</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(officeFootprint.length > 0 ? officeFootprint : hiringFocusLocations).length > 0 ? (
                              (officeFootprint.length > 0 ? officeFootprint : hiringFocusLocations).map((place) => (
                                <Badge key={place} variant="neutral" className="px-3 py-1.5 text-xs font-semibold">
                                  {place}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-slate-600">Location details are shared at the role level.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
                <SectionHeader
                  icon={gallery.length > 0 ? Camera : ImageIcon}
                  tone={gallery.length > 0 ? 'success' : 'neutral'}
                  eyebrow="Brand Media"
                  title={gallery.length > 0 ? 'Campus and culture highlights' : 'More employer branding is on the way'}
                  description={
                    gallery.length > 0
                      ? 'A quick visual read on the environment candidates will step into.'
                      : 'This company page is already live with hiring data and official links. Richer editorial visuals will appear here as soon as employer media finishes syncing.'
                  }
                />

                {gallery.length > 0 ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                    <button
                      type="button"
                      className="group overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50"
                      onClick={() => safeOpenExternal(galleryCards[0])}
                    >
                      <img
                        src={galleryCards[0]}
                        alt={`${company?.name} gallery feature`}
                        className="h-[320px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      {galleryCards.slice(1).map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          className="group overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                          onClick={() => safeOpenExternal(url)}
                        >
                          <img
                            src={url}
                            alt={`${company?.name} gallery ${index + 2}`}
                            className="h-[152px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-4 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-sm leading-6 text-slate-600">
                        Candidates can already browse live jobs, validate official channels, and move directly into the application flow. Culture photos and richer campus visuals will appear here once public media is fully available.
                      </p>
                    </div>
                    <SectionIconChip icon={ImageIcon} tone="neutral" />
                  </div>
                )}
              </section>
              <section
                id="open-positions"
                className="rounded-[30px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.05)] md:p-6"
              >
                <div className="grid gap-5 border-b border-slate-200 pb-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <SectionHeader
                      icon={Briefcase}
                      tone="brand"
                      eyebrow="Open Positions"
                      title="Browse live opportunities"
                      description={`${formatCount(filteredJobs.length)} role${filteredJobs.length !== 1 ? 's' : ''} shown for this company.`}
                    />

                    {promotionalTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {promotionalTags.map((tag, index) => (
                          <Badge
                            key={tag}
                            variant={index % 3 === 0 ? 'coral-soft' : index % 3 === 1 ? 'teal-soft' : 'purple-soft'}
                            className="px-3 py-1.5 text-xs font-semibold"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_220px_200px] md:items-end">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search role, team, location, skills"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-11 rounded-2xl border-slate-200 pl-10"
                      />
                    </div>

                    <Select value={department || 'all'} onValueChange={(value) => setDepartment(value === 'all' ? '' : value)}>
                      <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                        <SelectValue placeholder="Team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {departmentList.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={location || 'all'} onValueChange={(value) => setLocation(value === 'all' ? '' : value)}>
                      <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locationList.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <Skeleton className="h-6 w-56" />
                        <Skeleton className="mt-3 h-4 w-72" />
                        <Skeleton className="mt-4 h-24 rounded-[22px]" />
                      </div>
                    ))
                  ) : filteredJobs.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 py-14 text-center">
                      <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                      <p className="text-lg font-semibold text-slate-950">No matching roles</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Try a broader keyword or reset the team and location filters.
                      </p>
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const summary = extractText(job.jobSummary || job.description);
                      const postingLabel = job.postingDate
                        ? formatDistanceToNow(new Date(job.postingDate), { addSuffix: true })
                        : null;
                      const workModel = formatWorkArrangement(job.workArrangement);

                      return (
                        <article
                          key={job.id}
                          className="group rounded-[24px] border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(99,102,241,0.08)]"
                        >
                          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{job.title}</h3>
                                  {job.featured ? (
                                    <Badge variant="purple-soft" className="px-2.5 py-1 text-[10px] font-semibold">
                                      Featured
                                    </Badge>
                                  ) : null}
                                  {postingLabel ? (
                                    <Badge variant="neutral" className="px-2.5 py-1 text-[10px] font-semibold">
                                      {postingLabel}
                                    </Badge>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {job.department ? (
                                    <Badge variant="purple-soft" className="gap-1.5 px-3 py-1.5 text-xs font-semibold">
                                      <Layers3 className="h-3.5 w-3.5" />
                                      {job.department}
                                    </Badge>
                                  ) : null}
                                  {job.location ? (
                                    <Badge variant="neutral" className="gap-1.5 px-3 py-1.5 text-xs font-semibold">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {job.location}
                                    </Badge>
                                  ) : null}
                                  {job.employmentType ? (
                                    <Badge variant="coral-soft" className="px-3 py-1.5 text-xs font-semibold">
                                      {formatEmploymentType(job.employmentType)}
                                    </Badge>
                                  ) : null}
                                  {workModel ? (
                                    <Badge variant="teal-soft" className="px-3 py-1.5 text-xs font-semibold">
                                      {workModel}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>

                              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                {summary
                                  ? truncateText(summary, 220)
                                  : 'View this role to explore scope, expectations, and the application details.'}
                              </p>
                            </div>

                            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">Compensation</p>
                              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                <DollarSign className="h-4 w-4" />
                                {formatSalary(job)}
                              </div>

                              <Separator className="my-4 bg-slate-200" />

                              <div className="flex flex-col gap-3">
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {postingLabel || 'Recently added'}
                                </span>

                                <Button asChild className="h-10 rounded-full px-4">
                                  <Link to={`/jobs/${job.id}`}>
                                    View Role
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
          </div>
        </section>
      </div>
    </Layout>
  );
}
