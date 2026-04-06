import { NavLink } from 'react-router-dom'
import { HelpCircle, LogOut, Settings } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useSidebar } from '@/shared/components/ui/sidebar'
import { cn } from '@/shared/lib/utils'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'

export function CandidateSidebarFooter() {
  const { open } = useSidebar()
  const { logout } = useCandidateAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className={cn('flex gap-2', !open && 'flex-col items-center')}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn(open && 'flex-1')}
          >
            <NavLink
              to="/candidate/settings"
              className={cn('flex items-center', open && 'justify-start gap-2')}
            >
              <Settings className="h-4 w-4" />
              {open && <span>Settings</span>}
            </NavLink>
          </Button>
        </TooltipTrigger>
        {!open && <TooltipContent side="right">Settings</TooltipContent>}
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn(open && 'flex-1')}
          >
            <NavLink
              to="/candidate/help"
              className={cn('flex items-center', open && 'justify-start gap-2')}
            >
              <HelpCircle className="h-4 w-4" />
              {open && <span>Help</span>}
            </NavLink>
          </Button>
        </TooltipTrigger>
        {!open && <TooltipContent side="right">Help</TooltipContent>}
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(open && 'flex-1')}
          >
            <LogOut className="h-4 w-4" />
            {open && <span>Logout</span>}
          </Button>
        </TooltipTrigger>
        {!open && <TooltipContent side="right">Logout</TooltipContent>}
      </Tooltip>
    </div>
  )
}
