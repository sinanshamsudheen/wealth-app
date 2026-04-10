import { AGENT_MODULES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Handshake,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Users,
  LayoutGrid,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Handshake,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Users,
}

interface ModuleFilterProps {
  selected: string
  onChange: (moduleKey: string) => void
  counts?: Record<string, number>
}

export function ModuleFilter({ selected, onChange, counts }: ModuleFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {AGENT_MODULES.map((mod) => {
        const Icon = ICON_MAP[mod.icon]
        const isActive = selected === mod.key
        const count = counts?.[mod.key]

        return (
          <button
            key={mod.key}
            onClick={() => onChange(mod.key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
              isActive
                ? `${mod.bgColor} ${mod.color} border-current/20`
                : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {mod.shortLabel}
            {count !== undefined && count > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1',
                isActive ? 'bg-background/60' : 'bg-muted'
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
