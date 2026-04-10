import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
  count?: number
  iconColor?: string
  iconBg?: string
}

export function SectionHeader({ icon: Icon, title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4.5 w-4.5 text-foreground/70" />
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  )
}
