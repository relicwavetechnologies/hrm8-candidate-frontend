import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Briefcase,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  User,
} from 'lucide-react'
import logoDark from '@/assets/logo-dark.png'
import logoLight from '@/assets/logo-light.png'
import iconMark from '@/assets/icon-mark.png'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/shared/components/ui/sidebar'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { useWebSocket } from '@/contexts/WebSocketContext'

/* ── icon badge tone helpers (matches ATS AppSidebar) ── */

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

function iconBadgeToneClass(tone: BadgeTone = 'neutral', isActive = false): string {
  if (tone === 'brand') {
    return isActive
      ? 'border-sidebar-primary/30 bg-sidebar-primary/14 text-sidebar-primary shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.12)]'
      : 'border-sidebar-primary/22 bg-sidebar-primary/8 text-sidebar-primary/90'
  }
  if (tone === 'success') {
    return isActive
      ? 'border-emerald-500/30 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300'
      : 'border-emerald-500/22 bg-emerald-500/8 text-emerald-700/90 dark:text-emerald-300'
  }
  if (tone === 'warning') {
    return isActive
      ? 'border-amber-500/30 bg-amber-500/14 text-amber-700 dark:text-amber-300'
      : 'border-amber-500/22 bg-amber-500/8 text-amber-700/90 dark:text-amber-300'
  }
  if (tone === 'danger') {
    return isActive
      ? 'border-red-500/30 bg-red-500/14 text-red-700 dark:text-red-300'
      : 'border-red-500/22 bg-red-500/8 text-red-700/90 dark:text-red-300'
  }
  return isActive
    ? 'border-sidebar-border/80 bg-sidebar-accent/85 text-sidebar-foreground'
    : 'border-sidebar-border/70 bg-sidebar-accent/60 text-sidebar-foreground/80'
}

function badgeToneClass(tone: BadgeTone = 'neutral'): string {
  if (tone === 'brand') return 'border-sidebar-primary/28 bg-sidebar-primary/10 text-sidebar-primary/90'
  if (tone === 'success') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700/90 dark:text-emerald-300'
  if (tone === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-700/90 dark:text-amber-300'
  if (tone === 'danger') return 'border-red-500/30 bg-red-500/10 text-red-700/90 dark:text-red-300'
  return 'border-sidebar-border/70 bg-sidebar-accent/70 text-sidebar-foreground/80'
}

function CountPill({ count, tone = 'neutral', className }: { count?: number; tone?: BadgeTone; className?: string }) {
  if (!count || count <= 0) return null
  const text = count > 99 ? '99+' : String(count)
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums border',
        badgeToneClass(tone),
        className,
      )}
    >
      {text}
    </span>
  )
}

/* ── nav item type ── */

type NavItem = {
  path: string
  label: string
  icon: typeof LayoutDashboard
  iconTone?: BadgeTone
  badgeCount?: number
  badgeTone?: BadgeTone
}

/* ── sections ── */

const mainItems: NavItem[] = [
  { path: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconTone: 'brand' },
]

const profileItems: NavItem[] = [
  { path: '/candidate/profile', label: 'My Profile', icon: User, iconTone: 'brand' },
  { path: '/candidate/work-history', label: 'Work History', icon: Briefcase },
  { path: '/candidate/qualifications', label: 'Qualifications', icon: GraduationCap },
  { path: '/candidate/documents', label: 'Documents', icon: FolderOpen },
]

