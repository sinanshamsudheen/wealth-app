import { CalendarDays, ListTodo, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RightPanelProps {
  collapsed: boolean
  onToggle: () => void
}

export function RightPanel({ collapsed, onToggle }: RightPanelProps) {
  return (
    <aside
      className={cn(
        'border-l border-border bg-card shrink-0 transition-all duration-200 hidden lg:flex flex-col',
        collapsed ? 'w-10' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
          {collapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Events
              </h3>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">+ Add</Button>
            </div>
            <p className="text-xs text-muted-foreground">No Upcoming Events</p>
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="h-4 w-4" /> Tasks / Requests
              </h3>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">+ Add</Button>
            </div>
            <p className="text-xs text-muted-foreground">No Tasks and Requests</p>
          </div>
        </div>
      )}
    </aside>
  )
}
