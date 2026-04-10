import { Heart, Gift, Calendar, ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionHeader } from './SectionHeader'
import type { DailySummaryPersonalItem, ActionModalType } from '@/api/types'
import type { LucideIcon } from 'lucide-react'

interface PersonalTouchProps {
  items: DailySummaryPersonalItem[]
  onAction: (type: ActionModalType, clientName: string, to?: string, subject?: string, description?: string) => void
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  birthday: {
    icon: Gift,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
  },
  anniversary: {
    icon: Calendar,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
  },
  follow_up: {
    icon: ArrowRight,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
}

export function PersonalTouch({ items, onAction }: PersonalTouchProps) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5">
      <SectionHeader icon={Heart} title="Personal Touch" count={items.length} />

      <div className="space-y-2">
        {items.map((item) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.follow_up
          const ItemIcon = cfg.icon

          return (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-border/30"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bgColor}`}>
                <ItemIcon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{item.clientName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.note}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-medium shrink-0 gap-1.5 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                onClick={() => onAction('send_email', item.clientName, item.clientEmail, item.emailSubject, item.emailBody)}
              >
                <Mail className="h-3 w-3" />
                Send Wishes
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