const activityItems: NavItem[] = [
  { path: '/candidate/applications', label: 'Applications', icon: FileText, iconTone: 'brand' },
  { path: '/candidate/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { path: '/candidate/assessments', label: 'Assessments', icon: ClipboardCheck, iconTone: 'warning' },
]

const commsItems: NavItem[] = [
  { path: '/candidate/notifications', label: 'Notifications', icon: Bell, iconTone: 'danger' },
  { path: '/candidate/messages', label: 'Messages', icon: MessageSquare, iconTone: 'danger' },
]

export function CandidateSidebar() {
  const location = useLocation()
  const { open, isMobile } = useSidebar()
  const { logout } = useCandidateAuth()
  const { unreadNotificationCount } = useWebSocket()
  const [isHovering, setIsHovering] = useState(false)

  const isPeekExpanded = !isMobile && !open && isHovering
  const isExpanded = isMobile || open || isPeekExpanded

  const isActive = (path: string) => {
    if (location.pathname === path) return true
    return location.pathname.startsWith(`${path}/`)
  }

  // Inject live badge counts
  const liveCommsItems = commsItems.map((item) => {
    if (item.path === '/candidate/notifications' && unreadNotificationCount > 0) {
      return { ...item, badgeCount: unreadNotificationCount, badgeTone: 'danger' as BadgeTone }
    }
    return item
  })

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path)
    const Icon = item.icon
    const iconTone = item.iconTone ?? 'neutral'
    const collapsedCountText = !isExpanded && item.badgeCount && item.badgeCount > 0
      ? (item.badgeCount > 99 ? '99+' : String(item.badgeCount))
      : null

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          tooltip={item.label}
          isActive={active}
          className={cn(
            'h-9 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-200',
            'overflow-visible',
            'hover:bg-sidebar-accent/80',
            !isExpanded && 'justify-center rounded-xl border border-sidebar-border/70 bg-sidebar/70 shadow-sm',
            !isExpanded && 'hover:border-sidebar-primary/35 hover:bg-sidebar-accent/95',
            isPeekExpanded && 'rounded-lg border-transparent bg-transparent shadow-none',
            active && 'bg-sidebar-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.35)]',
            active && !isExpanded && 'border-sidebar-primary/45 bg-sidebar-primary/15 shadow-[0_6px_18px_hsl(var(--sidebar-primary)/0.22)]',
          )}
        >
          <NavLink to={item.path} className={cn('flex w-full items-center gap-2.5', !isExpanded && 'justify-center')}>
            <span
              className={cn(
                'relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
                iconBadgeToneClass(iconTone, active),
              )}
            >
              <Icon
                className={cn('h-[17px] w-[17px] shrink-0 transition-transform duration-200', active && 'scale-[1.03]')}
                strokeWidth={active ? 2.2 : 1.9}
              />
              {collapsedCountText && (
                <span
                  className={cn(
                    'absolute -right-2 -top-2 z-10 inline-flex h-4 min-w-[1.1rem] items-center justify-center rounded-full border px-1 text-[8.5px] font-semibold leading-none shadow-sm',
                    badgeToneClass(item.badgeTone ?? 'neutral'),
                  )}
                >
                  {collapsedCountText}
                </span>
              )}
            </span>
            {isExpanded && <span className="truncate">{item.label}</span>}
            {isExpanded && <CountPill count={item.badgeCount} tone={item.badgeTone} className="ml-auto" />}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const sections = [
    { key: 'profile', label: 'Profile', items: profileItems },
    { key: 'activity', label: 'Activity', items: activityItems },
    { key: 'comms', label: 'Communication', items: liveCommsItems },
  ]

  const handleLogout = async () => {
    await logout()
  }

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar"
      data-hover-expand={!isMobile && !open && isHovering}
      onMouseEnter={() => !isMobile && !open && setIsHovering(true)}
      onMouseLeave={() => !isMobile && !open && setIsHovering(false)}
    >
      <SidebarHeader className="border-b border-sidebar-border/80 bg-gradient-to-b from-sidebar-accent/40 via-sidebar to-sidebar px-2.5 py-2.5">
        <NavLink
          to="/candidate/dashboard"
          className={cn(
            'flex items-center rounded-md transition-all duration-200 hover:opacity-90',
            isExpanded ? 'justify-start px-1.5 py-1.5' : 'justify-center p-1.5',
          )}
        >
          {isExpanded ? (
            <>
              <img src={logoDark} alt="HRM8" className="block h-8 dark:hidden" />
              <img src={logoLight} alt="HRM8" className="hidden h-8 dark:block" />
            </>
          ) : (
            <img src={iconMark} alt="HRM8" className="h-8 w-8 rounded-xl ring-1 ring-sidebar-border/70 shadow-sm" />
          )}
        </NavLink>

        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-full justify-start rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 px-2.5 text-xs text-sidebar-foreground/75 hover:bg-sidebar-accent/80"
          >
            <NavLink to="/jobs">
              <Search className="h-3.5 w-3.5" />
              <span>Search jobs...</span>
            </NavLink>
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-1.5 pb-16">
        {/* Main nav */}
        <SidebarGroup className="pt-2">
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3" />

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.key}>
            <SidebarGroup>
              {isExpanded && (
                <SidebarGroupLabel className="h-8 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/55">
                  <span>{section.label}</span>
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>{section.items.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="mx-3" />
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 bg-gradient-to-t from-sidebar-accent/30 to-transparent p-2.5">
        <div className={cn('flex gap-2', !isExpanded && 'flex-col items-center')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isExpanded ? 'sm' : 'icon'}
                asChild
                className={cn(
                  isActive('/candidate/settings') && 'bg-sidebar-primary/10 text-sidebar-primary',
                  isExpanded && 'h-8 min-w-0 flex-1 overflow-hidden px-2',
                )}
              >
                <NavLink
                  to="/candidate/settings"
                  className={cn(
                    'flex w-full min-w-0 items-center',
                    isActive('/candidate/settings') && 'text-sidebar-primary',
                    isExpanded && 'justify-start gap-2',
                  )}
                >
                  <Settings className="h-4 w-4" strokeWidth={1.9} />
                  {isExpanded && <span className="truncate">Settings</span>}
                </NavLink>
              </Button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isExpanded ? 'sm' : 'icon'}
                asChild
                className={cn(
                  isActive('/candidate/help') && 'bg-sidebar-primary/10 text-sidebar-primary',
                  isExpanded && 'h-8 min-w-0 flex-1 overflow-hidden px-2',
                )}
              >
                <NavLink
                  to="/candidate/help"
                  className={cn(
                    'flex w-full min-w-0 items-center',
                    isActive('/candidate/help') && 'text-sidebar-primary',
                    isExpanded && 'justify-start gap-2',
                  )}
                >
                  <HelpCircle className="h-4 w-4" strokeWidth={1.9} />
                  {isExpanded && <span className="truncate">Help</span>}
                </NavLink>
              </Button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right">Help</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isExpanded ? 'sm' : 'icon'}
                onClick={handleLogout}
                className={cn(isExpanded && 'h-8 min-w-0 flex-1 overflow-hidden px-2')}
              >
                <LogOut className="h-4 w-4" strokeWidth={1.9} />
                {isExpanded && <span className="truncate">Logout</span>}
              </Button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right">Logout</TooltipContent>}
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
