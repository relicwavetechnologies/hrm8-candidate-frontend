import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  ExternalLink,
  Facebook,
  Globe,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Search,
  Sparkles,
  Twitter,
  Users,
} from 'lucide-react';

import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { Badge, badgeVariants, type BadgeProps } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { safeOpenExternal } from '@/shared/lib/safeExternalLink';
import { jobService, type ApprovedCompany } from '@/shared/services/jobService';

type SortOption = 'recommended' | 'mostJobs' | 'aToZ';
type CompanyFilter = 'all' | 'hiring' | 'verified' | 'story';
type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';
type SurfaceTone = 'brand' | 'success' | 'warning' | 'neutral' | 'coral';
type BadgeVariant = NonNullable<BadgeProps['variant']>;

type SocialLinkEntry = {
  id: SocialPlatform;
  label: string;
  href: string;
  icon: LucideIcon;
  domain: string;
  tone: SurfaceTone;
  badgeVariant: BadgeVariant;
};

const SOCIAL_CONFIG: Record<
  SocialPlatform,
  {
    label: string;
    icon: LucideIcon;
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
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function getSocialEntries(company: ApprovedCompany) {
  const social = company.social || {};
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
      };
    })
    .filter((entry): entry is SocialLinkEntry => Boolean(entry));
}

function getCompanyLocations(company: ApprovedCompany) {
  return uniqueValues([
    formatProfileLocation(company.primaryLocation),
    ...(company.additionalLocations || []).map((location) => formatProfileLocation(location)),
  ]);
}

function getPrimaryIndustry(company: ApprovedCompany) {
  return uniqueValues((company.industries || []).map((industry) => String(industry || '').trim()))[0] || null;
}

function getCompanySummary(company: ApprovedCompany) {
  const summary = extractText(company.about || company.overview);
  if (summary) return truncateText(summary, 220);

  if (company.jobCount > 0) {
    return `Explore ${formatCount(company.jobCount)} live role${company.jobCount === 1 ? '' : 's'} from ${company.name} and review official company channels before you apply.`;
  }

  return `Review this employer's official profile, public channels, and hiring footprint in one place.`;
}

function getDiscoveryScore(company: ApprovedCompany) {
  let score = company.jobCount * 12;
  if (company.verificationStatus === 'VERIFIED') score += 42;
  if (extractText(company.about || company.overview)) score += 26;
  if (company.logoUrl) score += 10;
  if (company.bannerUrl || company.images?.length) score += 10;
  const socialCount = getSocialEntries(company).length;
  if (socialCount > 0) score += Math.min(socialCount * 4, 16);
  if (getPrimaryIndustry(company)) score += 8;
  if (getCompanyLocations(company).length > 0) score += 8;
  if (formatReadableValue(company.companySize)) score += 4;
  return score;
}

