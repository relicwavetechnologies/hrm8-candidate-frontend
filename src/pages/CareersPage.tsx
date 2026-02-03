import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Building2, Globe, Briefcase, Search, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { jobService, type ApprovedCompany } from "@/shared/services/jobService";
import { CandidatePageLayout } from "@/shared/components/layouts/CandidatePageLayout";
import { PublicCandidatePageLayout } from "@/shared/components/layouts/PublicCandidatePageLayout";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";

export default function CareersPage() {
    console.log("[CareersPage] Rendering");
    const { isAuthenticated } = useCandidateAuth();
    const [companies, setCompanies] = useState<ApprovedCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Search & filters
    const [searchQuery, setSearchQuery] = useState("");
    const [hasJobsOnly, setHasJobsOnly] = useState(false);
    const [sortBy, setSortBy] = useState<"name" | "jobCount">("name");

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const response = await jobService.getPublicCompanies({ limit: 100 });

            if (response.success && response.data?.companies) {
                setCompanies(response.data.companies);
            }
        } catch (error) {
            console.error("Failed to load companies:", error);
        }
        setLoading(false);
    };

    // Apply filters and sorting
    const filteredCompanies = companies
        .filter(c => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const nameMatch = c.name.toLowerCase().includes(query);
                const domainMatch = (c.domain || "").toLowerCase().includes(query);
                const aboutMatch = (c.about || "").toLowerCase().includes(query);

                if (!nameMatch && !domainMatch && !aboutMatch) {
                    return false;
                }
            }
            // Has jobs filter
            if (hasJobsOnly && c.jobCount === 0) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            }
            return b.jobCount - a.jobCount; // Most jobs first
        });

    const hasActiveFilters = hasJobsOnly || sortBy !== "name";

    const clearFilters = () => {
        setSearchQuery("");
        setHasJobsOnly(false);
        setSortBy("name");
    };

    const totalJobs = companies.reduce((sum, c) => sum + c.jobCount, 0);

    const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

    return (
        <Layout showSidebarTrigger={false}>
            <div className="min-h-screen bg-background">
                {/* Hero */}
                <div className="bg-primary/5 border-b">
                    <div className="container mx-auto px-4 py-12">
                        <div className="max-w-3xl mx-auto text-center">
                            <h1 className="text-4xl font-bold tracking-tight mb-4">Explore Companies</h1>
                            <p className="text-lg text-muted-foreground mb-8">Discover great companies and their open positions</p>
                            <div className="relative max-w-xl mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search companies by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-12 rounded-full border-2"
                                />
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{companies.length} Companies</span>
                                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{totalJobs} Open Positions</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showFilters ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <SlidersHorizontal className="h-4 w-4 mr-2" />
                                Filters
                                {hasActiveFilters && <Badge variant="secondary" className="ml-2">Active</Badge>}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredCompanies.length} of {companies.length} companies
                        </p>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <Card className="mb-6 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Show Only</label>
                                    <Select
                                        value={hasJobsOnly ? "with-jobs" : "all"}
                                        onValueChange={(v) => setHasJobsOnly(v === "with-jobs")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Companies" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Companies</SelectItem>
                                            <SelectItem value="with-jobs">With Open Positions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Sort By</label>
                                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "jobCount")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort By" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">Name (A-Z)</SelectItem>
                                            <SelectItem value="jobCount">Most Open Positions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Companies Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i}><CardHeader><Skeleton className="h-28 w-full mb-4" /><Skeleton className="h-6 w-32" /></CardHeader></Card>
                            ))}
                        </div>
                    ) : filteredCompanies.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Companies Found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery || hasActiveFilters ? "Try adjusting your filters" : "No featured companies yet"}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                            )}
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCompanies.map((company) => (
                                <Link key={company.id} to={`/companies/${company.id}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                        {/* Banner */}
                                        <div
                                            className="h-28 bg-gradient-to-r from-primary/20 to-primary/5"
                                            style={company.bannerUrl ? {
                                                backgroundImage: `url(${company.bannerUrl})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            } : undefined}
                                        />
                                        <CardHeader className="-mt-8 relative pb-3">
                                            <div className="flex items-end gap-3">
                                                <div className="h-14 w-14 rounded-lg bg-background border shadow-sm flex items-center justify-center flex-shrink-0">
                                                    {company.logoUrl ? (
                                                        <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Building2 className="h-7 w-7 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pb-1">
                                                    <CardTitle className="text-base truncate">{company.name}</CardTitle>
                                                    {company.domain && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {company.domain}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-0">
                                            {company.about && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">{company.about}</p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    variant={company.jobCount > 0 ? "default" : "secondary"}
                                                    className={company.jobCount > 0 ? "bg-primary/10 text-primary" : ""}
                                                >
                                                    <Briefcase className="h-3 w-3 mr-1" />
                                                    {company.jobCount} Open Position{company.jobCount !== 1 ? "s" : ""}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center text-sm text-primary font-medium">
                                                View Company <ArrowRight className="h-4 w-4 ml-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
