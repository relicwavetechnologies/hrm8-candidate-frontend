"use client"

import * as React from "react"
import {
    User,
    Briefcase,
    FileText,
    LayoutDashboard,
    GraduationCap,
    Settings,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/shared/components/ui/command"
import { Button } from "@/shared/components/ui/button"
import { apiClient } from "@/shared/services/api"
import { applicationService } from "@/shared/services/applicationService"

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [jobs, setJobs] = React.useState<any[]>([])
    const [applications, setApplications] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const fetchResults = React.useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
            setJobs([])
            setApplications([])
            setLoading(false) // Ensure loading is false if query is too short
            return
        }

        setLoading(true)
        try {
            // 1. Search Jobs
            const jobsResponse = await apiClient.get<any>(`/api/public/jobs?search=${searchQuery}&limit=5`)
            if (jobsResponse.success) {
                setJobs(jobsResponse.data?.jobs || [])
            }

            // 2. Search Applications (Fetch all and filter client-side for now, or use endpoint if it exists)
            const appsResponse = await applicationService.getCandidateApplications()
            if (appsResponse.success) {
                const filteredApps = (appsResponse.data?.applications || []).filter((app: any) =>
                    app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.job?.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 5)
                setApplications(filteredApps)
            }
        } catch (error) {
            console.error("Search failed:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, fetchResults])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Search jobs, apps...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type to search..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {loading ? "Searching..." : "No results found."}
                    </CommandEmpty>

                    {jobs.length > 0 && (
                        <CommandGroup heading="Jobs">
                            {jobs.map((job) => (
                                <CommandItem
                                    key={job.id}
                                    onSelect={() => runCommand(() => navigate(`/jobs/${job.id}`))}
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{job.title}</span>
                                        <span className="text-xs text-muted-foreground">{job.company?.name} • {job.location}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {applications.length > 0 && (
                        <CommandGroup heading="Applications">
                            {applications.map((app) => (
                                <CommandItem
                                    key={app.id}
                                    onSelect={() => runCommand(() => navigate(`/candidate/applications`))}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{app.job?.title || "Job Application"}</span>
                                        <span className="text-xs text-muted-foreground">App #{app.id.slice(0, 8)} • Status: {app.status}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    <CommandSeparator />

                    <CommandGroup heading="Pages">
                        <CommandItem onSelect={() => runCommand(() => navigate("/candidate/dashboard"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/candidate/applications"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>My Applications</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/candidate/work-history"))}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Work History</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/candidate/qualifications"))}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            <span>Qualifications</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/candidate/profile"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/candidate/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
