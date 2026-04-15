import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  Globe,
  MapPin,
  Share2,
} from 'lucide-react';

import logoDark from '@/assets/logo-dark.png';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import { trackJobAnalytics } from '@/shared/services/analytics';
import { apiClient } from '@/shared/services/api';
import { jobService } from '@/shared/services/jobService';
import type { PublicJob } from '@/shared/services/jobService';

function formatEmploymentType(type?: string): string {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'FULL_TIME') return 'Full-Time';
  if (normalized === 'PART_TIME') return 'Part-Time';
  if (normalized === 'CONTRACT') return 'Contract';
  if (normalized === 'CASUAL') return 'Casual';
  return '';
}

function formatWorkArrangement(type?: string): string {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'REMOTE') return 'Remote';
  if (normalized === 'HYBRID') return 'Hybrid';
  if (normalized === 'ON_SITE') return 'On-site';
  return '';
}

function salaryText(job: PublicJob): string {
  const min = job.salaryMin ?? job.salary_min;
  const max = job.salaryMax ?? job.salary_max;
  const hidden = Boolean(job.hideSalary ?? job.hide_salary);

  if (hidden) return 'Competitive';
  if (!min && !max) return 'Salary not disclosed';

  const compact = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return String(Math.round(value));
  };

  if (min && max) return `$${compact(min)} - $${compact(max)}`;
  if (min) return `From $${compact(min)}`;
  return `Up to $${compact(max as number)}`;
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
  return [];
}

function toParagraphs(description: string): string[] {
  const value = (description || '').trim();
  if (!value) return [];
  const parts = value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [value];
}

