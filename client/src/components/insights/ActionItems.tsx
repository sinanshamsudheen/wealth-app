import {
  AlertTriangle,
  ClipboardList,
  Mail,
  Shield,
  Users,
  Landmark,

  UserCheck,
  Building2,
  MoreHorizontal,
  Calendar,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { SectionHeader } from './SectionHeader'
import type { DailySummaryActionItem, ActionModalType } from '@/api/types'
import type { LucideIcon } from 'lucide-react'

interface ActionItemsProps {
  items: DailySummaryActionItem[]
  onAction: (type: ActionModalType, clientName: string, to?: string, subject?: string, description?: string) => void
}

const SOURCE_CONFIG: Record<
  DailySummaryActionItem['source'],
  { icon: LucideIcon; label: string; href: string; color: string; bgColor: string }
> = {
  task_hub: {
    icon: ClipboardList,
    label: 'Task Hub',
    href: 'https://staging.asbitech.ai/engage/tasks-hub?taskStatus=2&period=1&applyTo=1',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  email: {
    icon: Mail,
    label: 'Email',
    href: 'https://outlook.office.com',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
  },
  compliance: {
    icon: Shield,
    label: 'Compliance',
    href: 'https://staging.asbitech.ai/engage/tasks-hub?taskStatus=2&period=1&applyTo=1',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  crm: {
    icon: Users,
    label: 'CRM',
    href: 'https://staging.asbitech.ai/engage/clients',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
  },
  invest_admin: {
    icon: Landmark,
    label: 'Invest. Admin',
    href: 'https://staging.asbitech.ai/engage/tasks-hub?taskStatus=2&period=1&applyTo=1',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
  },
}

export function ActionItems({ items, onAction }: ActionItemsProps) {
  if (items.length === 0) return null

  const clientItems = items.filter((i) => i.owner === 'client')
  const internalItems = items.filter((i) => i.owner === 'internal')

  return (
    <div className="rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5">
      <SectionHeader icon={AlertTriangle} title="Action Items" count={items.length} />

      {clientItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending from Client</span>
          </div>
          <div className="divide-y divide-border/30">
            {clientItems.map((item) => (
              <ActionItemRow key={item.id} item={item} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {internalItems.length > 0 && (
        <div>
          {clientItems.length > 0 && <div className="border-t border-border/50 my-4" />}
          <div className="flex items-center gap-1.5 mb-3">
            <Building2 className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Internal Team Requests</span>
          </div>
          <div className="divide-y divide-border/30">
            {internalItems.map((item) => (
              <ActionItemRow key={item.id} item={item} onAction={onAction} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionItemRow({
  item,
  onAction,
}: {
  item: DailySummaryActionItem
  onAction: (type: ActionModalType, clientName: string, to?: string, subject?: string, description?: string) => void
}) {
  const cfg = SOURCE_CONFIG[item.source]
  const SourceIcon = cfg.icon

  return (
    <div className="group flex items-center gap-3 px-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded-md">
      <a
        href={cfg.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bgColor}`}>
          <SourceIcon className={`h-4 w-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{item.title}</div>
          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
        </div>
      </a>
      <span className="text-[11px] font-medium text-muted-foreground bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md shrink-0">
        {cfg.label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onAction('schedule_meeting', item.client, undefined, `Meeting: ${item.title}`, item.description)}>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Schedule a Meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('create_task', item.client, undefined, item.title, `Follow up on action item:\n\n${item.title}\n${item.description}\n\nSource: ${cfg.label}`)}>
            <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Create a Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('send_email', item.client, undefined, `Re: ${item.title}`, `Dear Client,\n\nThis is regarding: ${item.title}\n\n${item.description}\n\nPlease let us know if you need any assistance.\n\nBest regards,\n{{ADVISOR_NAME}}\nInvictus AI Wealth Management`)}>
            <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Send an Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
