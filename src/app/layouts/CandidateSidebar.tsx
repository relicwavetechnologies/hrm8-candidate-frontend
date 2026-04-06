import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Briefcase,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  User,
  GraduationCap,
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/ui/sidebar'
import { cn } from '@/shared/lib/utils'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { CandidateSidebarFooter } from './CandidateSidebarFooter'

const menuItems = [
  { path: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/candidate/profile', label: 'My Profile', icon: User },
  { path: '/candidate/work-history', label: 'Work History', icon: Briefcase },
  { path: '/candidate/qualifications', label: 'Qualifications', icon: GraduationCap },
  { path: '/candidate/documents', label: 'Documents', icon: FolderOpen },
  { path: '/candidate/applications', label: 'Applications', icon: FileText },
  { path: '/candidate/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { path: '/candidate/assessments', label: 'Assessments', icon: ClipboardCheck },
  { path: '/candidate/notifications', label: 'Notifications', icon: Bell },
  { path: '/candidate/messages', label: 'Messages', icon: MessageSquare },
]

export function CandidateSidebar() {
  const location = useLocation()
  const { open } = useSidebar()
  const { candidate } = useCandidateAuth()
  const { unreadNotificationCount } = useWebSocket()
  const [isHovering, setIsHovering] = useState(false)

  const isExpanded = open || (!open && isHovering)

  const isActive = (path: string) => {
    if (location.pathname === path) return true
    return location.pathname.startsWith(`${path}/`)
  }

  return (
    <Sidebar
      collapsible="icon"
      data-hover-expand={!open && isHovering}
      onMouseEnter={() => !open && setIsHovering(true)}
      onMouseLeave={() => !open && setIsHovering(false)}
    >
      <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-b from-sidebar-accent/30 to-transparent p-4">
        <NavLink
          to="/candidate/dashboard"
          className={cn(
            'flex items-center transition-all duration-200 hover:opacity-80',
            isExpanded ? 'justify-start px-2' : 'justify-center'
          )}
        >
          {isExpanded ? (
            <>
              <img
                src={logoDark}
                alt="HRM8"
                className="block h-8 dark:hidden"
              />
              <img
                src={logoLight}
                alt="HRM8"
                className="hidden h-8 dark:block"
              />
            </>
          ) : (
            <img
              src={iconMark}
              alt="HRM8"
              className="h-8 w-8"
            />
          )}
        </NavLink>
        {isExpanded && candidate && (
          <p className="mt-2 px-2 text-xs text-muted-foreground">
            {candidate.firstName} {candidate.lastName}
          </p>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        'relative transition-all duration-200 hover:bg-sidebar-accent/50',
                        active && [
                          'bg-primary/10 text-primary font-medium',
                          isExpanded && 'border-l-4 border-primary',
                        ]
                      )}
                    >
                      <NavLink
                        to={item.path}
                        className="flex w-full items-center gap-3"
                      >
                        <span className="relative inline-flex">
                          <Icon
                            className={cn(
                              'h-5 w-5 transition-all',
                              !isExpanded && 'mx-auto'
                            )}
                          />
                          {item.path === '/candidate/notifications' && unreadNotificationCount > 0 && !isExpanded && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                            </span>
                          )}
                        </span>
                        {isExpanded && (
                          <span className="flex flex-1 items-center justify-between">
                            <span>{item.label}</span>
                            {item.path === '/candidate/notifications' && unreadNotificationCount > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-gradient-to-t from-sidebar-accent/30 to-transparent p-3">
        <CandidateSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
