/**
 * Saved Jobs Page
 * Manage saved jobs, saved searches, and job alerts
 */

import { useState, useEffect, useMemo } from 'react';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient } from '@/shared/services/api';
import { jobService } from '@/shared/services/jobService';
import type { JobFilterOptions } from '@/shared/services/jobService';
import { Bookmark, Search, Bell, Trash2, MapPin, Briefcase, Clock, Mail, Plus, X, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Separator } from '@/shared/components/ui/separator';

interface SavedJob {
  id: string;
  job: {
    id: string;
    title: string;
    company: { id: string; name: string; logo?: string };
    location: string;
    employmentType: string;
    workArrangement: string;
    category?: string;
    department?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency: string;
    postingDate?: string;
    description: string;
  };
  createdAt: string;
}

interface SavedSearch {
  id: string;
  query?: string;
  filters: any;
  lastSearchedAt: string;
}

interface JobAlert {
  id: string;
  name: string;
  criteria: any;
  frequency: 'DAILY' | 'WEEKLY' | 'INSTANT';
  channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  isActive: boolean;
  createdAt: string;
}

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('saved-jobs');
  const [isLoading, setIsLoading] = useState(true);

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [filterOptions, setFilterOptions] = useState<JobFilterOptions>({
    categories: [],
    departments: [],
    locations: [],
    companies: [],
    tags: [],
  });

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [workArrangement, setWorkArrangement] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Alert Dialog State
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<JobAlert>>({
    frequency: 'DAILY',
    channels: ['EMAIL'],
    isActive: true,
    criteria: {}
  });

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSavedJobs(),
        fetchSavedSearches(),
        fetchJobAlerts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await jobService.getFilterOptions();
      setFilterOptions(response.data?.data || { categories: [], departments: [], locations: [], companies: [], tags: [] });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await apiClient.get<SavedJob[]>('/api/candidate/saved-jobs');
      console.log('Saved jobs response:', response);
      if (response.success) {
        // Backend returns { success: true, data: jobs[] }
        // API client returns { success: true, data: jobs[] }
        const jobs = Array.isArray(response.data) ? response.data : [];
        console.log('Parsed saved jobs:', jobs, 'Count:', jobs.length);
        setSavedJobs(jobs);
      } else {
        console.warn('Failed to fetch saved jobs:', response.error);
        setSavedJobs([]);
      }
    } catch (error) {
      console.error('Failed to fetch saved jobs', error);
      toast({ title: 'Failed to load saved jobs', variant: 'destructive' });
      setSavedJobs([]);
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const response = await apiClient.get<SavedSearch[]>('/api/candidate/saved-searches');
      console.log('Saved searches response:', response);
      if (response.success) {
        // Backend returns { success: true, data: searches[] }
        // API client returns { success: true, data: searches[] }
        const searches = Array.isArray(response.data) ? response.data : [];
        console.log('Parsed saved searches:', searches, 'Count:', searches.length);
        setSavedSearches(searches);
      } else {
        console.warn('Failed to fetch saved searches:', response.error);
        setSavedSearches([]);
      }
    } catch (error) {
      console.error('Failed to fetch saved searches', error);
      setSavedSearches([]);
    }
  };

  const fetchJobAlerts = async () => {
    try {
      const response = await apiClient.get<JobAlert[]>('/api/candidate/job-alerts');
      console.log('Job alerts response:', response);
      if (response.success) {
        // Backend returns { success: true, data: alerts[] }
        // API client returns { success: true, data: alerts[] }
        const alerts = Array.isArray(response.data) ? response.data : [];
        console.log('Parsed job alerts:', alerts, 'Count:', alerts.length);
        setJobAlerts(alerts);
      } else {
        console.warn('Failed to fetch job alerts:', response.error);
        setJobAlerts([]);
      }
    } catch (error) {
      console.error('Failed to fetch job alerts', error);
      setJobAlerts([]);
    }
  };

  // Filter saved jobs based on search and filters
  const filteredSavedJobs = useMemo(() => {
    return savedJobs.filter((item) => {
      const job = item.job;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.name.toLowerCase().includes(query);
        const matchesLocation = job.location.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesLocation) return false;
      }

      // Location filter
      if (location && job.location !== location) return false;

      // Employment type filter
      if (employmentType && job.employmentType !== employmentType) return false;

      // Work arrangement filter
      if (workArrangement && job.workArrangement !== workArrangement) return false;

      // Category filter (if available in job data)
      if (category && job.category !== category) return false;

      // Department filter (if available in job data)
      if (department && job.department !== department) return false;

      // Salary filters
      if (salaryMin && job.salaryMax && parseFloat(salaryMin) > job.salaryMax) return false;
      if (salaryMax && job.salaryMin && parseFloat(salaryMax) < job.salaryMin) return false;

      return true;
    });
  }, [savedJobs, searchQuery, location, employmentType, workArrangement, category, department, salaryMin, salaryMax]);

  const handleUnsaveJob = async (jobId: string) => {
    try {
      const response = await apiClient.delete(`/api/candidate/saved-jobs/${jobId}`);
      console.log('Unsave job response:', response);
      if (response.success) {
        toast({ title: 'Job removed from saved list' });
        await fetchSavedJobs();
      } else {
        toast({ title: 'Failed to remove job', variant: 'destructive', description: response.error });
      }
    } catch (error) {
      console.error('Error unsaving job:', error);
      toast({ title: 'Failed to remove job', variant: 'destructive' });
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      await apiClient.delete(`/api/candidate/saved-searches/${id}`);
      toast({ title: 'Saved search deleted' });
      fetchSavedSearches();
    } catch (error) {
      toast({ title: 'Failed to delete search', variant: 'destructive' });
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await apiClient.delete(`/api/candidate/job-alerts/${id}`);
      toast({ title: 'Job alert deleted' });
      fetchJobAlerts();
    } catch (error) {
      toast({ title: 'Failed to delete alert', variant: 'destructive' });
    }
  };

  const handleToggleAlert = async (alert: JobAlert) => {
    try {
      await apiClient.put(`/api/candidate/job-alerts/${alert.id}`, {
        isActive: !alert.isActive
      });
      fetchJobAlerts();
    } catch (error) {
      toast({ title: 'Failed to update alert', variant: 'destructive' });
    }
  };

  const handleCreateAlert = async () => {
    try {
      // Clean up criteria - remove undefined values
      const cleanCriteria = Object.entries(newAlert.criteria || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== 'any') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      await apiClient.post('/api/candidate/job-alerts', {
        ...newAlert,
        criteria: cleanCriteria
      });
      toast({ title: 'Job alert created' });
      setIsAlertDialogOpen(false);
      // Reset form
      setNewAlert({
        frequency: 'DAILY',
        channels: ['EMAIL'],
        isActive: true,
        criteria: {}
      });
      fetchJobAlerts();
    } catch (error) {
      toast({ title: 'Failed to create alert', variant: 'destructive' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setEmploymentType('');
    setWorkArrangement('');
    setCategory('');
    setDepartment('');
    setSalaryMin('');
    setSalaryMax('');
    setFeaturedOnly(false);
  };

  const hasActiveFilters = searchQuery || location || employmentType || workArrangement || category || department || salaryMin || salaryMax || featuredOnly;

  const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    const format = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num);
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
    return '';
  };

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title="Saved Items"
          subtitle="Manage your saved jobs, searches, and alerts"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex w-auto gap-1 rounded-full border bg-muted/40 px-1 py-1 shadow-sm">
              <TabsTrigger
                value="saved-jobs"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Bookmark className="h-3.5 w-3.5 flex-shrink-0" />
                Saved Jobs
                {savedJobs.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-xs rounded-full ml-1">
                    {savedJobs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="saved-searches"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0" />
                Search History
                {savedSearches.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-xs rounded-full ml-1">
                    {savedSearches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="job-alerts"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Bell className="h-3.5 w-3.5 flex-shrink-0" />
                Job Alerts
                {jobAlerts.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-xs rounded-full ml-1">
                    {jobAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved-jobs" className="space-y-4">
            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search saved jobs by title, company, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={location || "all"} onValueChange={(val) => setLocation(val === "all" ? "" : val)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {filterOptions.locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={employmentType || "all"} onValueChange={(val) => setEmploymentType(val === "all" ? "" : val)}>
                      <SelectTrigger className="w-[180px]">
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

                    <Select value={workArrangement || "all"} onValueChange={(val) => setWorkArrangement(val === "all" ? "" : val)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Work Arrangement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Arrangements</SelectItem>
                        <SelectItem value="ON_SITE">On Site</SelectItem>
                        <SelectItem value="REMOTE">Remote</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="pt-4 border-t space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
                          <Select value={category || "all"} onValueChange={(val) => setCategory(val === "all" ? "" : val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {filterOptions.categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Department</Label>
                          <Select value={department || "all"} onValueChange={(val) => setDepartment(val === "all" ? "" : val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Departments</SelectItem>
                              {filterOptions.departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Min Salary</Label>
                          <Input
                            type="number"
                            placeholder="Min"
                            value={salaryMin}
                            onChange={(e) => setSalaryMin(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Max Salary</Label>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={salaryMax}
                            onChange={(e) => setSalaryMax(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Count */}
                  {hasActiveFilters && (
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredSavedJobs.length} of {savedJobs.length} saved jobs
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saved Jobs List */}
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSavedJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {hasActiveFilters ? 'No jobs match your filters' : 'No saved jobs yet'}
                  </p>
                  <p className="mb-6">
                    {hasActiveFilters
                      ? 'Try adjusting your filters or search query.'
                      : "Save jobs you're interested in to apply later."}
                  </p>
                  {hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/jobs')}>
                      Browse Jobs
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSavedJobs.map((item) => {
                  if (!item.job) return null;
                  return (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-start justify-between md:justify-start gap-4">
                              <h3
                                className="text-base font-semibold hover:text-primary cursor-pointer"
                                onClick={() => navigate(`/jobs/${item.job!.id}`)}
                              >
                                {item.job.title}
                              </h3>
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                              {item.job.company?.name || 'Unknown Company'}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {item.job.location} ({item.job.workArrangement})
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {item.job.employmentType}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Posted {item.job.postingDate ? new Date(item.job.postingDate).toLocaleDateString() : 'Recently'}
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              {formatSalary(item.job.salaryMin, item.job.salaryMax, item.job.salaryCurrency)}
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col gap-2 shrink-0">
                            <Button size="sm" onClick={() => navigate(`/jobs/${item.job!.id}`)}>
                              Apply Now
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleUnsaveJob(item.job!.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Saved Searches Tab */}
          <TabsContent value="saved-searches" className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : savedSearches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-semibold mb-2">No search history</p>
                  <p className="text-sm mb-6">Your recent searches will appear here.</p>
                  <Button size="sm" onClick={() => navigate('/jobs')}>
                    Start Searching
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {savedSearches.map((search) => (
                  <Card key={search.id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold mb-1">
                          {search.query ? `"${search.query}"` : 'Filtered Search'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(search.filters || {}).filter(([key, value]) => value && key !== 'search').map(([key, value]) => (
                            <Badge key={key} variant="outline" className="h-6 px-2 text-xs rounded-full">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(search.lastSearchedAt || new Date()).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/jobs', { state: { filters: search.filters } })}
                        >
                          Run Search
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Job Alerts Tab */}
          <TabsContent value="job-alerts" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Job Alert</DialogTitle>
                    <DialogDescription>
                      Get notified when new jobs match your criteria.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5 py-4">
                    {/* Basic Info - 2 columns */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Alert Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Remote React Jobs"
                          value={newAlert.name || ''}
                          onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency" className="text-sm font-medium">Frequency</Label>
                        <Select
                          value={newAlert.frequency}
                          onValueChange={(val: any) => setNewAlert({ ...newAlert, frequency: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INSTANT">Instant</SelectItem>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Delivery Channels</Label>
                        <div className="flex gap-4 pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="email"
                              checked={newAlert.channels?.includes('EMAIL')}
                              onCheckedChange={(checked) => {
                                const channels = newAlert.channels || [];
                                if (checked) setNewAlert({ ...newAlert, channels: [...channels, 'EMAIL'] });
                                else setNewAlert({ ...newAlert, channels: channels.filter(c => c !== 'EMAIL') });
                              }}
                            />
                            <label htmlFor="email" className="text-sm cursor-pointer">Email</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="in_app"
                              checked={newAlert.channels?.includes('IN_APP')}
                              onCheckedChange={(checked) => {
                                const channels = newAlert.channels || [];
                                if (checked) setNewAlert({ ...newAlert, channels: [...channels, 'IN_APP'] });
                                else setNewAlert({ ...newAlert, channels: channels.filter(c => c !== 'IN_APP') });
                              }}
                            />
                            <label htmlFor="in_app" className="text-sm cursor-pointer">In-App</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Job Criteria */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold">Job Criteria (Optional)</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Specify criteria to filter which jobs trigger this alert</p>
                      </div>

                      {/* Keywords - Full width */}
                      <div className="space-y-2">
                        <Label htmlFor="alert-search" className="text-sm">Keywords</Label>
                        <Input
                          id="alert-search"
                          placeholder="e.g., React, Senior Developer, Python"
                          value={(newAlert.criteria as any)?.search || ''}
                          onChange={(e) => setNewAlert({
                            ...newAlert,
                            criteria: { ...(newAlert.criteria || {}), search: e.target.value || undefined }
                          })}
                        />
                      </div>

                      {/* Filters - 3 columns */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Location */}
                        <div className="space-y-2">
                          <Label htmlFor="alert-location" className="text-sm">Location</Label>
                          <Select
                            value={(newAlert.criteria as any)?.location || 'any'}
                            onValueChange={(val) => setNewAlert({
                              ...newAlert,
                              criteria: { ...(newAlert.criteria || {}), location: val === 'any' ? undefined : val }
                            })}
                          >
                            <SelectTrigger id="alert-location">
                              <SelectValue placeholder="Any Location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Location</SelectItem>
                              {filterOptions.locations.map((loc) => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Employment Type */}
                        <div className="space-y-2">
                          <Label htmlFor="alert-employment" className="text-sm">Employment Type</Label>
                          <Select
                            value={(newAlert.criteria as any)?.employmentType || 'any'}
                            onValueChange={(val) => setNewAlert({
                              ...newAlert,
                              criteria: { ...(newAlert.criteria || {}), employmentType: val === 'any' ? undefined : val }
                            })}
                          >
                            <SelectTrigger id="alert-employment">
                              <SelectValue placeholder="Any Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Type</SelectItem>
                              <SelectItem value="FULL_TIME">Full Time</SelectItem>
                              <SelectItem value="PART_TIME">Part Time</SelectItem>
                              <SelectItem value="CONTRACT">Contract</SelectItem>
                              <SelectItem value="CASUAL">Casual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Work Arrangement */}
                        <div className="space-y-2">
                          <Label htmlFor="alert-work" className="text-sm">Work Arrangement</Label>
                          <Select
                            value={(newAlert.criteria as any)?.workArrangement || 'any'}
                            onValueChange={(val) => setNewAlert({
                              ...newAlert,
                              criteria: { ...(newAlert.criteria || {}), workArrangement: val === 'any' ? undefined : val }
                            })}
                          >
                            <SelectTrigger id="alert-work">
                              <SelectValue placeholder="Any Arrangement" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Arrangement</SelectItem>
                              <SelectItem value="ON_SITE">On Site</SelectItem>
                              <SelectItem value="REMOTE">Remote</SelectItem>
                              <SelectItem value="HYBRID">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label htmlFor="alert-category" className="text-sm">Category</Label>
                          <Select
                            value={(newAlert.criteria as any)?.category || 'any'}
                            onValueChange={(val) => setNewAlert({
                              ...newAlert,
                              criteria: { ...(newAlert.criteria || {}), category: val === 'any' ? undefined : val }
                            })}
                          >
                            <SelectTrigger id="alert-category">
                              <SelectValue placeholder="Any Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Category</SelectItem>
                              {filterOptions.categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                          <Label htmlFor="alert-department" className="text-sm">Department</Label>
                          <Select
                            value={(newAlert.criteria as any)?.department || 'any'}
                            onValueChange={(val) => setNewAlert({
                              ...newAlert,
                              criteria: { ...(newAlert.criteria || {}), department: val === 'any' ? undefined : val }
                            })}
                          >
                            <SelectTrigger id="alert-department">
                              <SelectValue placeholder="Any Department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Department</SelectItem>
                              {filterOptions.departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Salary Range - spans remaining space */}
                        <div className="space-y-2">
                          <Label className="text-sm">Salary Range</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              id="alert-salary-min"
                              type="number"
                              placeholder="Min"
                              value={(newAlert.criteria as any)?.salaryMin || ''}
                              onChange={(e) => setNewAlert({
                                ...newAlert,
                                criteria: { ...(newAlert.criteria || {}), salaryMin: e.target.value ? parseFloat(e.target.value) : undefined }
                              })}
                            />
                            <Input
                              id="alert-salary-max"
                              type="number"
                              placeholder="Max"
                              value={(newAlert.criteria as any)?.salaryMax || ''}
                              onChange={(e) => setNewAlert({
                                ...newAlert,
                                criteria: { ...(newAlert.criteria || {}), salaryMax: e.target.value ? parseFloat(e.target.value) : undefined }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setIsAlertDialogOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleCreateAlert}>Create Alert</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : jobAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-semibold mb-2">No job alerts</p>
                  <p className="text-sm mb-6">Create alerts to get notified about new opportunities.</p>
                  <Button size="sm" onClick={() => setIsAlertDialogOpen(true)}>
                    Create Alert
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobAlerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold">{alert.name}</h3>
                          <Badge
                            variant="outline"
                            className={`h-6 px-2 text-xs rounded-full ${alert.isActive
                              ? 'bg-success/10 text-success border-success/20'
                              : ''
                              }`}
                          >
                            {alert.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {alert.frequency}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {alert.channels?.join(', ') || 'N/A'}
                          </span>
                        </div>
                        {/* Display criteria if any */}
                        {alert.criteria && Object.keys(alert.criteria).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(alert.criteria).filter(([_, value]) => value).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="h-6 px-2 text-xs rounded-full">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => handleToggleAlert(alert)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {alert.isActive ? 'On' : 'Off'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CandidatePageLayout>
  );
}
