/**
 * Candidate Job Search Page
 * Compact ATS-style job search with advanced filtering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { jobService } from '@/shared/services/jobService'; import type { PublicJob, JobFilterOptions } from '@/shared/services/jobService';
import { applicationService } from '@/shared/services/applicationService';
import { apiClient } from '@/shared/services/api';
import { useToast } from '@/shared/hooks/use-toast';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Search,
  Heart,
  X,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  TrendingUp,
  SlidersHorizontal,
  Loader2,
  Users,
  Globe,
  Monitor,
  GraduationCap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';

/* ── helpers ── */

function getEmploymentTypeVariant(type: string) {
  const normalized = type?.toLowerCase().replace(/_/g, '-');
  const map: Record<string, 'default' | 'purple' | 'orange' | 'teal'> = {
    'full-time': 'default',
    'full_time': 'default',
    'part-time': 'purple',
    'part_time': 'purple',
    'contract': 'orange',
    'casual': 'teal',
  };
  return map[normalized] || map[type] || 'neutral' as const;
}

function formatEmploymentType(type: string) {
  const map: Record<string, string> = {
    'FULL_TIME': 'Full-time', 'full-time': 'Full-time', 'full_time': 'Full-time',
    'PART_TIME': 'Part-time', 'part-time': 'Part-time', 'part_time': 'Part-time',
    'CONTRACT': 'Contract', 'contract': 'Contract',
    'CASUAL': 'Casual', 'casual': 'Casual',
  };
  return map[type] || type?.replace(/_/g, ' ') || 'N/A';
}

function formatWorkArrangement(type: string) {
  const map: Record<string, string> = {
    'ON_SITE': 'On-site', 'on-site': 'On-site', 'on_site': 'On-site',
    'REMOTE': 'Remote', 'remote': 'Remote',
    'HYBRID': 'Hybrid', 'hybrid': 'Hybrid',
  };
  return map[type] || type?.replace(/_/g, ' ') || 'N/A';
}

function getWorkArrangementIcon(type: string) {
  const normalized = type?.toUpperCase();
  if (normalized === 'REMOTE') return Globe;
  if (normalized === 'HYBRID') return Monitor;
  return MapPin;
}

function formatExperienceLevel(level?: string) {
  if (!level) return null;
  const map: Record<string, string> = {
    'entry': 'Entry Level', 'mid': 'Mid Level', 'senior': 'Senior', 'executive': 'Executive',
  };
  return map[level.toLowerCase()] || level;
}

function formatSalary(job: PublicJob) {
  const min = job.salaryMin ?? job.salary_min;
  const max = job.salaryMax ?? job.salary_max;
  const currency = job.salaryCurrency || job.salary_currency || 'USD';
  const description = job.salaryDescription || job.salary_description;
  const period = job.salaryPeriod || job.salary_period;
  const hidden = job.hideSalary ?? job.hide_salary;

  if (hidden) return 'Competitive';
  if (!min && !max) return description || 'Salary not disclosed';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  let range = '';
  if (min && max) range = `${formatter.format(min)} – ${formatter.format(max)}`;
  else if (min) range = `From ${formatter.format(min)}`;
  else if (max) range = `Up to ${formatter.format(max)}`;

  if (period) {
    const periodMap: Record<string, string> = {
      'hourly': '/hr', 'daily': '/day', 'weekly': '/wk', 'monthly': '/mo', 'annual': '/yr',
    };
    range += ` ${periodMap[period] || ''}`;
  }
  return range;
}

/* ── component ── */

