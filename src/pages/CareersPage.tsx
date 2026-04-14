import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Dot,
  MapPin,
  Search,
} from 'lucide-react';

import logoDark from '@/assets/logo-dark.png';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { jobService, type ApprovedCompany } from '@/shared/services/jobService';

const PAGE_SIZE = 6;

type SortValue = 'relevance' | 'jobs' | 'az';

type LocationValue = 'Remote' | string;

type CompanyStageValue = 'actively_hiring' | 'featured';

function text(input?: string | null): string {
  return String(input || '').trim();
}

function compact(input: string, max = 86): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trim()}...`;
}

function extractSummary(company: ApprovedCompany): string {
  const base = text(company.about || company.overview)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (base) return compact(base, 86);
  return 'Building the future of seamless data integration for enterprise teams.';
}

function titleCase(input?: string | null): string {
  const value = text(input);
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function companyIndustry(company: ApprovedCompany): string {
  const first = (company.industries || []).find((item) => text(item));
  return first ? titleCase(first) : 'Technology';
}

function companyLocation(company: ApprovedCompany): string {
  const primary = company.primaryLocation;
  const parts = [primary?.city, primary?.stateOrRegion, primary?.country].map(text).filter(Boolean);
  if (parts.length > 0) {
    const value = parts.join(', ');
    if (/remote/i.test(value)) return value;
    return value;
  }
  return 'Remote';
}

function normalizeCompanySize(company: ApprovedCompany): '0-50 employees' | '51-200 employees' | '201-1000 employees' | '1000+ employees' {
  const size = text(company.companySize).toLowerCase();
  if (!size) return '0-50 employees';

  const numbers = size.match(/\d+/g)?.map((v) => Number(v)) || [];
  const min = numbers[0] || 0;
  const max = numbers[1] || numbers[0] || 0;

  if (size.includes('+') || min >= 1000) return '1000+ employees';
  if ((min >= 201 && min <= 1000) || (max >= 201 && max <= 1000)) return '201-1000 employees';
  if ((min >= 51 && min <= 200) || (max >= 51 && max <= 200)) return '51-200 employees';
  return '0-50 employees';
}

function isRemoteLocation(location: string): boolean {
  return /remote/i.test(location);
}

function isFeatured(company: ApprovedCompany): boolean {
  return company.verificationStatus === 'VERIFIED' && company.jobCount >= 5;
}

function score(company: ApprovedCompany, query: string): number {
  const q = query.toLowerCase();
  if (!q) return 0;

  const name = company.name.toLowerCase();
  const industry = companyIndustry(company).toLowerCase();
  const summary = extractSummary(company).toLowerCase();

  let result = 0;
  if (name.includes(q)) result += 8;
  if (industry.includes(q)) result += 4;
  if (summary.includes(q)) result += 2;
  return result;
}

function buildPageItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const items: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('ellipsis');

  items.push(total);
  return items;
}

function CompanyCard({ company }: { company: ApprovedCompany }) {
  const navigate = useNavigate();

  const industry = companyIndustry(company);
  const location = companyLocation(company);
  const verified = company.verificationStatus === 'VERIFIED';
  const initials = text(company.name).slice(0, 1).toUpperCase() || 'C';

  return (
    <article className="w-[278px] rounded-[12px] border border-[#e8e8e8] bg-white p-5">
      <div className="mx-auto flex h-[56px] w-[56px] items-center justify-center rounded-[12px] border border-[#e8e8e8] bg-[#ffecee] text-[18px] font-semibold text-[#ef6b6b]">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="h-full w-full rounded-[12px] object-cover" />
        ) : (
          initials
        )}
      </div>

      <p className="mt-4 text-center text-[16px] font-medium leading-[26px] text-[#656565]">{company.name}</p>
      <p className="mt-2 text-center text-[14px] leading-[24px] text-[#656565]">{extractSummary(company)}</p>

      <div className="mt-3 flex justify-center">
        <span className="inline-flex rounded-full bg-[#eff8ff] px-2 py-[2px] text-[12px] font-medium leading-[18px] text-[#175cd3]">
          {industry}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[16px] leading-[26px] text-[#656565]">
        <MapPin className="h-[18px] w-[18px]" />
        {location}
      </div>

      <div className="my-4 h-px w-full bg-[#e8e8e8]" />

      <div className="space-y-2">
        <p className="flex items-center justify-center gap-2 text-[14px] leading-[24px] text-[#959595]">
          <Building2 className="h-5 w-5 text-[#4e61f6]" />
          {verified ? 'Verified employer' : 'Official employer'}
        </p>

        <p className="flex items-center justify-center gap-2 text-[14px] leading-[24px] text-[#959595]">
          <Dot className="h-4 w-4 text-[#00c465]" />
          Actively hiring
        </p>

        <p className="flex items-center justify-center gap-2 text-[12px] font-medium leading-[16px] text-[#4e61f6]">
          <ClipboardList className="h-4 w-4" />
          {company.jobCount} open positions
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/companies/${company.id}`)}
        className="mt-4 h-8 w-full rounded-[8px] bg-[#4e61f6] text-[12px] font-semibold leading-[16px] text-white"
      >
        View Company
      </button>

      <button
        type="button"
        onClick={() => navigate(`/jobs?search=${encodeURIComponent(company.name)}`)}
        className="mt-2 inline-flex h-8 w-full items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-[#e8e8e8] text-[12px] font-semibold leading-[16px] text-[#474747]"
      >
        See Jobs
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}