function getFilterLabel(filter: CompanyFilter) {
  switch (filter) {
    case 'hiring':
      return 'Hiring now';
    case 'verified':
      return 'Verified employers';
    case 'story':
      return 'With company story';
    case 'all':
    default:
      return 'All employers';
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
  const imageUrl = logoUrl || getFaviconUrl(domain);
  const [showFallback, setShowFallback] = useState(!imageUrl);

  useEffect(() => {
    setShowFallback(!imageUrl);
  }, [imageUrl]);

  return (
    <div className={cn('overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.10)]', className)}>
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
          <Building2 className="h-8 w-8" />
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

function OverviewStat({
  icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: SurfaceTone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white/90 p-4">
      <div className="flex items-center gap-2.5">
        <SectionIconChip icon={icon} tone={tone} compact />
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-[1.65rem] font-semibold leading-none tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function CompanyListItem({ company }: { company: ApprovedCompany }) {
  const domain = normalizeDomain(company.domain || company.website);
  const websiteUrl = getWebsiteUrl(company.website || domain);
  const summary = getCompanySummary(company);
  const socialEntries = getSocialEntries(company);
  const socialPreview = socialEntries.slice(0, 3);
  const primaryIndustry = getPrimaryIndustry(company);
  const companySize = formatReadableValue(company.companySize);
  const locationList = getCompanyLocations(company);
  const primaryLocation = locationList[0];
  const officialChannelCount = socialEntries.length + (websiteUrl ? 1 : 0);
  const storyExists = Boolean(extractText(company.about || company.overview));
  const yearFounded = company.yearFounded ? String(company.yearFounded) : null;
  const heroMedia = company.bannerUrl || company.images?.[0] || null;

  return (
    <article className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(15,23,42,0.09)]">
      <div className="grid gap-0 xl:grid-cols-[248px_minmax(0,1fr)]">
        <div className="relative min-h-[220px] border-b border-slate-200/80 bg-gradient-primary xl:min-h-full xl:border-b-0 xl:border-r xl:border-slate-200/80">
          {heroMedia ? (
            <img
              src={heroMedia}
              alt={`${company.name} brand banner`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,40,0.12)_0%,rgba(8,15,40,0.62)_100%)]" />

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-end gap-3">
              <DomainAvatar
                domain={domain}
                companyName={company.name}
                logoUrl={company.logoUrl}
                className="h-16 w-16 border-[3px] border-white/90"
              />
              <div className="min-w-0 pb-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">Official profile</p>
                <p className="truncate text-sm font-semibold text-white">{domain || 'Employer brand page'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              {company.verificationStatus === 'VERIFIED' ? (
                <Badge variant="teal-soft" className="gap-1.5 px-2.5 py-1 text-[10px] font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified employer
                </Badge>
              ) : (
                <Badge variant="purple-soft" className="px-2.5 py-1 text-[10px] font-semibold">
                  Official company profile
                </Badge>
              )}
              <Badge variant="teal-soft" className="px-2.5 py-1 text-[10px] font-semibold">
                {formatCount(company.jobCount)} live role{company.jobCount === 1 ? '' : 's'}
              </Badge>
              {storyExists ? (
                <Badge variant="orange-soft" className="px-2.5 py-1 text-[10px] font-semibold">
                  Employer story
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2">
              <Link
                to={`/companies/${company.id}`}
                className="inline-flex max-w-full items-center gap-2 text-[1.75rem] font-semibold tracking-tight text-slate-950 transition-colors hover:text-primary"
              >
                <span className="truncate">{company.name}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>

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

              <p className="max-w-4xl text-pretty text-[14px] leading-6 text-slate-600">{summary}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {primaryIndustry ? (
                <Badge variant="purple-soft" className="px-3 py-1.5 text-xs font-semibold">
                  {primaryIndustry}
                </Badge>
              ) : null}
              {companySize ? (
                <Badge variant="neutral" className="px-3 py-1.5 text-xs font-semibold">
                  {companySize}
                </Badge>
              ) : null}
              {locationList.length > 0 ? (
                <Badge variant="neutral" className="px-3 py-1.5 text-xs font-semibold">
                  {locationList.length === 1 ? primaryLocation : `${formatCount(locationList.length)} hiring locations`}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {socialPreview.map((entry) => (
                <BrandLinkPill
                  key={entry.id}
                  label={entry.label}
                  href={entry.href}
                  domain={entry.domain}
                  icon={entry.icon}
                  variant={entry.badgeVariant}
                  tone={entry.tone}
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

          <div className="self-start rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">At a glance</p>
            <div className="mt-3">
              <p className="text-[2.5rem] font-semibold leading-none tracking-tight text-slate-950">{formatCount(company.jobCount)}</p>
              <p className="mt-1 text-sm text-slate-600">open role{company.jobCount === 1 ? '' : 's'}</p>
            </div>

            <div className="mt-4 space-y-3 rounded-[18px] border border-slate-200 bg-white/90 p-3">
              <DetailRow label="HQ" value={primaryLocation || 'Shared on roles'} />
              {yearFounded ? <DetailRow label="Founded" value={yearFounded} /> : null}
              <DetailRow label={yearFounded ? 'Links live' : 'Profile links'} value={`${formatCount(officialChannelCount)} live`} />
            </div>

            <Button asChild className="mt-4 h-10 w-full rounded-full gap-1.5">
              <Link to={`/companies/${company.id}`}>
                View company
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CareersPage() {
  const { isAuthenticated } = useCandidateAuth();
  const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

  const [companies, setCompanies] = useState<ApprovedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>('all');

  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      try {
        const response = await jobService.getPublicCompanies({ limit: 300 });
        if (response.success && response.data?.companies) {
          setCompanies(response.data.companies);
        } else {
          setCompanies([]);
        }
      } catch (_error) {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    void loadCompanies();
  }, []);

  const totalJobs = useMemo(() => companies.reduce((sum, company) => sum + company.jobCount, 0), [companies]);
  const hiringCompanies = useMemo(() => companies.filter((company) => company.jobCount > 0).length, [companies]);
  const verifiedCompanies = useMemo(
    () => companies.filter((company) => company.verificationStatus === 'VERIFIED').length,
    [companies]
  );
  const companiesWithStory = useMemo(
    () => companies.filter((company) => Boolean(extractText(company.about || company.overview))).length,
    [companies]
  );
  const popularSearches = useMemo(() => {
    const counts = new Map<string, number>();

    companies.forEach((company) => {
      const suggestions = [getPrimaryIndustry(company), ...getCompanyLocations(company).slice(0, 1)];

      suggestions.forEach((value) => {
        if (!value) return;
        counts.set(value, (counts.get(value) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([value]) => value);
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = companies.filter((company) => {
      if (companyFilter === 'hiring' && company.jobCount <= 0) {
        return false;
      }

      if (companyFilter === 'verified' && company.verificationStatus !== 'VERIFIED') {
        return false;
      }

      if (companyFilter === 'story' && !extractText(company.about || company.overview)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchHaystack = [
        company.name,
        company.domain,
        company.website,
        extractText(company.about || company.overview),
        getPrimaryIndustry(company),
        formatReadableValue(company.companySize),
        ...getCompanyLocations(company),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchHaystack.includes(query);
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'aToZ') {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === 'mostJobs') {
        return right.jobCount - left.jobCount;
      }

      const scoreDelta = getDiscoveryScore(right) - getDiscoveryScore(left);
      if (scoreDelta !== 0) return scoreDelta;
      return right.jobCount - left.jobCount;
    });
  }, [companies, companyFilter, searchQuery, sortBy]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || companyFilter !== 'all' || sortBy !== 'recommended';

  return (
    <Layout showSidebarTrigger={false}>
      <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcff_0%,#f6f8ff_28%,#ffffff_100%)]">
        <section className="border-b border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
            <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.18fr)_360px]">
                <div className="relative overflow-hidden px-5 py-6 md:px-8 md:py-8">
                  <div className="absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.17),transparent_62%)]" />
                  <div className="relative max-w-3xl space-y-4">
                    <Badge variant="purple-soft" className="gap-1.5 px-3 py-1 text-[11px] font-semibold">
                      <Sparkles className="h-3.5 w-3.5" />
                      Official employer directory
                    </Badge>
                    <div className="space-y-3">
                      <h1 className="max-w-3xl text-balance text-[2.35rem] font-semibold tracking-tight text-slate-950 md:text-[3.4rem]">
                        Find teams worth applying to before you open the role.
                      </h1>
                      <p className="max-w-2xl text-pretty text-[15px] leading-7 text-slate-600 md:text-base">
                        Search employer profiles, compare live hiring footprints, and validate official company context in one clean browse.
                      </p>
                    </div>
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
                      <SectionIconChip icon={Search} tone="brand" compact />
                      Search by employer, industry, or location and jump directly into live openings.
                    </div>
                  </div>
                </div>

                <aside className="border-t border-slate-200/80 bg-slate-50/80 p-5 lg:border-l lg:border-t-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Directory snapshot</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <OverviewStat icon={Building2} tone="brand" label="Companies" value={formatCount(companies.length)} />
                    <OverviewStat icon={Briefcase} tone="success" label="Live roles" value={formatCount(totalJobs)} />
                    <OverviewStat icon={BadgeCheck} tone="warning" label="Verified" value={formatCount(verifiedCompanies)} />
                    <OverviewStat icon={ImageIcon} tone="coral" label="Stories live" value={formatCount(companiesWithStory)} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Profiles surface live openings first, then layer in employer story, official links, and brand media where available.
                  </p>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.04)] md:p-5">
                <div className="flex items-start gap-3">
                  <SectionIconChip icon={Search} tone="brand" active />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Refine directory</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Browse the right employers faster</h2>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search employer, industry, or location"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-11 rounded-full border-slate-200 bg-white pl-10"
                    />
                  </div>

                  <Select value={companyFilter} onValueChange={(value: CompanyFilter) => setCompanyFilter(value)}>
                    <SelectTrigger className="h-11 rounded-full border-slate-200 bg-white">
                      <SelectValue placeholder="Filter employers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employers</SelectItem>
                      <SelectItem value="hiring">Hiring now ({formatCount(hiringCompanies)})</SelectItem>
                      <SelectItem value="verified">Verified employers ({formatCount(verifiedCompanies)})</SelectItem>
                      <SelectItem value="story">With company story ({formatCount(companiesWithStory)})</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="h-11 rounded-full border-slate-200 bg-white">
                      <SelectValue placeholder="Sort employers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="mostJobs">Most live roles</SelectItem>
                      <SelectItem value="aToZ">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {popularSearches.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Popular searches</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {popularSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSearchQuery(item)}
                          className="transition-transform hover:-translate-y-0.5"
                        >
                          <Badge variant="neutral" className="px-3 py-1.5 text-xs font-semibold">
                            {item}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {hasActiveFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 h-9 rounded-full px-3 text-slate-600 hover:bg-slate-100"
                    onClick={() => {
                      setSearchQuery('');
                      setCompanyFilter('all');
                      setSortBy('recommended');
                    }}
                  >
                    Reset directory
                  </Button>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.03)] md:p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">What you can compare</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <SectionIconChip icon={Sparkles} tone="brand" compact />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Employer story</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Read how the company describes its mission, environment, and public brand.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <SectionIconChip icon={Briefcase} tone="success" compact />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Hiring footprint</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Compare role volume quickly before you commit time to a deeper read.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <SectionIconChip icon={Globe} tone="warning" compact />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Official channels</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Validate website and social presence without leaving the directory flow.</p>
                    </div>
                  </div>
                </div>

                <Button asChild variant="outline" className="mt-5 h-10 w-full rounded-full border-slate-200 bg-white">
                  <Link to="/jobs">
                    Browse all jobs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </aside>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.03)] md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Employer directory</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                      {formatCount(filteredCompanies.length)} company profile{filteredCompanies.length === 1 ? '' : 's'} in view
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Showing {formatCount(filteredCompanies.length)} of {formatCount(companies.length)} public employer profiles with live hiring context.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {searchQuery.trim() ? (
                      <Badge variant="purple-soft" className="px-3 py-1.5 text-xs font-semibold">
                        Search: {searchQuery.trim()}
                      </Badge>
                    ) : null}
                    {companyFilter !== 'all' ? (
                      <Badge variant="teal-soft" className="px-3 py-1.5 text-xs font-semibold">
                        {getFilterLabel(companyFilter)}
                      </Badge>
                    ) : null}
                    {sortBy !== 'recommended' ? (
                      <Badge variant="orange-soft" className="px-3 py-1.5 text-xs font-semibold">
                        {sortBy === 'mostJobs' ? 'Sorted by live roles' : 'Sorted alphabetically'}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]"
                    >
                      <div className="grid gap-0 xl:grid-cols-[248px_minmax(0,1fr)]">
                        <Skeleton className="h-[220px] w-full xl:h-full" />
                        <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_220px]">
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Skeleton className="h-7 w-28 rounded-full" />
                              <Skeleton className="h-7 w-24 rounded-full" />
                            </div>
                            <div className="space-y-3">
                              <Skeleton className="h-8 w-2/3" />
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-5/6" />
                            </div>
                            <div className="flex gap-2">
                              <Skeleton className="h-7 w-24 rounded-full" />
                              <Skeleton className="h-7 w-28 rounded-full" />
                              <Skeleton className="h-7 w-20 rounded-full" />
                            </div>
                          </div>
                          <Skeleton className="h-[208px] rounded-[24px]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-[0_16px_45px_rgba(15,23,42,0.03)]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">No employers match the current directory filters</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Try a broader keyword, switch back to all employers, or browse the full jobs directory instead.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5 rounded-full border-slate-200"
                    onClick={() => {
                      setSearchQuery('');
                      setCompanyFilter('all');
                      setSortBy('recommended');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCompanies.map((company) => (
                    <CompanyListItem key={company.id} company={company} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
