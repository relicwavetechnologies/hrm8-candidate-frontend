/**
 * Candidate Job Search Page
 * Comprehensive job search with advanced filtering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { jobService } from '@/shared/services/jobService'; import type { PublicJob, JobFilterOptions } from '@/shared/services/jobService';
import { applicationService } from '@/shared/services/applicationService';
import { apiClient } from '@/shared/services/api';
import { useToast } from '@/shared/hooks/use-toast';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
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
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';

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

        // If there are advanced filters, show them
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

  // Refresh applied jobs when page becomes visible (user returns from applying)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAppliedJobs().then(() => {
          // Reload jobs after fetching applied jobs to apply filter
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
      console.log('[JobSearchPage] Saved jobs response:', response);
      if (response.success && response.data) {
        // Backend returns { success: true, data: [{ id, job: { id, ... } }] }
        const jobs = Array.isArray(response.data) ? response.data : [];
        const ids = new Set(
          jobs
            .map((item: { job?: { id: string }; jobId?: string }) => item.job?.id || item.jobId)
            .filter(Boolean) as string[]
        );
        console.log('[JobSearchPage] Saved job IDs:', Array.from(ids));
        setSavedJobIds(ids);
      } else {
        setSavedJobIds(new Set());
      }
    } catch (error: any) {
      // Silently fail for unauthenticated users (401/403 errors are expected)
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('[JobSearchPage] Failed to fetch saved jobs:', error);
      }
      setSavedJobIds(new Set());
    }
  };

  const fetchAppliedJobs = async () => {
    if (!isAuthenticated) return;

    try {
      // Only fetch if user is authenticated
      const response = await applicationService.getCandidateApplications();
      if (response.success && response.data?.applications) {
        const appliedIds = new Set(
          response.data.applications.map((app: { jobId?: string }) => app.jobId).filter((id): id is string => !!id) // Ensure ids are filtered for strings only
        );
        console.log('JobSearchPage - Applied job IDs:', Array.from(appliedIds));

      }
    } catch (error: any) {
      // Silently fail for unauthenticated users (401/403 errors are expected)
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('Failed to fetch applied jobs:', error);
      }
    }
  };

  const trackSearch = useCallback(async (filters: Record<string, unknown>) => {
    // Only track if user is authenticated and there's at least one filter or search query
    if (!isAuthenticated) return;

    const hasFilters = Object.values(filters).some(val => val !== undefined && val !== '');
    if (!hasFilters) return;

    try {
      await apiClient.post('/api/candidate/saved-searches', {
        query: searchQuery || undefined,
        filters,
      });
    } catch (error: any) {
      // Silently fail for unauthenticated users (401/403 errors are expected)
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('Failed to track search:', error);
      }
    }
  }, [searchQuery, isAuthenticated]);

  const toggleSaveJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();

    // For unauthenticated users, prompt them to sign in
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save jobs",
        variant: "default",
      });
      navigate('/candidate/login', { state: { from: '/jobs' } });
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
      // API returns { success: true, data: { data: { categories, departments, locations, companies, tags } } }
      // apiClient unwraps once, so we get { data: { categories... } }
      const options = response.data?.data || response.data;
      setFilterOptions(options as JobFilterOptions || { categories: [], departments: [], locations: [], companies: [], tags: [] });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
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
        limit: 50,
        offset: 0,
      });

      // Track search automatically
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

      // Don't await tracking to avoid blocking UI
      trackSearch(currentFilters);

      // Filter out jobs that the candidate has already applied to
      const allJobs = response.data?.jobs || [];
      const filteredJobs = allJobs.filter((job: PublicJob) => !appliedJobIdsRef.current.has(job.id));

      console.log('JobSearchPage - Filtering jobs:', {
        totalJobs: allJobs.length,
        appliedJobIds: Array.from(appliedJobIdsRef.current),
        filteredJobs: filteredJobs.length,
      });

      setJobs(filteredJobs);
      // Update total to reflect filtered count
      setTotalJobs(filteredJobs.length);
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
        // Load jobs after fetching applied jobs
        isInitializedRef.current = true;
        await loadJobs();
      } catch (error) {
        console.error('Failed to initialize job search page:', error);
        // Still try to load jobs even if filter options or applied jobs fail
        isInitializedRef.current = true;
        await loadJobs();
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load jobs when filters change (debounced) - but not when appliedJobIds changes
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

  const formatSalary = (job: PublicJob) => {
    if (!job.salaryMin && !job.salaryMax) {
      return job.salaryDescription || 'Salary not specified';
    }
    const min = job.salaryMin?.toLocaleString();
    const max = job.salaryMax?.toLocaleString();
    return `${job.salaryCurrency} ${min}${max ? ` - ${max}` : '+'}`;
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
                <h1 className="text-3xl font-bold">Find Your Next Job</h1>
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
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className={cn(
                    'hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4',
                    job.featured && 'border-l-primary bg-primary/5'
                  )}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2 flex items-center gap-2">
                              <Link
                                to={`/jobs/${job.id}`}
                                className="hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {job.title}
                              </Link>
                              {job.featured && (
                                <Badge variant="default" className="ml-2">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 flex-wrap text-sm">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{job.company.name}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {job.location}
                              </span>
                              {job.department && (
                                <span className="flex items-center gap-1.5">
                                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                                  {job.department}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {job.postingDate
                                  ? formatDistanceToNow(new Date(job.postingDate), { addSuffix: true })
                                  : 'Recently'}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "text-muted-foreground hover:text-primary",
                            savedJobIds.has(job.id) && "text-red-500 hover:text-red-600"
                          )}
                          onClick={(e) => toggleSaveJob(e, job.id)}
                          title={savedJobIds.has(job.id) ? "Remove from saved jobs" : "Save job"}
                        >
                          <Heart className={cn(
                            "h-5 w-5 transition-all",
                            savedJobIds.has(job.id) ? "fill-current text-red-500" : "text-muted-foreground"
                          )} />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {job.jobSummary || (job.description || '').substring(0, 200)}...
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-1.5 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatSalary(job)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(job.employmentType || '').replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(job.workArrangement || '').replace('_', ' ')}
                        </Badge>
                        {job.category && (
                          <Badge variant="secondary" className="text-xs">
                            {job.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job.id}`);
                        }}
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                    {job.promotionalTags && job.promotionalTags.length > 0 && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {job.promotionalTags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}