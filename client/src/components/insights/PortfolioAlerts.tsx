import { ShieldAlert, Calendar, ClipboardList, Mail, AlertTriangle, AlertOctagon, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { SectionHeader } from './SectionHeader'
import type { PortfolioAlert, ActionModalType } from '@/api/types'

interface PortfolioAlertsProps {
  alerts: PortfolioAlert[]
  onAction: (type: ActionModalType, clientName: string, to?: string, subject?: string, description?: string) => void
}

export function PortfolioAlerts({ alerts, onAction }: PortfolioAlertsProps) {
  const driftAlerts = alerts.filter((a) => a.category === 'portfolio_drift')
  const marginAlerts = alerts.filter((a) => a.category === 'margin_call')

  if (alerts.length === 0) return null

  return (
    <div className="rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5">
      <SectionHeader icon={ShieldAlert} title="Portfolio Alerts" count={alerts.length} />

      {driftAlerts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Drift</span>
          </div>
          <div className="space-y-1">
            {driftAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {marginAlerts.length > 0 && (
        <div>
          {driftAlerts.length > 0 && <div className="border-t border-border/50 my-4" />}
          <div className="flex items-center gap-1.5 mb-3">
            <AlertOctagon className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margin Call</span>
          </div>
          <div className="space-y-1">
            {marginAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onAction={onAction} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertRow({
  alert,
  onAction,
}: {
  alert: PortfolioAlert
  onAction: (type: ActionModalType, clientName: string, to?: string, subject?: string, description?: string) => void
}) {
  const isMargin = alert.category === 'margin_call'

  function handleAction(type: ActionModalType) {
    if (type === 'send_email') {
      onAction(type, alert.clientName, alert.clientEmail, `Action Required: ${alert.description}`, `Dear Client,\n\nThis is to bring to your attention an important portfolio update regarding ${alert.clientName}.\n\n${alert.description}\n\nPlease let us know your availability to discuss the recommended next steps.\n\nBest regards,\n{{ADVISOR_NAME}}\nInvictus AI Wealth Management`)
    } else if (type === 'create_task') {
      onAction(type, alert.clientName, undefined, `${alert.clientName} — ${alert.description}`, `Follow up on portfolio alert for ${alert.clientName}:\n\n${alert.description}\n\nAction required: Review and resolve.`)
    } else {
      onAction(type, alert.clientName, undefined, `Portfolio Review — ${alert.clientName}`, alert.description)
    }
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
        isMargin ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg' : ''
      }`}
    >
      <div
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          isMargin ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm leading-relaxed">
          <a
            href={alert.clientHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-2 transition-colors"
          >
            {alert.clientName}
          </a>
          <span className="text-muted-foreground"> — {alert.description}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleAction('schedule_meeting')}>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Schedule a Meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('create_task')}>
            <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Create a Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('send_email')}>
            <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Send an Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
