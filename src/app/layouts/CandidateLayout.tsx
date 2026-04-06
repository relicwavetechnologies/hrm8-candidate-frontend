import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarRail } from '@/shared/components/ui/sidebar'
import { useSidebarState } from '@/shared/hooks/useSidebarState'
import { CandidateSidebar } from './CandidateSidebar'

export function CandidateLayout() {
  const { open, setOpen } = useSidebarState('candidate')

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <CandidateSidebar />
      <SidebarRail />
      <SidebarInset className="bg-background">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