export default function CareersPage() {
  const { candidate } = useCandidateAuth();

  const [allCompanies, setAllCompanies] = useState<ApprovedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const [locationText, setLocationText] = useState('');

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['Technology']);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>(['0-50 employees']);
  const [selectedLocations, setSelectedLocations] = useState<LocationValue[]>(['Remote']);
  const [selectedCompanyStage, setSelectedCompanyStage] = useState<CompanyStageValue[]>(['actively_hiring']);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await jobService.getPublicCompanies({ limit: 200, page: 1, search: searchQuery || undefined });
        if (response.success && response.data?.companies) {
          setAllCompanies(response.data.companies);
        } else {
          setAllCompanies([]);
        }
      } catch (error) {
        console.error('Failed to load public companies:', error);
        setAllCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [searchQuery]);

  const industryCounts = useMemo(() => {
    const map = new Map<string, number>();
    allCompanies.forEach((company) => {
      const industry = companyIndustry(company);
      map.set(industry, (map.get(industry) || 0) + 1);
    });
    const values = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return values;
  }, [allCompanies]);

  const industryOptions = useMemo(() => {
    const defaults = ['Technology', 'Healthcare', 'Finance', 'Retail'];
    const merged = defaults.map((name) => {
      const found = industryCounts.find(([industry]) => industry === name);
      return [name, found?.[1] || 0] as const;
    });

    industryCounts.forEach(([industry, count]) => {
      if (!merged.find(([name]) => name === industry)) merged.push([industry, count]);
    });

    return merged;
  }, [industryCounts]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    set.add('Remote');
    allCompanies.forEach((company) => {
      const location = companyLocation(company);
      if (location && !isRemoteLocation(location)) set.add(location);
    });
    return Array.from(set).slice(0, 4);
  }, [allCompanies]);

  const filteredCompanies = useMemo(() => {
    const base = allCompanies.filter((company) => {
      const industry = companyIndustry(company);
      const size = normalizeCompanySize(company);
      const location = companyLocation(company);

      if (selectedIndustries.length > 0 && !selectedIndustries.includes(industry)) return false;
      if (selectedCompanySizes.length > 0 && !selectedCompanySizes.includes(size)) return false;

      if (selectedLocations.length > 0) {
        const locationMatch = selectedLocations.some((selected) => {
          if (selected === 'Remote') return isRemoteLocation(location) || !text(location);
          return location.toLowerCase().includes(selected.toLowerCase());
        });
        if (!locationMatch) return false;
      }

      if (selectedCompanyStage.includes('actively_hiring') && company.jobCount <= 0) return false;
      if (selectedCompanyStage.includes('featured') && !isFeatured(company)) return false;

      if (locationText.trim()) {
        const hay = `${location} ${company.name}`.toLowerCase();
        if (!hay.includes(locationText.toLowerCase())) return false;
      }

      return true;
    });

    const enriched = base.map((company) => ({
      company,
      relevanceScore: score(company, searchQuery),
    }));

    enriched.sort((a, b) => {
      if (sortBy === 'jobs') return b.company.jobCount - a.company.jobCount;
      if (sortBy === 'az') return a.company.name.localeCompare(b.company.name);
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return b.company.jobCount - a.company.jobCount;
    });

    return enriched.map((entry) => entry.company);
  }, [allCompanies, locationText, searchQuery, selectedCompanySizes, selectedCompanyStage, selectedIndustries, selectedLocations, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));

  const pagedCompanies = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredCompanies, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  const toggle = <T extends string>(value: T, values: T[], setValues: React.Dispatch<React.SetStateAction<T[]>>) => {
    setValues((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
    setCurrentPage(1);
  };

  const clearAll = () => {
    setLocationText('');
    setSelectedIndustries([]);
    setSelectedCompanySizes([]);
    setSelectedLocations([]);
    setSelectedCompanyStage([]);
    setCurrentPage(1);
  };

  const companySizeOptions = ['0-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'];

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
            <button className="flex h-[64px] items-center gap-2 px-4 pb-[15px] pt-4 text-[#656565]" type="button">
              <ClipboardList className="h-5 w-5" />
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

      <section className="border-b border-[#e8e8e8] bg-[#323986] px-4 py-[54px]">
        <div className="mx-auto flex max-w-[685px] flex-col items-center gap-14">
          <div className="text-center text-white">
            <h1 className="text-[44px] font-semibold leading-[44px]">Explore Hiring Companies</h1>
            <p className="mt-3 text-[16px] font-medium leading-[26px]">Discover verified employers actively hiring on HRM8</p>
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
                placeholder="Search by name or industry..."
                className="h-full flex-1 bg-transparent text-[14px] leading-[24px] text-[#474747] outline-none placeholder:text-[#b8b8b8]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery(searchInput.trim());
                setCurrentPage(1);
              }}
              className="h-12 rounded-[12px] bg-[#4e61f6] px-8 text-[16px] font-medium leading-[26px] text-white"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-[1276px] gap-[16px] px-4 py-5">
        <aside className="w-[278px] shrink-0 rounded-[12px] border border-[#e8e8e8] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[20px] font-medium leading-[30px] text-[#474747]">Filters</p>
            <button type="button" onClick={clearAll} className="text-[14px] leading-[24px] text-[#4e61f6]">
              Clear All
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Industry</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <div className="space-y-3">
                {industryOptions.slice(0, 4).map(([industry, count]) => {
                  const checked = selectedIndustries.includes(industry);
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggle(industry, selectedIndustries, setSelectedIndustries)}
                      className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                    >
                      <span className={checked ? 'h-4 w-4 rounded-[6px] bg-[#4e61f6]' : 'h-4 w-4 rounded-[6px] border-[1.5px] border-[#4e61f6]'} />
                      {industry} ({count})
                    </button>
                  );
                })}
              </div>
              <button type="button" className="mt-3 text-[14px] leading-[24px] text-[#4e61f6]">Show more +</button>
            </section>

            <div className="h-px w-full bg-[#e8e8e8]" />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Company Size</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>
              <div className="space-y-3">
                {companySizeOptions.map((option) => {
                  const checked = selectedCompanySizes.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggle(option, selectedCompanySizes, setSelectedCompanySizes)}
                      className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                    >
                      <span className={checked ? 'h-4 w-4 rounded-[6px] bg-[#4e61f6]' : 'h-4 w-4 rounded-[6px] border-[1.5px] border-[#4e61f6]'} />
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="h-px w-full bg-[#e8e8e8]" />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Location</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>

              <div className="mb-3 flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e8e8] px-3">
                <MapPin className="h-4 w-4 text-[#656565]" />
                <input
                  value={locationText}
                  onChange={(event) => {
                    setLocationText(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Type a city..."
                  className="h-full flex-1 bg-transparent text-[14px] leading-[24px] text-[#474747] outline-none placeholder:text-[#b8b8b8]"
                />
              </div>

              <div className="space-y-3">
                {locationOptions.map((option) => {
                  const checked = selectedLocations.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggle(option, selectedLocations, setSelectedLocations)}
                      className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                    >
                      <span className={checked ? 'h-4 w-4 rounded-[6px] bg-[#4e61f6]' : 'h-4 w-4 rounded-[6px] border-[1.5px] border-[#4e61f6]'} />
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="h-px w-full bg-[#e8e8e8]" />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] leading-[26px] text-[#474747]">Company Size</p>
                <ChevronDown className="h-4 w-4 text-[#656565]" />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggle('actively_hiring', selectedCompanyStage, setSelectedCompanyStage)}
                  className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                >
                  <span className={selectedCompanyStage.includes('actively_hiring') ? 'h-4 w-4 rounded-[6px] bg-[#4e61f6]' : 'h-4 w-4 rounded-[6px] border-[1.5px] border-[#4e61f6]'} />
                  Actively hiring
                </button>

                <button
                  type="button"
                  onClick={() => toggle('featured', selectedCompanyStage, setSelectedCompanyStage)}
                  className="flex items-center gap-3 text-[14px] leading-[24px] text-[#656565]"
                >
                  <span className={selectedCompanyStage.includes('featured') ? 'h-4 w-4 rounded-[6px] bg-[#4e61f6]' : 'h-4 w-4 rounded-[6px] border-[1.5px] border-[#4e61f6]'} />
                  Featured Companies
                </button>
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[30px] font-medium leading-[40px] text-[#474747]">
              Showing {filteredCompanies.length} companies
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
                  className="h-10 appearance-none rounded-[8px] border border-[#e8e8e8] bg-white pl-3 pr-9 text-[14px] leading-[24px] text-[#474747]"
                >
                  <option value="relevance">Relevance</option>
                  <option value="jobs">Most jobs</option>
                  <option value="az">A-Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#656565]" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[12px] border border-[#e8e8e8] bg-white p-10 text-center text-[16px] leading-[26px] text-[#656565]">
              Loading companies...
            </div>
          ) : pagedCompanies.length === 0 ? (
            <div className="rounded-[12px] border border-[#e8e8e8] bg-white p-10 text-center text-[16px] leading-[26px] text-[#656565]">
              No companies found for selected filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pagedCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#5b67f3] text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {pageItems.map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <span key={`ellipsis-${index}`} className="inline-flex h-9 w-9 items-center justify-center rounded-[46px] bg-white text-[14px] text-[#98a2b3]">
                        ...
                      </span>
                    );
                  }

                  const active = item === currentPage;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={active
                        ? 'inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#5b67f3] bg-white text-[14px] text-black'
                        : 'inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-white text-[14px] text-[#98a2b3]'}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#5b67f3] text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
