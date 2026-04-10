import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  LayoutDashboard,
  Bot,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/insights' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/insights/dashboard' },
  { icon: Bot, label: 'Agents', path: '/insights/agents' },
  { icon: History, label: 'Runs', path: '/insights/runs' },
  { icon: Settings, label: 'Settings', path: '#' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <aside
      className={cn(
        'border-r border-border bg-sidebar flex flex-col shrink-0 transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const content = (
            <div
              className={cn(
                'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'text-sidebar-foreground',
                hoveredItem === item.label && 'bg-sidebar-accent'
              )}
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
          )

          const link = (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/insights'}
              className={({ isActive }) =>
                cn(isActive && item.path !== '#' && '[&>div]:bg-sidebar-accent [&>div]:text-sidebar-accent-foreground [&>div]:font-medium')
              }
            >
              {content}
            </NavLink>
          )

          return collapsed ? (
            <Tooltip key={item.label}>
              <TooltipTrigger className="w-full text-left">
                <NavLink
                  to={item.path}
                  end={item.path === '/insights'}
                  className={({ isActive }) =>
                    cn(isActive && item.path !== '#' && '[&>div]:bg-sidebar-accent [&>div]:text-sidebar-accent-foreground [&>div]:font-medium')
                  }
                >
                  {content}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : link
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-center h-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
