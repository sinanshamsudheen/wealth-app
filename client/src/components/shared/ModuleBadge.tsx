import { getModule } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ModuleBadgeProps {
  moduleKey: string
  className?: string
}

export function ModuleBadge({ moduleKey, className }: ModuleBadgeProps) {
  const mod = getModule(moduleKey)
  return (
    <span className={cn('inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded', mod.bgColor, mod.color, className)}>
      {mod.shortLabel}
    </span>
  )
}
