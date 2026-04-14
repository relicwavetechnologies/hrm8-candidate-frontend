import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
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
  Search,
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
  return first ? titleCase(first) : 'Technology';
}

function companyLocation(company: ApprovedCompany | null): string {
  if (!company) return 'San Francisco, CA';

  const primaryParts = [company.primaryLocation?.city, company.primaryLocation?.stateOrRegion, company.primaryLocation?.country]
    .map(text)
    .filter(Boolean);
  if (primaryParts.length > 0) return primaryParts.slice(0, 2).join(', ');

  const firstAdditional = (company.additionalLocations || [])[0];
  const additionalParts = [firstAdditional?.city, firstAdditional?.stateOrRegion, firstAdditional?.country]
    .map(text)
    .filter(Boolean);
  if (additionalParts.length > 0) return additionalParts.slice(0, 2).join(', ');

  return 'San Francisco, CA';
}

function companyDomain(company: ApprovedCompany | null): string {
  const raw = text(company?.domain || company?.website);
  if (!raw) return 'designhubinc.com';
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
  return 'Full-time';
}

function departmentLabel(job: PublicJob): string {
  return text(job.department) || 'General';
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
    if (fromData) return fromData;
    return 'DesignHub Inc. is a pioneer in cloud-native infrastructure, dedicated to simplifying complex deployment pipelines for modern engineering teams. Founded on the belief that developers should spend more time building and less time managing servers, we\'ve created a suite of tools that automate the hardest parts of DevOps. Our mission is to democratize scalable architecture and empower teams to move faster with confidence.';
  }, [company]);

  const aboutParagraphs = useMemo(() => toParagraphs(about), [about]);

  const companyName = company?.name || 'DesignHub Inc.';
  const industry = companyIndustry(company);
  const headquarters = companyLocation(company);
  const domain = companyDomain(company);
  const linkedin = socialLinkDisplay(company?.social?.linkedin) || `linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '')}`;

  const coverImage =
    company?.bannerUrl ||
    (Array.isArray(company?.images) && company.images.length > 0 ? company.images[0] : null) ||
    'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1800&auto=format&fit=crop';

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

    if (computed.length > 0) return computed;

    return [
      { name: 'Engineering', count: 8 },
      { name: 'Design', count: 3 },
      { name: 'Product', count: 4 },
    ];
  }, [jobs]);

  const benefits = ['Remote-first', 'Health insurance', '401k matching', 'Unlimited PTO', 'Wellness stipend'];

  const founded = company?.yearFounded || 2015;
  const companySize = titleCase(company?.companySize) || '200-500';
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
        <div className="mx-auto flex h-24 w-full max-w-[1276px] items-end justify-between">
          <img src={logoDark} alt="HRM8" className="h-[28px] w-auto" />

          <nav className="flex items-center gap-16 text-[16px]">
            <Link to="/jobs" className="flex h-[64px] items-center gap-2 px-4 pb-[15px] pt-4 text-[#656565]">
              <Briefcase className="h-5 w-5" />
              Find jobs
            </Link>
            <Link to="/careers" className="flex h-[64px] items-center gap-2 border-b border-[#5b67f3] px-4 pb-[15px] pt-4 text-[#5b67f3]">
              <Building2 className="h-5 w-5" />
              Companies
            </Link>
            <button type="button" className="flex h-[64px] items-center gap-2 px-4 pb-[15px] pt-4 text-[#656565]">
              <CircleDollarSign className="h-5 w-5" />
              Salaries
            </button>
          </nav>

          <div className="flex items-center gap-6 pb-7">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-black/10 bg-[#e0e0e0]">
              <div className="flex h-full w-full items-center justify-center text-[12px] font-medium text-[#474747]">
                {candidate?.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <Bell className="h-6 w-6 text-[#191919]" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1276px] pb-16">
        <div className="flex h-[56px] items-center gap-3 text-[12px] leading-[16px] text-[#959595]">
          <button type="button" onClick={() => navigate('/careers')} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </button>
          <span className="text-[#d0d5dd]">|</span>
          <span>Companies</span>
          <ChevronRight className="h-3 w-3" />
          <span>{industry}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#191919]">{companyName}</span>
        </div>

        <section className="relative">
          <div className="h-[350px] overflow-hidden">
            <img src={coverImage} alt={`${companyName} banner`} className="h-full w-full object-cover" />
          </div>

          <div className="relative border border-t-0 border-[#e8e8e8] bg-white px-8 pb-6 pt-4">
            <div className="absolute -top-[37px] left-8 flex h-[139px] w-[139px] items-center justify-center rounded-[30px] border-[2.5px] border-[#e8e8e8] bg-[#ffeeee]">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={companyName} className="h-[79px] w-[79px] rounded-[16px] object-cover" />
              ) : (
                <span className="text-[40px] font-semibold text-[#ef6b6b]">{initials}</span>
              )}
            </div>

            <div className="flex flex-col items-center text-center">
              <h1 className="text-[32px] font-medium leading-[44px] text-[#191919]">{companyName}</h1>
              <p className="mt-1 text-[16px] leading-[26px] text-[#656565]">
                {aboutParagraphs[0] || 'Building the next generation of cloud infrastructure and AI-driven automation tools.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eff8ff] px-2 py-[2px] text-[12px] font-medium leading-[18px] text-[#175cd3]">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Employer
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2 py-[2px] text-[12px] font-medium leading-[18px] text-[#027a48]">
                  <CheckCircle2 className="h-3 w-3" />
                  Actively Hiring
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f4f7] px-2 py-[2px] text-[12px] font-medium leading-[18px] text-[#344054]">
                  <Globe className="h-3 w-3" />
                  {industry}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,744px)_minmax(0,516px)]">
          <div className="space-y-4">
            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h2 className="text-[32px] font-medium leading-[44px] text-[#191919]">About {companyName}</h2>
              <div className="mt-4 space-y-4 text-[14px] leading-[24px] text-[#656565]">
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={`about-${index}`}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <Calendar className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Founded</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{founded}</p>
                </div>
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <Users2 className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Company Size</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{companySize}</p>
                </div>
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <MapPin className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Headquarters</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{headquarters}</p>
                </div>
                <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 text-center">
                  <Building2 className="mx-auto h-4 w-4 text-[#5b67f3]" />
                  <p className="mt-2 text-[12px] leading-[16px] text-[#959595]">Industry</p>
                  <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#474747]">{industry}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h2 className="text-[32px] font-medium leading-[44px] text-[#191919]">Our Culture</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="space-y-4">
                  <div>
                    <p className="inline-flex items-center gap-2 text-[16px] font-medium leading-[26px] text-[#474747]">
                      <CheckCircle2 className="h-4 w-4 text-[#5b67f3]" />
                      Remote-First Flexibility
                    </p>
                    <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">
                      Work from anywhere. We care about output, not hours spent at a desk.
                    </p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-2 text-[16px] font-medium leading-[26px] text-[#474747]">
                      <CheckCircle2 className="h-4 w-4 text-[#5b67f3]" />
                      Continuous Learning
                    </p>
                    <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">
                      Generous stipends for courses, conferences, and books.
                    </p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-2 text-[16px] font-medium leading-[26px] text-[#474747]">
                      <CheckCircle2 className="h-4 w-4 text-[#5b67f3]" />
                      Inclusive Environment
                    </p>
                    <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">
                      We actively foster a diverse team and celebrate different perspectives.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <img
                    src={(company.images && company.images[0]) || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=640&auto=format&fit=crop'}
                    alt="Culture 1"
                    className="h-[95px] w-full rounded-[8px] object-cover"
                  />
                  <img
                    src={(company.images && company.images[1]) || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=640&auto=format&fit=crop'}
                    alt="Culture 2"
                    className="h-[95px] w-full rounded-[8px] object-cover"
                  />
                </div>
              </div>
            </article>

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
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {departmentLabel(job)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {text(job.location) || 'Remote'}
                            </span>
                            <span>{employmentTypeLabel(job.employmentType || job.employment_type)}</span>
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
              <div className="mt-3 space-y-3 text-[12px] leading-[16px] text-[#656565]">
                <p className="inline-flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  {domain}
                </p>
                <p className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#94969c]" />
                  {linkedin}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {headquarters}
                </p>
              </div>

              <div className="my-4 h-px w-full bg-[#e8e8e8]" />

              <button
                type="button"
                onClick={() =>
                  safeOpenExternal(
                    company.website
                      ? `https://${company.website.replace(/^https?:\/\//, '')}`
                      : `https://${domain}`
                  )
                }
                className="h-8 w-full rounded-[8px] border border-[#5b67f3] text-[12px] font-semibold leading-[16px] text-[#5b67f3]"
              >
                View Website
              </button>
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h3 className="text-[24px] font-medium leading-[36px] text-[#191919]">Hiring Snapshot</h3>
              <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">Currently hiring for:</p>

              <div className="mt-3 space-y-2">
                {hiringSnapshot.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-[8px] border border-[#e8e8e8] px-3 py-2">
                    <p className="text-[12px] leading-[16px] text-[#474747]">{entry.name}</p>
                    <span className="text-[10px] leading-[14px] text-[#656565]">{entry.count} roles</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/jobs?search=${encodeURIComponent(companyName)}`)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 text-[12px] font-semibold leading-[16px] text-[#5b67f3]"
              >
                See All Open Roles
                <ChevronRight className="h-4 w-4" />
              </button>
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <h3 className="text-[24px] font-medium leading-[36px] text-[#191919]">Benefits &amp; Perks</h3>
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
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
