import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Globe,
  MapPin,
  PenTool,
  Search,
  SquareCode,
  Users2,
} from 'lucide-react';

import logoDark from '@/assets/logo-dark.png';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { safeOpenExternal } from '@/shared/lib/safeExternalLink';
import { jobService, type ApprovedCompany, type PublicJob } from '@/shared/services/jobService';

function text(value?: string | null): string {
  return String(value || '').trim();
}

function cleanText(value?: string | null): string {
  return text(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleCase(value?: string | null): string {
  const normalized = text(value);
  if (!normalized) return '';
  return normalized
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function companyIndustry(company: ApprovedCompany | null): string {
  const first = (company?.industries || []).find((item) => text(item));
  return first ? titleCase(first) : '';
}

function companyLocation(company: ApprovedCompany | null): string {
  if (!company) return '';

  const primaryParts = [company.primaryLocation?.city, company.primaryLocation?.stateOrRegion, company.primaryLocation?.country]
    .map(text)
    .filter(Boolean);
  if (primaryParts.length > 0) return primaryParts.slice(0, 2).join(', ');

  const firstAdditional = (company.additionalLocations || [])[0];
  const additionalParts = [firstAdditional?.city, firstAdditional?.stateOrRegion, firstAdditional?.country]
    .map(text)
    .filter(Boolean);
  if (additionalParts.length > 0) return additionalParts.slice(0, 2).join(', ');

  return '';
}

function companyDomain(company: ApprovedCompany | null): string {
  const raw = text(company?.domain || company?.website);
  if (!raw) return '';
  return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

function socialLinkDisplay(value?: string | null): string {
  const cleaned = text(value);
  if (!cleaned) return '';
  return cleaned.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

function toParagraphs(input: string): string[] {
  const normalized = cleanText(input);
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return sentences;
  return [sentences.slice(0, 2).join(' '), sentences.slice(2, 4).join(' '), sentences.slice(4).join(' ')].filter(Boolean);
}

function employmentTypeLabel(value?: string): string {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'FULL_TIME') return 'Full-time';
  if (normalized === 'PART_TIME') return 'Part-time';
  if (normalized === 'CONTRACT') return 'Contract';
  if (normalized === 'CASUAL') return 'Casual';
  return '';
}

function departmentLabel(job: PublicJob): string {
  return text(job.department);
}

type DepartmentCount = {
  name: string;
  count: number;
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidate } = useCandidateAuth();

  const [company, setCompany] = useState<ApprovedCompany | null>(null);
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await jobService.getPublicCompanyDetail(id, { page: 1, limit: 100 });
        if (!response.success || !response.data) {
          setCompany(null);
          setJobs([]);
          setError('Company not found');
          return;
        }

        setCompany(response.data.company);
        setJobs(response.data.jobs || []);
        setDepartments(response.data.filters?.departments || []);
        setLocations(response.data.filters?.locations || []);
      } catch (loadError) {
        console.error('Failed to load company profile:', loadError);
        setCompany(null);
        setJobs([]);
        setError('Failed to load company details');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id]);

  const about = useMemo(() => {
    const fromData = cleanText(company?.about || company?.overview || '');
    return fromData;
  }, [company]);

  const aboutParagraphs = useMemo(() => toParagraphs(about), [about]);

  const companyName = company?.name || '';
  const industry = companyIndustry(company);
  const headquarters = companyLocation(company);
  const domain = companyDomain(company);
  const linkedin = socialLinkDisplay(company?.social?.linkedin);

  const coverImage =
    company?.bannerUrl ||
    (Array.isArray(company?.images) && company.images.length > 0 ? company.images[0] : null);

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const byDepartment = jobs.filter((job) => {
      if (departmentFilter === 'ALL') return true;
      return departmentLabel(job) === departmentFilter;
    });

    const byLocation = byDepartment.filter((job) => {
      if (locationFilter === 'ALL') return true;
      return text(job.location) === locationFilter;
    });

    if (!query) return byLocation.slice(0, 3);

    return byLocation
      .filter((job) => {
        const haystack = `${job.title} ${departmentLabel(job)} ${text(job.location)} ${cleanText(job.jobSummary || job.description || '')}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 3);
  }, [departmentFilter, jobs, locationFilter, searchTerm]);

  const hiringSnapshot = useMemo<DepartmentCount[]>(() => {
    const counts = new Map<string, number>();
    jobs.forEach((job) => {
      const key = departmentLabel(job);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const computed = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return computed;
  }, [jobs]);

  const benefits = useMemo(() => {
    const companyBenefits = Array.isArray(company?.benefits) ? company.benefits : [];
    const jobBenefits = jobs
      .flatMap((job) => {
        const raw = job.benefits;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map((item) => text(item));
        return text(String(raw))
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean);
      })
      .filter(Boolean);

    return Array.from(new Set([...companyBenefits, ...jobBenefits])).slice(0, 10);
  }, [company?.benefits, jobs]);

  const cultureHighlights = useMemo(() => {
    return Array.isArray(company?.cultureHighlights) ? company.cultureHighlights.filter((item) => text(item)) : [];
  }, [company?.cultureHighlights]);
  const cultureImages = Array.isArray(company?.images) ? company.images.filter((item) => text(item)).slice(0, 2) : [];

  const founded = company?.yearFounded || null;
  const companySize = titleCase(company?.companySize) || null;
  const initials = companyName.slice(0, 1).toUpperCase() || 'D';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif]">
        <div className="mx-auto flex min-h-screen max-w-[1276px] items-center justify-center px-4">
          <p className="text-[16px] leading-[26px] text-[#656565]">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif]">
        <div className="mx-auto flex min-h-screen max-w-[1276px] flex-col items-center justify-center gap-4 px-4">
          <p className="text-[24px] font-medium leading-[36px] text-[#191919]">Company not found</p>
          <button
            type="button"
            onClick={() => navigate('/careers')}
            className="rounded-[8px] border border-[#d5d7da] px-4 py-2 text-[14px] font-medium text-[#474747]"
          >
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif] text-[#474747]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-[1276px] items-center justify-between">
          <img src={logoDark} alt="HRM8" className="h-[28px] w-auto" />

          <nav className="flex h-full items-center gap-12 text-[16px]">
            <Link to="/jobs" className="inline-flex h-full items-center gap-2 px-4 text-[#656565]">
              <Briefcase className="h-5 w-5" />
              Find jobs
            </Link>
            <Link to="/careers" className="inline-flex h-full items-center gap-2 border-b border-[#5b67f3] px-4 text-[#5b67f3]">
              <Building2 className="h-5 w-5" />
              Companies
            </Link>
            <button type="button" className="inline-flex h-full items-center gap-2 px-4 text-[#656565]">
              <CircleDollarSign className="h-5 w-5" />
              Salaries
            </button>
          </nav>

          <div className="flex items-center gap-6">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-black/10 bg-[#e0e0e0]">
              <div className="flex h-full w-full items-center justify-center text-[12px] font-medium text-[#474747]">
                {candidate?.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <Bell className="h-6 w-6 text-[#191919]" />
          </div>
        </div>
      </header>

      <main className="w-full pb-16">
        <div className="mx-auto w-full max-w-[1276px]">
          <div className="flex h-[56px] items-center gap-3 px-2 text-[12px] leading-[16px] text-[#959595]">
            <button type="button" onClick={() => navigate('/careers')} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </button>
            <span className="text-[#d0d5dd]">|</span>
            <span>Companies</span>
            {industry ? (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{industry}</span>
              </>
            ) : null}
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#191919]">{companyName}</span>
          </div>
        </div>

        <section className="h-[280px] w-full overflow-hidden border-y border-[#e8e8e8] bg-[#111827]">
          {coverImage ? (
            <img src={coverImage} alt={`${companyName} banner`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[#1f2937]" />
          )}
        </section>

        <section className="mx-auto -mt-8 w-full max-w-[1276px] px-2">
          <div className="relative border border-[#e8e8e8] bg-white px-6 pb-5 pt-5">
            <div className="absolute -top-[52px] left-10 flex h-[140px] w-[140px] items-center justify-center rounded-[28px] border-[3px] border-[#d5d7da] bg-[#ffeeee]">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={companyName} className="h-[82px] w-[82px] rounded-[14px] object-cover" />
              ) : (
                <span className="text-[50px] font-semibold leading-[1] text-[#ef6b6b]">{initials}</span>
              )}
            </div>

            <div className="pl-[196px] pt-1">
              <h1 className="text-[34px] font-medium leading-[44px] text-[#191919]">{companyName}</h1>
              {aboutParagraphs[0] ? <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">{aboutParagraphs[0]}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {company.verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium leading-[18px] text-[#175cd3]">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Employer
                  </span>
                ) : null}
                {company.jobCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium leading-[18px] text-[#12b76a]">
                    <span className="h-2 w-2 rounded-full bg-[#12b76a]" />
                    Actively Hiring
                  </span>
                ) : null}
                {industry ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium leading-[18px] text-[#667085]">
                    <Globe className="h-3 w-3" />
                    {industry}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 grid w-full max-w-[1276px] grid-cols-1 gap-4 px-2 xl:grid-cols-[minmax(0,744px)_minmax(0,516px)]">
          <div className="space-y-4">
            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h2 className="text-[32px] font-medium leading-[44px] text-[#191919]">About {companyName}</h2>
              {aboutParagraphs.length > 0 ? (
                <div className="mt-4 space-y-4 text-[14px] leading-[24px] text-[#656565]">
                  {aboutParagraphs.map((paragraph, index) => (
                    <p key={`about-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[14px] leading-[24px] text-[#959595]">No company overview available.</p>
              )}
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <Calendar className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Founded</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{founded ?? '—'}</p>
                </div>
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <Users2 className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Company Size</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{companySize || '—'}</p>
                </div>
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <MapPin className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Headquarters</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{headquarters || '—'}</p>
                </div>
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <Building2 className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Industry</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{industry || '—'}</p>
                </div>
              </div>
            </article>

            {cultureHighlights.length > 0 || cultureImages.length > 0 ? (
              <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
                <h2 className="text-[32px] font-medium leading-[44px] text-[#191919]">Our Culture</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_308px]">
                  <div className="space-y-3">
                    {cultureHighlights.length > 0 ? (
                      cultureHighlights.slice(0, 4).map((item, index) => (
                        <div key={`${item}-${index}`} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#7a82f7]" />
                          <p className="text-[18px] leading-[32px] text-[#474747]">{item}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[14px] leading-[24px] text-[#959595]">No culture highlights available.</p>
                    )}
                  </div>

                  {cultureImages.length > 0 ? (
                    <div className="relative hidden min-h-[294px] md:block">
                      <img
                        src={cultureImages[0]}
                        alt={`${companyName} culture 1`}
                        className="absolute right-[48px] top-0 h-[138px] w-[196px] rounded-[12px] object-cover"
                      />
                      {cultureImages[1] ? (
                        <img
                          src={cultureImages[1]}
                          alt={`${companyName} culture 2`}
                          className="absolute right-0 top-[124px] h-[138px] w-[196px] rounded-[12px] object-cover"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ) : null}

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h2 className="text-[32px] font-medium leading-[44px] text-[#191919]">Open Positions</h2>

              <div className="mt-4 rounded-[8px] border border-[#e8e8e8] p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-12 min-w-[260px] flex-1 items-center gap-3 rounded-[8px] border-[1.5px] border-[#e5e7ea] bg-[#f9fafb] px-3">
                    <Search className="h-5 w-5 text-[#b8b8b8]" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search roles..."
                      className="h-full flex-1 bg-transparent text-[14px] leading-[24px] text-[#474747] outline-none placeholder:text-[#b8b8b8]"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={departmentFilter}
                      onChange={(event) => setDepartmentFilter(event.target.value)}
                      className="h-10 min-w-[156px] appearance-none rounded-[8px] border border-[#d5d7da] bg-white py-2 pl-3 pr-9 text-[12px] font-medium text-[#474747]"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#656565]" />
                  </div>

                  <div className="relative">
                    <select
                      value={locationFilter}
                      onChange={(event) => setLocationFilter(event.target.value)}
                      className="h-10 min-w-[116px] appearance-none rounded-[8px] border border-[#d5d7da] bg-white py-2 pl-3 pr-9 text-[12px] font-medium text-[#474747]"
                    >
                      <option value="ALL">Location</option>
                      {locations.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#656565]" />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {filteredJobs.length === 0 ? (
                  <div className="rounded-[8px] border border-[#e8e8e8] px-4 py-5 text-center text-[14px] leading-[24px] text-[#656565]">
                    No roles found for selected filters.
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="rounded-[8px] border border-[#e8e8e8] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[18px] font-medium leading-[28px] text-[#191919]">{job.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[14px] leading-[24px] text-[#474747]">
                            {departmentLabel(job) ? (
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {departmentLabel(job)}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {text(job.location) || '—'}
                            </span>
                            {employmentTypeLabel(job.employmentType || job.employment_type) ? (
                              <span>{employmentTypeLabel(job.employmentType || job.employment_type)}</span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="h-8 shrink-0 rounded-[8px] bg-[#eff0fe] px-3 text-[12px] font-semibold leading-[16px] text-[#5b67f3]"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/jobs?search=${encodeURIComponent(companyName)}`)}
                className="mt-4 inline-flex h-8 w-full items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-[#e8e8e8] text-[12px] font-semibold text-[#474747]"
              >
                View All {jobs.length || company.jobCount || 0} Jobs
                <ChevronRight className="h-4 w-4" />
              </button>
            </article>
          </div>

          <aside className="space-y-4">
            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h3 className="text-[24px] font-medium leading-[36px] text-[#191919]">Quick Info</h3>
              <div className="mt-4 grid gap-2 text-[12px] leading-[16px] text-[#656565]">
                {domain ? (
                  <p className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    {domain}
                  </p>
                ) : null}
                {linkedin ? (
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#94969c]" />
                    {linkedin}
                  </p>
                ) : null}
                {headquarters ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {headquarters}
                  </p>
                ) : null}
              </div>

              <div className="mb-4 mt-5 h-px w-full bg-[#e8e8e8]" />

              <button
                type="button"
                onClick={() =>
                  safeOpenExternal(
                    company.website
                      ? `https://${company.website.replace(/^https?:\/\//, '')}`
                      : domain
                        ? `https://${domain}`
                        : ''
                  )
                }
                className="h-8 w-full rounded-[8px] border border-[#5b67f3] text-[12px] font-semibold leading-[16px] text-[#5b67f3]"
                disabled={!company.website && !domain}
              >
                View Website
              </button>
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h3 className="text-[24px] font-medium leading-[36px] text-[#191919]">Hiring Snapshot</h3>
              <p className="mt-1 text-[16px] leading-[26px] text-[#656565]">Currently hiring for:</p>

              <div className="mt-4 space-y-3">
                {hiringSnapshot.length > 0 ? (
                  hiringSnapshot.map((entry, index) => {
                    const iconClass = index === 0 ? 'text-[#5b67f3]' : index === 1 ? 'text-[#7a5af8]' : 'text-[#12b76a]';
                    const Icon = index === 0 ? SquareCode : index === 1 ? PenTool : BarChart3;

                    return (
                      <div key={entry.name} className="flex items-center justify-between rounded-[10px] border border-[#e8e8e8] px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#f5f7ff]">
                            <Icon className={`h-4 w-4 ${iconClass}`} />
                          </span>
                          <p className="text-[16px] font-normal leading-[26px] text-[#656565]">{entry.name}</p>
                        </div>
                        <span className="rounded-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-[1px] text-[16px] font-normal leading-[26px] text-[#656565]">
                          {entry.count} roles
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[14px] leading-[24px] text-[#959595]">No active roles available.</p>
                )}
              </div>

              {hiringSnapshot.length > 0 ? (
                <>
                  <div className="mb-4 mt-5 h-px w-full bg-[#e8e8e8]" />
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs?search=${encodeURIComponent(companyName)}`)}
                    className="inline-flex w-full items-center justify-center gap-2 text-[16px] font-medium leading-[26px] text-[#4f5dff]"
                  >
                    See All Open Roles
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/jobs?search=${encodeURIComponent(companyName)}`)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 text-[12px] font-semibold leading-[16px] text-[#5b67f3]"
                >
                  See All Open Roles
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h3 className="text-[24px] font-medium leading-[36px] text-[#191919]">Benefits &amp; Perks</h3>
              {benefits.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {benefits.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-[#e9eaeb] bg-[#fafafa] px-2 py-[2px] text-[12px] font-medium leading-[18px] text-[#414651]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[14px] leading-[24px] text-[#959595]">No benefits listed.</p>
              )}
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