export default function JobSearchPage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<JobFilterOptions>({
    categories: [],
    departments: [],
    locations: [],
    companies: [],
    tags: [],
  });
  const [totalJobs, setTotalJobs] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [workArrangement, setWorkArrangement] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const navigate = useNavigate();
  const locationState = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useCandidateAuth();

  // Saved Jobs State (to show filled heart)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Applied Jobs State (to filter out jobs already applied to)
  const appliedJobIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (locationState.state) {
      const { filters } = locationState.state as { filters: Record<string, unknown> };
      if (filters) {
        if (filters.search && typeof filters.search === 'string') setSearchQuery(filters.search);
        if (filters.location && typeof filters.location === 'string') setLocation(filters.location);
        if (filters.employmentType && typeof filters.employmentType === 'string') setEmploymentType(filters.employmentType);
        if (filters.workArrangement && typeof filters.workArrangement === 'string') setWorkArrangement(filters.workArrangement);
        if (filters.category && typeof filters.category === 'string') setCategory(filters.category);
        if (filters.department && typeof filters.department === 'string') setDepartment(filters.department);
        if (filters.salaryMin) setSalaryMin(String(filters.salaryMin));
        if (filters.salaryMax) setSalaryMax(String(filters.salaryMax));
        if (filters.featured && typeof filters.featured === 'boolean') setFeaturedOnly(filters.featured);

        if (filters.category || filters.department || filters.salaryMin || filters.salaryMax || filters.featured) {
          setShowAdvancedFilters(true);
        }
      }
    }
    if (isAuthenticated) {
      fetchSavedJobs();
      fetchAppliedJobs();
    }
  }, [locationState.state, isAuthenticated]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAppliedJobs().then(() => {
          loadJobs();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedJobs = async () => {
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
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('[JobSearchPage] Failed to fetch saved jobs:', error);
      }
      setSavedJobIds(new Set());
    }
  };

  const fetchAppliedJobs = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await applicationService.getCandidateApplications();
      if (response.success && response.data?.applications) {
        const appliedIds = new Set(
          response.data.applications.map((app: { jobId?: string }) => app.jobId).filter((id): id is string => !!id)
        );
        appliedJobIdsRef.current = appliedIds;
      }
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('Failed to fetch applied jobs:', error);
      }
    }
  };

  const trackSearch = useCallback(async (filters: Record<string, unknown>) => {
    if (!isAuthenticated) return;

    const hasFilters = Object.values(filters).some(val => val !== undefined && val !== '');
    if (!hasFilters) return;

    try {
      await apiClient.post('/api/candidate/saved-searches', {
        query: searchQuery || undefined,
        filters,
      });
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('Failed to track search:', error);
      }
    }
  }, [searchQuery, isAuthenticated]);

  const toggleSaveJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save jobs",
        variant: "default",
      });
      navigate('/login', { state: { from: '/jobs' } });
      return;
    }

    const isSaved = savedJobIds.has(jobId);

    try {
      if (isSaved) {
        const response = await apiClient.delete(`/api/candidate/saved-jobs/${jobId}`);
        if (response.success) {
          setSavedJobIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          toast({
            title: "Job Removed",
            description: "Job removed from your saved jobs.",
          });
        } else {
          throw new Error(response.error || 'Failed to remove job');
        }
      } else {
        const response = await apiClient.post(`/api/candidate/saved-jobs/${jobId}`);
        if (response.success && response.data) {
          const savedJobs = Array.isArray(response.data) ? response.data : [];
          const ids = new Set(savedJobs.map((item: any) => item.job?.id || item.id).filter((id: any): id is string => !!id));
          setSavedJobIds(ids);
          toast({
            title: "Job Saved",
            description: "Job added to your saved jobs.",
          });
        } else {
          throw new Error(response.error || 'Failed to save job');
        }
      }
    } catch (error: any) {
      console.error('Failed to toggle save job:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to update saved job status.",
        variant: "destructive",
      });
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await jobService.getFilterOptions();
      const options = response.data?.data || response.data;
      setFilterOptions(options as JobFilterOptions || { categories: [], departments: [], locations: [], companies: [], tags: [] });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const JOBS_PER_PAGE = 20;

  const loadJobs = useCallback(async (page: number = 1, append: boolean = false) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * JOBS_PER_PAGE;
      const response = await jobService.getPublicJobs({
        search: searchQuery || undefined,
        location: location || undefined,
        employmentType: employmentType || undefined,
        workArrangement: workArrangement || undefined,
        category: category || undefined,
        department: department || undefined,
        companyId: companyId || undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        salaryMin: salaryMin ? parseFloat(salaryMin) : undefined,
        salaryMax: salaryMax ? parseFloat(salaryMax) : undefined,
        featured: featuredOnly || undefined,
        limit: JOBS_PER_PAGE,
        offset: offset,
      });

      if (page === 1) {
        const currentFilters = {
          search: searchQuery || undefined,
          location: location || undefined,
          employmentType: employmentType || undefined,
          workArrangement: workArrangement || undefined,
          category: category || undefined,
          department: department || undefined,
          salaryMin: salaryMin ? parseFloat(salaryMin) : undefined,
          salaryMax: salaryMax ? parseFloat(salaryMax) : undefined,
          featured: featuredOnly || undefined,
        };
        trackSearch(currentFilters);
      }

      const allJobs = response.data?.jobs || [];
      const filteredJobs = allJobs.filter((job: PublicJob) => !appliedJobIdsRef.current.has(job.id));

      if (append) {
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newJobs = filteredJobs.filter((job: PublicJob) => !existingIds.has(job.id));
          return [...prev, ...newJobs];
        });
      } else {
        setJobs(filteredJobs);
      }

      setTotalJobs(response.data?.total || 0);
      setCurrentPage(page);

      const totalAvailable = response.data?.total || 0;
      setHasMore(offset + allJobs.length < totalAvailable);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, employmentType, workArrangement, category, department, companyId, selectedTags, salaryMin, salaryMax, featuredOnly, trackSearch]);

  useEffect(() => {
    if (isInitializedRef.current) return;

    const initialize = async () => {
      try {
        await loadFilterOptions();
        if (isAuthenticated) {
          await fetchAppliedJobs();
        }
        isInitializedRef.current = true;
        await loadJobs();
      } catch (error) {
        console.error('Failed to initialize job search page:', error);
        isInitializedRef.current = true;
        await loadJobs();
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, location, employmentType, workArrangement, category, department, salaryMin, salaryMax, featuredOnly]);

  const handleSearch = () => {
    loadJobs();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setEmploymentType('');
    setWorkArrangement('');
    setCategory('');
    setDepartment('');
    setCompanyId('');
    setSelectedTags([]);
    setSalaryMin('');
    setSalaryMax('');
    setFeaturedOnly(false);
  };

  const hasActiveFilters = () => {
    return !!(
      searchQuery ||
      location ||
      employmentType ||
      workArrangement ||
      category ||
      department ||
      companyId ||
      selectedTags.length > 0 ||
      salaryMin ||
      salaryMax ||
      featuredOnly
    );
  };

  const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

  return (
    <Layout showSidebarTrigger={false} showSearch={false}>
      <div className="bg-background">
        {/* Page Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-lg font-bold">Find Your Next Job</h1>
                <p className="text-muted-foreground mt-1">
                  {totalJobs > 0 ? `${totalJobs} opportunities available` : 'Search for your dream job'}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/careers">
                  <Building2 className="h-4 w-4 mr-2" />
                  Browse Companies
                </Link>
              </Button>
            </div>

            {/* Main Search Bar */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs by title, keywords, company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} size="default">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select value={location || undefined} onValueChange={(val) => setLocation(val === 'all' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {filterOptions.locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={employmentType || undefined} onValueChange={(val) => setEmploymentType(val === 'all' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="CASUAL">Casual</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={workArrangement || undefined} onValueChange={(val) => setWorkArrangement(val === 'all' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Work Arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Arrangements</SelectItem>
                    <SelectItem value="ON_SITE">On Site</SelectItem>
                    <SelectItem value="REMOTE">Remote</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={showAdvancedFilters ? 'default' : 'outline'}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex-1"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                  {hasActiveFilters() && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {hasActiveFilters() && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground">
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="pt-4 border-t space-y-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category || undefined} onValueChange={(val) => setCategory(val === 'all' ? '' : val)}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {filterOptions.categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={department || undefined} onValueChange={(val) => setDepartment(val === 'all' ? '' : val)}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {filterOptions.departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Select value={companyId || undefined} onValueChange={(val) => setCompanyId(val === 'all' ? '' : val)}>
                        <SelectTrigger id="company">
                          <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          {filterOptions.companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {filterOptions.tags?.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No tags available</span>
                        ) : (
                          filterOptions.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                              className="cursor-pointer transition-colors"
                              onClick={() => {
                                if (selectedTags.includes(tag)) {
                                  setSelectedTags(selectedTags.filter((t) => t !== tag));
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                            >
                              {tag}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Featured Jobs Only</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="featured"
                          checked={featuredOnly}
                          onCheckedChange={(checked) => setFeaturedOnly(checked === true)}
                        />
                        <Label htmlFor="featured" className="font-normal cursor-pointer">
                          Show only featured jobs
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Minimum Salary</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        placeholder="e.g., 50000"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Maximum Salary</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        placeholder="e.g., 100000"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="container mx-auto px-4 py-6">
          {isLoading && jobs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-3xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters()
                  ? 'Try adjusting your filters to see more results.'
                  : 'No job postings available at the moment.'}
              </p>
              {hasActiveFilters() && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const empType = job.employmentType || job.employment_type || '';
                const workArr = job.workArrangement || job.work_arrangement || '';
                const jobCode = job.jobCode || job.job_code;
                const expLevel = job.experienceLevel || job.experience_level;
                const vacancies = job.numberOfVacancies || job.number_of_vacancies || 1;
                const postedAt = job.postingDate || job.posting_date || job.createdAt || job.created_at;
                const tags = job.promotionalTags || job.promotional_tags || [];
                const locationCity = job.jobLocation?.city;
                const locationCountry = job.jobLocation?.country;
                const WorkArrangementIcon = getWorkArrangementIcon(workArr);

                return (
                  <Card
                    key={job.id}
                    className={cn(
                      "overflow-hidden rounded-3xl border-border/70 bg-background shadow-none transition-all hover:border-primary/30 hover:bg-muted/[0.02] cursor-pointer",
                      job.featured && "border-primary/20 bg-primary/[0.02]"
                    )}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-4 md:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left content */}
                        <div className="min-w-0 flex-1 space-y-3">
                          {/* Title row */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  to={`/jobs/${job.id}`}
                                  className="truncate text-base font-semibold tracking-tight text-foreground hover:text-primary transition-colors md:text-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {job.title}
                                </Link>
                                {jobCode && (
                                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                    {jobCode}
                                  </span>
                                )}
                                {job.featured && (
                                  <Badge variant="default" className="shrink-0 text-[10px] px-2 py-0.5">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>

                              {/* Subtitle row - company, location, type, arrangement */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span className="font-medium text-foreground/80">{job.company.name}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {job.location}
                                  {locationCity && locationCountry && job.location !== `${locationCity}, ${locationCountry}` && (
                                    <span className="text-muted-foreground/60">({locationCity})</span>
                                  )}
                                </span>
                                {job.department && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    {job.department}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {postedAt
                                    ? formatDistanceToNow(new Date(postedAt), { addSuffix: true })
                                    : 'Recently'}
                                </span>
                              </div>
                            </div>

                            {/* Save button */}
                            {isAuthenticated && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "shrink-0 h-8 w-8 text-muted-foreground hover:text-primary",
                                  savedJobIds.has(job.id) && "text-red-500 hover:text-red-600"
                                )}
                                onClick={(e) => toggleSaveJob(e, job.id)}
                                title={savedJobIds.has(job.id) ? "Remove from saved jobs" : "Save job"}
                              >
                                <Heart className={cn(
                                  "h-4 w-4 transition-all",
                                  savedJobIds.has(job.id) ? "fill-current text-red-500" : ""
                                )} />
                              </Button>
                            )}
                          </div>

                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1.5">
                            <Badge
                              variant={getEmploymentTypeVariant(empType) as any}
                              className="rounded-full text-[10px] px-2.5 py-0.5"
                            >
                              {formatEmploymentType(empType)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full text-[10px] px-2.5 py-0.5",
                                workArr.toUpperCase() === 'REMOTE' && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
                                workArr.toUpperCase() === 'HYBRID' && "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
                              )}
                            >
                              <WorkArrangementIcon className="h-3 w-3 mr-1" />
                              {formatWorkArrangement(workArr)}
                            </Badge>
                            {expLevel && (
                              <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5 border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                {formatExperienceLevel(expLevel)}
                              </Badge>
                            )}
                            {job.category && (
                              <Badge variant="secondary" className="rounded-full text-[10px] px-2.5 py-0.5">
                                {job.category}
                              </Badge>
                            )}
                            {vacancies > 1 && (
                              <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5">
                                <Users className="h-3 w-3 mr-1" />
                                {vacancies} openings
                              </Badge>
                            )}
                          </div>

                          {/* Salary + summary row */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                {formatSalary(job)}
                              </span>
                              {tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="rounded-full border border-dashed border-border/70 px-2.5 py-0.5 text-[10px] text-muted-foreground">
                                      {tag}
                                    </span>
                                  ))}
                                  {tags.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground py-0.5">+{tags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/jobs/${job.id}`);
                              }}
                              size="sm"
                              variant="outline"
                              className="shrink-0 rounded-xl h-9 px-4 text-sm"
                            >
                              View Details
                            </Button>
                          </div>

                          {/* Summary text */}
                          {(job.jobSummary || job.job_summary || job.description) && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {job.jobSummary || job.job_summary || (job.description || '').substring(0, 200)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {hasMore && (
                <div className="flex justify-center mt-8 pb-4">
                  <Button
                    variant="outline"
                    onClick={() => loadJobs(currentPage + 1, true)}
                    disabled={isLoading}
                    className="min-w-[200px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      'Load More Jobs'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