function postedAgo(job: PublicJob): string {
  const value = job.postingDate || job.posting_date || job.createdAt || job.created_at;
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, candidate } = useCandidateAuth();

  const invitationToken = new URLSearchParams(location.search).get('invitation') ?? undefined;

  const [job, setJob] = useState<PublicJob | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<PublicJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(false);

  const hasTrackedView = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [jobResponse, relatedResponse] = await Promise.all([
          jobService.getPublicJobById(id, { invitation: invitationToken }),
          jobService.getRelatedJobs(id, 3),
        ]);

        const payload = jobResponse.data;
        const normalizedJob =
          payload && typeof payload === 'object' && 'job' in payload
            ? (payload as { job: PublicJob }).job
            : (payload as PublicJob | undefined);

        setJob(normalizedJob || null);

        if (relatedResponse.success && relatedResponse.data?.jobs) {
          setRelatedJobs(relatedResponse.data.jobs.filter((item) => item.id !== id).slice(0, 3));
        } else {
          setRelatedJobs([]);
        }

        if (normalizedJob && hasTrackedView.current !== id) {
          hasTrackedView.current = id;
          trackJobAnalytics(id, 'DETAIL_VIEW', isAuthenticated ? 'CANDIDATE_PORTAL' : 'HRM8_BOARD');
        }
      } catch (error) {
        console.error('Failed to load job detail:', error);
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, invitationToken, isAuthenticated]);

  useEffect(() => {
    if (!id || !isAuthenticated) {
      setIsSaved(false);
      return;
    }

    const checkSaved = async () => {
      setIsCheckingSaved(true);
      try {
        const response = await apiClient.get('/api/candidate/saved-jobs');
        if (response.success && response.data) {
          const savedJobs = Array.isArray(response.data) ? response.data : [];
          const savedJobIds = new Set(
            savedJobs
              .map((item: { job?: { id: string }; jobId?: string }) => item.job?.id || item.jobId)
              .filter(Boolean) as string[]
          );
          setIsSaved(savedJobIds.has(id));
        }
      } catch (error) {
        console.error('Failed to check saved job state:', error);
      } finally {
        setIsCheckingSaved(false);
      }
    };

    void checkSaved();
  }, [id, isAuthenticated]);

  const toggleSaveJob = async () => {
    if (!id) return;

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save jobs.',
      });
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }

    try {
      if (isSaved) {
        await apiClient.delete(`/api/candidate/saved-jobs/${id}`);
        setIsSaved(false);
      } else {
        await apiClient.post(`/api/candidate/saved-jobs/${id}`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to update saved state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update saved state. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleApplyNow = () => {
    if (!id) return;
    trackJobAnalytics(id, 'APPLY_CLICK', isAuthenticated ? 'CANDIDATE_PORTAL' : 'HRM8_BOARD');
    navigate(`/jobs/${id}/apply${location.search}`);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/jobs/${id ?? ''}${location.search}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: job?.title || 'Job opportunity',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copied', description: 'Job link copied to clipboard.' });
      }
    } catch {
      // user cancelled share; no toast needed
    }
  };

  const employmentType = formatEmploymentType(job?.employmentType || job?.employment_type);
  const workArrangement = formatWorkArrangement(job?.workArrangement || job?.work_arrangement);
  const salary = job ? salaryText(job) : 'Salary not disclosed';
  const relativePosted = job ? postedAgo(job) : 'Recently';

  const descriptionParagraphs = useMemo(() => {
    if (!job) return [];
    return toParagraphs(job.description);
  }, [job]);

  const responsibilities = useMemo(() => {
    return normalizeList(job?.responsibilities);
  }, [job]);

  const requirements = useMemo(() => {
    return normalizeList(job?.requirements);
  }, [job]);

  const mustHaves = requirements.slice(0, 4);
  const niceToHave = requirements.slice(4);

  const benefits = useMemo(() => {
    return normalizeList(job?.benefits).slice(0, 8);
  }, [job]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif] text-[#474747]">
        <div className="mx-auto flex min-h-screen max-w-[1276px] items-center justify-center px-4">
          <p className="text-[16px] leading-[26px] text-[#656565]">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif] text-[#474747]">
        <div className="mx-auto flex min-h-screen max-w-[1276px] flex-col items-center justify-center gap-4 px-4">
          <p className="text-[24px] font-semibold leading-[34px] text-[#191919]">Job not found</p>
          <button
            onClick={() => navigate('/jobs')}
            className="rounded-[12px] border border-[#b8b8b8] px-5 py-2 text-[14px] font-medium text-[#474747]"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const companyOpenPositions = Math.max(0, Number(job.company?.jobCount || 0));
  const companyName = (job.company?.name || '').trim();

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Poppins',sans-serif] text-[#474747]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-[1276px] items-center justify-between">
          <img src={logoDark} alt="HRM8" className="h-[28px] w-auto" />

          <nav className="flex h-full items-center gap-12 text-[16px]">
            <Link to="/jobs" className="inline-flex h-full items-center gap-2 border-b border-[#5b67f3] px-4 text-[#5b67f3]">
              <Briefcase className="h-5 w-5" />
              Find Jobs
            </Link>
            <Link to="/careers" className="inline-flex h-full items-center gap-2 px-4 text-[#656565]">
              <Building2 className="h-5 w-5" />
              Companies
            </Link>
            <button className="inline-flex h-full items-center gap-2 px-4 text-[#656565]" type="button">
              <Globe className="h-5 w-5" />
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

      <main className="mx-auto w-full max-w-[1276px] pb-20 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[14px] leading-[24px]">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center gap-2 rounded-[8px] px-2 py-1 text-[#959595]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </button>
            <span className="text-[#d6d6d6]">|</span>
            <span className="text-[#959595]">Jobs</span>
            <span className="text-[#b8b8b8]">›</span>
            {job.category ? (
              <>
                <span className="text-[#959595]">{job.category}</span>
                <span className="text-[#b8b8b8]">›</span>
              </>
            ) : null}
            <span className="text-[#191919]">{job.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-[#b8b8b8] px-4 text-[14px] font-semibold text-[#191919]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              type="button"
              onClick={toggleSaveJob}
              disabled={isCheckingSaved}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-[#b8b8b8] px-4 text-[14px] font-semibold text-[#191919]"
            >
              <Bookmark className={cn('h-4 w-4', isSaved ? 'fill-[#191919]' : '')} />
              Save
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[772px_473px] xl:items-start">
          <section className="space-y-8">
            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="space-y-8 border-b border-[#e8e8e8] pb-8">
                <div>
                  {job.category ? (
                    <span className="inline-flex rounded-full bg-[#eef2ff] px-3 py-1 text-[10px] font-medium text-[#4e61f6]">
                      {job.category}
                    </span>
                  ) : null}
                  <h1 className="mt-4 text-[40px] font-semibold leading-[44px] text-[#191919]">{job.title}</h1>

                  <div className="mt-4 flex items-center gap-3">
                    {job.company?.logoUrl ? (
                      <img src={job.company.logoUrl} alt={job.company.name} className="h-8 w-8 rounded-[8px] object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#ffecee] text-[12px] font-semibold text-[#ef6b6b]">
                        {(job.company?.name || 'H').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-[16px] leading-[26px] text-[#656565]">{companyName || '—'}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-5 text-[14px] leading-[24px] text-[#656565]">
                    {job.location ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {job.location}{workArrangement ? ` (${workArrangement})` : ''}
                      </span>
                    ) : null}
                    {employmentType ? (
                      <span className="inline-flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {employmentType}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-current" />
                      {salary}
                    </span>
                  </div>

                  <p className="mt-3 text-[14px] leading-[24px] text-[#959595]">{relativePosted}</p>
                </div>
              </div>

              <div className="space-y-10 pt-8">
                <section>
                  <h2 className="text-[26px] font-medium leading-[36px] text-[#191919]">About the Role</h2>
                  <div className="mt-4 space-y-5 text-[16px] leading-[28px] text-[#656565]">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p key={`description-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-[26px] font-medium leading-[36px] text-[#191919]">What You&apos;ll Do</h2>
                  {responsibilities.length > 0 ? (
                    <ul className="mt-4 space-y-4 text-[16px] leading-[28px] text-[#656565]">
                      {responsibilities.map((item, index) => (
                        <li key={`responsibility-${index}`} className="flex gap-3">
                          <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#656565]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-[16px] leading-[28px] text-[#959595]">No responsibilities listed.</p>
                  )}
                </section>

                <section>
                  <h2 className="text-[26px] font-medium leading-[36px] text-[#191919]">What We&apos;re Looking For</h2>

                  {mustHaves.length > 0 ? (
                    <>
                      <p className="mt-4 text-[12px] uppercase tracking-[0.08em] text-[#b8b8b8]">Must-haves</p>
                      <ul className="mt-3 space-y-3">
                        {mustHaves.map((item, index) => (
                          <li key={`must-${index}`} className="flex items-start gap-3 text-[16px] leading-[26px] text-[#656565]">
                            <CheckCircle2 className="mt-[2px] h-5 w-5 shrink-0 text-[#5b67f3]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {niceToHave.length > 0 ? (
                    <>
                      <p className="mt-6 text-[12px] uppercase tracking-[0.08em] text-[#b8b8b8]">Nice-to-have</p>
                      <ul className="mt-3 space-y-3">
                        {niceToHave.map((item, index) => (
                          <li key={`nice-${index}`} className="flex items-start gap-3 text-[16px] leading-[26px] text-[#656565]">
                            <CheckCircle2 className="mt-[2px] h-5 w-5 shrink-0 text-[#5b67f3]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {requirements.length === 0 ? (
                    <p className="mt-4 text-[16px] leading-[28px] text-[#959595]">No requirements listed.</p>
                  ) : null}
                </section>
              </div>
            </article>

            <article className="w-full rounded-[12px] border border-[#e8e8e8] bg-white p-5 xl:w-[473px]">
              <h3 className="text-[18px] font-medium leading-[28px] text-[#191919]">Benefits &amp; Perks</h3>
              {benefits.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {benefits.map((item, index) => (
                    <span
                      key={`benefit-${index}`}
                      className="inline-flex items-center rounded-full border border-[#e9eaeb] bg-[#fafafa] px-3 py-[2px] text-[12px] font-medium leading-[18px] text-[#414651]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[14px] leading-[24px] text-[#959595]">No benefits listed.</p>
              )}
            </article>
          </section>

          <aside className="space-y-8">
            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <button
                type="button"
                onClick={handleApplyNow}
                className="h-12 w-full rounded-[12px] bg-[#4e61f6] text-[18px] font-medium leading-[28px] text-white"
              >
                Apply Now
              </button>
              <p className="mt-3 text-center text-[14px] leading-[24px] text-[#959595]">No account needed</p>

              <div className="my-5 h-px w-full bg-[#e8e8e8]" />

              <button
                type="button"
                onClick={toggleSaveJob}
                disabled={isCheckingSaved}
                className="inline-flex w-full items-center justify-center gap-2 text-[14px] leading-[24px] text-[#474747]"
              >
                <Bookmark className={cn('h-4 w-4', isSaved ? 'fill-[#191919]' : '')} />
                Save for later
              </button>
            </article>

            <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
              <div className="flex items-center gap-4">
                {job.company?.logoUrl ? (
                  <img src={job.company.logoUrl} alt={job.company.name} className="h-14 w-14 rounded-[12px] object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#ffecee] text-[18px] font-semibold text-[#ef6b6b]">
                    {(job.company?.name || 'H').charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-[16px] font-medium leading-[26px] text-[#656565]">{companyName || '—'}</p>
                  {job.category ? (
                    <span className="inline-flex rounded-full border border-[#e9eaeb] bg-[#fafafa] px-2 py-[2px] text-[12px] font-medium leading-[18px] text-[#414651]">
                      {job.category}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {job.company?.verificationStatus === 'VERIFIED' ? (
                  <p className="inline-flex items-center gap-2 text-[14px] leading-[24px] text-[#959595]">
                    <CheckCircle2 className="h-4 w-4 text-[#2196f3]" />
                    Verified employer
                  </p>
                ) : null}
                {companyOpenPositions > 0 ? (
                  <>
                    <p className="inline-flex items-center gap-2 text-[14px] leading-[24px] text-[#959595]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00c465]" />
                      Actively hiring
                    </p>
                    <p className="text-[12px] font-medium leading-[16px] text-[#4e61f6]">{companyOpenPositions} open positions</p>
                  </>
                ) : null}
              </div>

              <div className="my-5 h-px w-full bg-[#e8e8e8]" />

              <button
                type="button"
                onClick={() => navigate(`/companies/${job.company?.id || ''}`)}
                className="h-10 w-full rounded-[12px] border-[1.5px] border-[#b5b5b5] text-[14px] font-medium leading-[26px] text-[#474747]"
              >
                View Company Profile
              </button>
            </article>

            {relatedJobs.length > 0 ? (
              <article className="rounded-[12px] border border-[#e8e8e8] bg-white p-5">
                <h3 className="text-[18px] font-medium leading-[28px] text-[#474747]">Similar Roles</h3>

                <div className="mt-5 space-y-5">
                  {relatedJobs.map((item, index, list) => (
                    <div key={`${item.id}-${index}`}>
                      <Link to={`/jobs/${item.id}`} className="block">
                        <p className="text-[16px] leading-[26px] text-[#474747]">{item.title}</p>
                        <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">
                          {item.company?.name || '—'}{item.location ? ` • ${item.location}` : ''}
                        </p>
                        <p className="mt-1 text-[14px] leading-[24px] text-[#656565]">{salaryText(item)}</p>
                      </Link>
                      {index < list.length - 1 ? <div className="mt-5 h-px w-full bg-[#e8e8e8]" /> : null}
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => navigate('/jobs')} className="mt-6 w-full text-[18px] font-medium leading-[28px] text-[#4e61f6]">
                  See More Jobs
                </button>
              </article>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
