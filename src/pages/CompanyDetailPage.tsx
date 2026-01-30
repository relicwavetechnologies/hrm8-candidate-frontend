/**
 * Public Company Detail Page
 * Shows approved company's careers page with branding and job listings
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    Building2,
    MapPin,
    Globe,
    Briefcase,
    Search,
    ExternalLink,
    ArrowLeft,
    Clock,
    DollarSign,
    Linkedin,
    Twitter,
    Facebook,
    Instagram,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/shared/services/api';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';

interface CompanyDetail {
    id: string;
    name: string;
    website: string;
    domain: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    about: string | null;
    social: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
    } | null;
    images: string[] | null;
}

interface CompanyJob {
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    employmentType: string | null;
    workArrangement: string | null;
    experienceLevel: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    tags: string[];
    postedAt: string | null;
}

export default function CompanyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useCandidateAuth();

    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [jobs, setJobs] = useState<CompanyJob[]>([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('');
    const [departments, setDepartments] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            loadCompanyData();
        }
    }, [id, searchQuery, department, location]);

    const loadCompanyData = async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (department) params.append('department', department);
            if (location) params.append('location', location);

            const response = await apiClient.get<{
                company: CompanyDetail;
                jobs: CompanyJob[];
                totalJobs: number;
                filters: { departments: string[]; locations: string[] };
            }>(`/api/public/careers/companies/${id}?${params.toString()}`);

            if (response.success && response.data) {
                setCompany(response.data.company);
                setJobs(response.data.jobs);
                setTotalJobs(response.data.totalJobs);
                setDepartments(response.data.filters?.departments || []);
                setLocations(response.data.filters?.locations || []);
            } else {
                setError('Company not found');
            }
        } catch (err) {
            console.error('Failed to load company:', err);
            setError('Failed to load company details');
        } finally {
            setIsLoading(false);
        }
    };

    const formatSalary = (job: CompanyJob) => {
        if (!job.salaryMin) return null;
        const currency = job.salaryCurrency || 'USD';
        const min = job.salaryMin.toLocaleString();
        const max = job.salaryMax?.toLocaleString();
        return `${currency} ${min}${max ? ` - ${max}` : '+'}`;
    };

    const formatEmploymentType = (type: string | null) => {
        if (!type) return null;
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

    if (error && !isLoading) {
        return (
            <Layout showSidebarTrigger={false}>
                <div className="container mx-auto px-4 py-16 text-center">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button asChild>
                        <Link to="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Jobs</Link>
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showSidebarTrigger={false}>
            <div className="min-h-screen bg-background">
                {/* Banner */}
                <div
                    className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/5 relative"
                    style={company?.bannerUrl ? {
                        backgroundImage: `url(${company.bannerUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : undefined}
                >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="container mx-auto px-4 h-full relative">
                        <Link to="/jobs" className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center gap-2 text-sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Jobs
                        </Link>
                    </div>
                </div>

                {/* Company Header */}
                <div className="container mx-auto px-4 -mt-16 relative z-10">
                    {isLoading ? (
                        <Card className="p-6">
                            <div className="flex items-start gap-6">
                                <Skeleton className="h-24 w-24 rounded-lg" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        </Card>
                    ) : company && (
                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                {/* Logo */}
                                <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center border shadow-sm shrink-0">
                                    {company.logoUrl ? (
                                        <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover rounded-lg" />
                                    ) : (
                                        <Building2 className="h-12 w-12 text-primary" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold mb-2">{company.name}</h1>
                                    {company.website && (
                                        <a
                                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm mb-4"
                                        >
                                            <Globe className="h-4 w-4" />
                                            {company.website.replace(/(https?:\/\/)?(www\.)?/, '')}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}

                                    {/* Social Links */}
                                    {company.social && Object.keys(company.social).length > 0 && (
                                        <div className="flex items-center gap-3">
                                            {company.social.linkedin && (
                                                <a href={company.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                    <Linkedin className="h-5 w-5" />
                                                </a>
                                            )}
                                            {company.social.twitter && (
                                                <a href={company.social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                    <Twitter className="h-5 w-5" />
                                                </a>
                                            )}
                                            {company.social.facebook && (
                                                <a href={company.social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                    <Facebook className="h-5 w-5" />
                                                </a>
                                            )}
                                            {company.social.instagram && (
                                                <a href={company.social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                    <Instagram className="h-5 w-5" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="text-right">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                                        <Briefcase className="h-3 w-3 mr-1" />
                                        {totalJobs} Open Position{totalJobs !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* About Section */}
                {company?.about && (
                    <div className="container mx-auto px-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">About {company.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{company.about}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Gallery Images */}
                {company?.images && (company.images as string[]).length > 0 && (
                    <div className="container mx-auto px-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Life at {company.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {(company.images as string[]).map((url, index) => (
                                        <img
                                            key={index}
                                            src={url}
                                            alt={`${company.name} gallery ${index + 1}`}
                                            className="h-32 w-full rounded-lg object-cover hover:shadow-lg transition-shadow cursor-pointer"
                                            onClick={() => window.open(url, '_blank')}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Jobs Section */}
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-semibold">Open Positions</h2>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {departments.length > 0 && (
                                <Select value={department || undefined} onValueChange={(v) => setDepartment(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {locations.length > 0 && (
                                <Select value={location || undefined} onValueChange={(v) => setLocation(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Locations</SelectItem>
                                        {locations.map((l) => (
                                            <SelectItem key={l} value={l}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* Job Cards */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardContent className="p-6">
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold mb-2">No Jobs Found</h3>
                            <p className="text-muted-foreground text-sm">
                                {searchQuery || department || location
                                    ? 'Try adjusting your filters'
                                    : 'No open positions at this time'}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <Card
                                    key={job.id}
                                    className="hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    <Link to={`/jobs/${job.id}`}>
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                        {job.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                        {job.department && (
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase className="h-3.5 w-3.5" />
                                                                {job.department}
                                                            </span>
                                                        )}
                                                        {job.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {job.location}
                                                            </span>
                                                        )}
                                                        {job.employmentType && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {formatEmploymentType(job.employmentType)}
                                                            </Badge>
                                                        )}
                                                        {job.postedAt && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {formatSalary(job) && (
                                                        <span className="flex items-center gap-1 text-sm font-medium">
                                                            <DollarSign className="h-4 w-4 text-green-600" />
                                                            {formatSalary(job)}
                                                        </span>
                                                    )}
                                                    <Button size="sm">View Details</Button>
                                                </div>
                                            </div>

                                            {job.tags && job.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {job.tags.slice(0, 5).map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
