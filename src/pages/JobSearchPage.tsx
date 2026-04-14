import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe,
  MapPin,
  Search,
} from 'lucide-react';

import logoDark from '@/assets/logo-dark.png';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient } from '@/shared/services/api';
import { jobService } from '@/shared/services/jobService';
import type { PublicJob } from '@/shared/services/jobService';

const JOBS_PER_PAGE = 6;

const WORK_MODEL_OPTIONS = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'Onsite', value: 'ON_SITE' },
] as const;

const EMPLOYMENT_OPTIONS = [
  { label: 'Full-time', value: 'FULL_TIME' },
  { label: 'Part-time', value: 'PART_TIME' },
  { label: 'Contract', value: 'CONTRACT' },
] as const;

const QUICK_CHIPS = ['Remote', 'Full-time', 'Tech', 'Design', 'Sales'] as const;

type SortValue = 'relevance' | 'latest' | 'salary_high' | 'salary_low';
type PostedDateFilter = '24h' | 'week' | 'month';

function normalizeWorkArrangement(job: PublicJob): string {
  return String(job.workArrangement || job.work_arrangement || '').toUpperCase();
}

function normalizeEmploymentType(job: PublicJob): string {
  return String(job.employmentType || job.employment_type || '').toUpperCase();
}

function compactMoney(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function salaryText(job: PublicJob): string {
  const min = job.salaryMin ?? job.salary_min;
  const max = job.salaryMax ?? job.salary_max;
  const hidden = Boolean(job.hideSalary ?? job.hide_salary);
  if (hidden) return 'Competitive';
  if (!min && !max) return 'Salary not disclosed';
  if (min && max) return `$${compactMoney(min)}–$${compactMoney(max)}/year`;
  if (min) return `$${compactMoney(min)}+/year`;
  return `Up to $${compactMoney(max as number)}/year`;
}

function extractLocation(job: PublicJob) {
  const city = job.jobLocation?.city?.trim();
  const fallback = job.location?.trim() || 'Location not specified';
  if (!city) return fallback;
  return fallback.includes(city) ? fallback : `${city}, ${fallback}`;
}

function getPostedDate(job: PublicJob): Date | null {
  const value = job.postingDate || job.posting_date || job.createdAt || job.created_at;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function postedText(job: PublicJob): string {
  const date = getPostedDate(job);
  if (!date) return 'Recently';
  return formatDistanceToNow(date, { addSuffix: true });
}

function scoreFromSearch(job: PublicJob, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const title = job.title?.toLowerCase() || '';
  const company = job.company?.name?.toLowerCase() || '';
  const desc = (job.jobSummary || job.job_summary || job.description || '').toLowerCase();
  const tags = (job.promotionalTags || job.promotional_tags || []).join(' ').toLowerCase();

  let score = 0;
  if (title.includes(q)) score += 8;
  if (company.includes(q)) score += 5;
  if (tags.includes(q)) score += 3;
  if (desc.includes(q)) score += 2;
  return score;
}

export default function JobSearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, candidate } = useCandidateAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<PublicJob[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedWorkModels, setSelectedWorkModels] = useState<string[]>(['REMOTE']);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>(['FULL_TIME']);
  const [salaryRange, setSalaryRange] = useState(120000);
  const [postedDateFilter, setPostedDateFilter] = useState<PostedDateFilter>('24h');
  const [sortBy, setSortBy] = useState<SortValue>('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await jobService.getPublicJobs({
        search: searchQuery || undefined,
        limit: 200,
      });
      if (response.success && response.data?.jobs) {
        setAllJobs(response.data.jobs);
      } else {
        setAllJobs([]);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setAllJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const loadSavedJobs = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedJobIds(new Set());
      return;
    }

    try {
      const response = await apiClient.get('/api/candidate/saved-jobs');
      if (response.success && response.data) {
        const jobs = Array.isArray(response.data) ? response.data : [];
        const ids = new Set(
          jobs
            .map((item: { job?: { id: string }; jobId?: string }) => item.job?.id || item.jobId)
            .filter(Boolean) as string[]
        );
        setSavedJobIds(ids);
      } else {
        setSavedJobIds(new Set());
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error('Failed to load saved jobs:', error);
      }
      setSavedJobIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  const filteredJobs = useMemo(() => {
    const now = Date.now();
    const cutoffMs =
      postedDateFilter === '24h'
        ? 24 * 60 * 60 * 1000
        : postedDateFilter === 'week'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

    const locationNeedle = locationFilter.trim().toLowerCase();

    const filtered = allJobs.filter((job) => {
      const workArrangement = normalizeWorkArrangement(job);
      const employmentType = normalizeEmploymentType(job);

      if (selectedWorkModels.length > 0 && !selectedWorkModels.includes(workArrangement)) {
        return false;
      }
      if (selectedEmploymentTypes.length > 0 && !selectedEmploymentTypes.includes(employmentType)) {
        return false;
      }

      if (locationNeedle) {
        const locationText = `${job.location || ''} ${job.jobLocation?.city || ''} ${job.jobLocation?.country || ''}`.toLowerCase();
        if (!locationText.includes(locationNeedle)) return false;
      }

      const salaryMax = job.salaryMax ?? job.salary_max;
      if (salaryMax && salaryMax < salaryRange) return false;

      const posted = getPostedDate(job);
      if (posted && now - posted.getTime() > cutoffMs) return false;

      return true;
    });

    const jobsWithScore = filtered.map((job) => ({
      job,
      score: scoreFromSearch(job, searchQuery),
    }));

    jobsWithScore.sort((a, b) => {
      if (sortBy === 'latest') {
        const aDate = getPostedDate(a.job)?.getTime() || 0;
        const bDate = getPostedDate(b.job)?.getTime() || 0;
        return bDate - aDate;
      }

      if (sortBy === 'salary_high') {
        const aSalary = a.job.salaryMax ?? a.job.salary_max ?? 0;
        const bSalary = b.job.salaryMax ?? b.job.salary_max ?? 0;
        return bSalary - aSalary;
      }

      if (sortBy === 'salary_low') {
        const aSalary = a.job.salaryMin ?? a.job.salary_min ?? Number.MAX_SAFE_INTEGER;
        const bSalary = b.job.salaryMin ?? b.job.salary_min ?? Number.MAX_SAFE_INTEGER;
        return aSalary - bSalary;
      }

      if (b.score !== a.score) return b.score - a.score;
      const aDate = getPostedDate(a.job)?.getTime() || 0;
      const bDate = getPostedDate(b.job)?.getTime() || 0;
      return bDate - aDate;
    });

    return jobsWithScore.map((entry) => entry.job);
  }, [allJobs, locationFilter, postedDateFilter, salaryRange, searchQuery, selectedEmploymentTypes, selectedWorkModels, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

  const paginatedJobs = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [currentPage, filteredJobs, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleSaveJob = async (jobId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save jobs.',
      });
      navigate('/login', { state: { from: '/jobs' } });
      return;
    }

    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        const response = await apiClient.delete(`/api/candidate/saved-jobs/${jobId}`);
        if (response.success) {
          setSavedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
        }
      } else {
        const response = await apiClient.post(`/api/candidate/saved-jobs/${jobId}`);
        if (response.success) {
          setSavedJobIds((prev) => new Set(prev).add(jobId));
        }
      }
    } catch (error) {
      console.error('Failed to toggle saved job:', error);
    }
  };

  const toggleGroupValue = (
    value: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const clearAllFilters = () => {
    setLocationFilter('');
    setSelectedWorkModels([]);
    setSelectedEmploymentTypes([]);
    setSalaryRange(0);
    setPostedDateFilter('24h');
    setCurrentPage(1);
  };

  const quickChipClick = (chip: (typeof QUICK_CHIPS)[number]) => {
    if (chip === 'Remote') {
      toggleGroupValue('REMOTE', setSelectedWorkModels);
      return;
    }
    if (chip === 'Full-time') {
      toggleGroupValue('FULL_TIME', setSelectedEmploymentTypes);
      return;
    }
    setSearchInput(chip);
    setSearchQuery(chip);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif] text-[#474747]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex h-24 w-full max-w-[1276px] items-end justify-between pb-0">
          <img src={logoDark} alt="HRM8" className="h-[28px] w-auto" />

          <nav className="flex items-center gap-16 text-[16px]">
            <button className="flex h-[64px] items-center gap-2 border-b border-[#5b67f3] px-4 pb-[15px] pt-4 text-[#5b67f3]">
              <Briefcase className="h-5 w-5" />
              Find Jobs
            </button>
            <Link to="/careers" className="flex h-[64px] items-center gap-2 px-4 pb-[15px] pt-4 text-[#656565]">
              <Building2 className="h-5 w-5" />
              Companies
            </Link>
            <button className="flex h-[64px] items-center gap-2 px-4 pb-[15px] pt-4 text-[#656565]">
              <Globe className="h-5 w-5" />
              Salaries
            </button>
          </nav>

          <div className="flex items-center gap-6 pb-7">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-black/10 bg-[#e0e0e0]">
              <div className="flex h-full w-full items-center justify-center text-[12px] font-medium text-[#474747]">
                {candidate?.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <Bell className="h-6 w-6 text-[#474747]" />
          </div>
        </div>
      </header>

      <section className="border-b border-[#e8e8e8] px-4 py-[54px]">
        <div className="mx-auto flex max-w-[1040px] flex-col items-center gap-14">
          <div className="text-center">
            <h1 className="text-[44px] font-semibold leading-[44px] text-[#474747]">Find Your Next Opportunity</h1>
            <p className="mt-3 text-[16px] font-medium leading-[26px] text-[#656565]">
              Explore roles from verified companies using HRM8
            </p>
          </div>

          <div className="flex w-full items-center gap-5">
            <div className="flex h-12 flex-1 items-center gap-3 rounded-[8px] border-[1.5px] border-[#e5e7ea] bg-[#f9fafb] px-3">
              <Search className="h-5 w-5 text-[#b8b8b8]" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSearchQuery(searchInput.trim());
                    setCurrentPage(1);
                  }
                }}
                placeholder="Search by job, title, or keyword..."
                className="h-full flex-1 bg-transparent text-[14px] leading-[24px] text-[#474747] outline-none placeholder:text-[#b8b8b8]"
              />
            </div>
            <button
              onClick={() => {
                setSearchQuery(searchInput.trim());
                setCurrentPage(1);
              }}
              className="h-12 rounded-[12px] bg-[#4e61f6] px-8 text-[16px] font-medium leading-[26px] text-white"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => quickChipClick(chip)}
                className="h-10 rounded-[20px] border-[1.5px] border-[#e8e8e8] px-5 text-[14px] leading-[24px] text-[#656565]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-[1344px] gap-4 px-4 py-4">
        <aside className="w-[390px] shrink-0 rounded-[12px] border border-[#e8e8e8] bg-white p-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[20px] font-medium leading-[30px] text-[#474747]">Filters</h2>
            <button onClick={clearAllFilters} className="text-[14px] leading-[24px] text-[#4e61f6]">
              Clear All
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Location</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <div className="flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e8e8] px-3">
                <MapPin className="h-4 w-4 text-[#656565]" />
                <input
                  value={locationFilter}
                  onChange={(event) => {
                    setLocationFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Type a city..."
                  className="h-full flex-1 bg-transparent text-[14px] leading-[24px] text-[#474747] outline-none placeholder:text-[#b8b8b8]"
                />
              </div>
            </div>

            <div className="border-t border-[#e8e8e8] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Work Model</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <div className="space-y-3">
                {WORK_MODEL_OPTIONS.map((option) => {
                  const checked = selectedWorkModels.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                      onClick={() => {
                        toggleGroupValue(option.value, setSelectedWorkModels);
                        setCurrentPage(1);
                      }}
                    >
                      <span
                        className={cn(
                          'flex h-[16px] w-[16px] items-center justify-center rounded-full border border-[#4e61f6]',
                          checked ? 'bg-[#4e61f6]' : 'bg-white'
                        )}
                      >
                        {checked ? <CheckCircle2 className="h-[11px] w-[11px] text-white" /> : null}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#e8e8e8] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Employment Type</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <div className="space-y-3">
                {EMPLOYMENT_OPTIONS.map((option) => {
                  const checked = selectedEmploymentTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                      onClick={() => {
                        toggleGroupValue(option.value, setSelectedEmploymentTypes);
                        setCurrentPage(1);
                      }}
                    >
                      <span
                        className={cn(
                          'flex h-[16px] w-[16px] items-center justify-center rounded-full border border-[#4e61f6]',
                          checked ? 'bg-[#4e61f6]' : 'bg-white'
                        )}
                      >
                        {checked ? <CheckCircle2 className="h-[11px] w-[11px] text-white" /> : null}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#e8e8e8] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Salary Range</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <input
                type="range"
                min={0}
                max={200000}
                step={5000}
                value={salaryRange}
                onChange={(event) => {
                  setSalaryRange(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-2 w-full accent-[#7a5cff]"
              />
              <div className="mt-2 flex items-center justify-between text-[14px] leading-[24px] text-[#959595]">
                <span>$0</span>
                <span>$120k+</span>
                <span>$200k+</span>
              </div>
            </div>

            <div className="border-t border-[#e8e8e8] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Posted Date</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <div className="space-y-3">
                {([
                  { label: 'Last 24 hours', value: '24h' },
                  { label: 'Past Week', value: 'week' },
                  { label: 'Past Month', value: 'month' },
                ] as const).map((option) => {
                  const checked = postedDateFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                      onClick={() => {
                        setPostedDateFilter(option.value);
                        setCurrentPage(1);
                      }}
                    >
                      <span
                        className={cn(
                          'h-[16px] w-[16px] rounded-full border border-[#4e61f6]',
                          checked ? 'bg-[#4e61f6]' : 'bg-white'
                        )}
                      />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-[20px] font-medium leading-[30px] text-[#474747]">
              Showing {filteredJobs.length} jobs
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[16px] leading-[26px] text-[#656565]">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as SortValue);
                    setCurrentPage(1);
                  }}
                  className="h-10 appearance-none rounded-[8px] border border-[#e8e8e8] bg-white py-2 pl-3 pr-9 text-[14px] text-[#474747] outline-none"
                >
                  <option value="relevance">Relevance</option>
                  <option value="latest">Latest</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#656565]" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[291px] animate-pulse rounded-[12px] border border-[#e8e8e8] bg-white" />
              ))}
            </div>
          ) : paginatedJobs.length === 0 ? (
            <div className="rounded-[12px] border border-[#e8e8e8] bg-white p-8 text-center text-[#656565]">
              No jobs found for the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {paginatedJobs.map((job) => {
                const companyName = job.company?.name || 'Company';
                const companyMark = companyName.trim().charAt(0).toUpperCase();
                const isSaved = savedJobIds.has(job.id);
                const workArrangement = normalizeWorkArrangement(job);
                const employmentType = normalizeEmploymentType(job);
                const location = extractLocation(job);
                const summary = (job.jobSummary || job.job_summary || job.description || '').trim();

                return (
                  <article key={job.id} className="rounded-[12px] border border-[#e8e8e8] bg-white p-4">
                    <div className="flex flex-col gap-5">
                      <div className="space-y-3">
                        <div className="flex items-start gap-[10px]">
                          <div className="flex h-[43px] w-[43px] items-center justify-center rounded-[12px] border border-[#e8e8e8] bg-[#eef2ff] text-[16px] font-semibold text-[#4e61f6]">
                            {companyMark}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="truncate text-[18px] font-medium leading-[28px] text-[#474747]">{job.title}</h3>
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2 py-0.5 text-[12px] text-[#7faf51]">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                              </span>
                            </div>
                            <p className="truncate text-[16px] leading-[26px] text-[#656565]">
                              {companyName} • {location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-[15px]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8e8e8] px-2 py-0.5 text-[14px] leading-[24px] text-[#474747]">
                            <Globe className="h-4 w-4" />
                            {workArrangement === 'ON_SITE' ? 'On-site' : workArrangement === 'HYBRID' ? 'Hybrid' : 'Remote'}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8e8e8] px-2 py-0.5 text-[14px] leading-[24px] text-[#474747]">
                            <Briefcase className="h-4 w-4" />
                            {employmentType === 'PART_TIME' ? 'Part-Time' : employmentType === 'CONTRACT' ? 'Contract' : 'Full-Time'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[16px] font-medium leading-[26px] text-[#474747]">{salaryText(job)}</p>
                          <p className="inline-flex items-center gap-1 text-[14px] leading-[24px] text-[#959595]">
                            <Clock3 className="h-4 w-4" />
                            {postedText(job)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[#e8e8e8] pt-4">
                        <p className="line-clamp-2 text-[14px] leading-[24px] text-[#656565]">{summary}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="flex h-8 w-full items-center justify-center gap-2 rounded-[8px] bg-[#4e61f6] px-3 text-[12px] font-semibold leading-[16px] text-white"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void toggleSaveJob(job.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#b5b5b5] text-[#656565]"
                        >
                          <Bookmark className={cn('h-4 w-4', isSaved && 'fill-[#4e61f6] text-[#4e61f6]')} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#5b67f3] text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-[2px]">
              {Array.from({ length: Math.min(totalPages, 6) }).map((_, index) => {
                const pageNumber = index + 1;
                const active = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-[6px] border text-[14px]',
                      active ? 'border-[#5b67f3] bg-white text-black' : 'border-transparent bg-white text-[#98a2b3]'
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              {totalPages > 6 ? <span className="px-2 text-[#98a2b3]">...</span> : null}
            </div>

            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#5b67f3] text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
