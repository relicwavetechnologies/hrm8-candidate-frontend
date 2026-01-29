import { Outlet, Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
    LayoutDashboard,
    User,
    Briefcase,
    GraduationCap,
    FolderOpen,
    FileText,
    Bookmark,
    ClipboardCheck,
    MessageSquare,
    Settings,
    X,
} from 'lucide-react'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { SidebarProvider, useSidebar, SidebarInset } from '@/shared/components/ui/sidebar'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/candidate/dashboard' },
    { label: 'My Profile', icon: User, path: '/candidate/profile' },
    { label: 'Work History', icon: Briefcase, path: '/candidate/work-history' },
    { label: 'Qualifications', icon: GraduationCap, path: '/candidate/qualifications' },
    { label: 'Documents', icon: FolderOpen, path: '/candidate/documents' },
    { label: 'Applications', icon: FileText, path: '/candidate/applications' },
    { label: 'Saved Jobs', icon: Bookmark, path: '/candidate/saved-jobs' },
    { label: 'Assessments', icon: ClipboardCheck, path: '/candidate/assessments' },
    { label: 'Messages', icon: MessageSquare, path: '/candidate/messages' },
    { label: 'Settings', icon: Settings, path: '/candidate/settings' },
]

export function CandidateLayout() {
    return (
        <SidebarProvider defaultOpen={true}>
            <CandidateLayoutContent />
        </SidebarProvider>
    )
}

function CandidateLayoutContent() {
    const location = useLocation()
    const isMobile = useIsMobile()
    const { open: isSidebarOpen, setOpen: setIsSidebarOpen } = useSidebar()

    return (
        <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300",
                isSidebarOpen ? "w-64" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
            )}>
                <div className="flex h-16 items-center justify-between px-6 lg:justify-center">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <span className={cn("text-primary", !isSidebarOpen && "lg:hidden")}>HRM8</span>
                    </Link>
                    {isMobile && (
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground",
                                    !isSidebarOpen && "lg:justify-center lg:px-2"
                                )}
                                onClick={() => isMobile && setIsSidebarOpen(false)}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "")} />
                                <span className={cn(
                                    "transition-all duration-300",
                                    !isSidebarOpen && "lg:hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <SidebarInset className={cn(
                "flex flex-col flex-1 transition-all duration-300",
                isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
            )}>
                <Outlet />
            </SidebarInset>
        </div>
    )
}
