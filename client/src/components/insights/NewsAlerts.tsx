import { Newspaper, Globe, ExternalLink, MoreHorizontal, Calendar, ClipboardList, Mail, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { SectionHeader } from './SectionHeader'
import type { NewsAlert, ActionModalType } from '@/api/types'

interface NewsAlertsProps {
  alerts: NewsAlert[]
  onAction: (type: ActionModalType, clientName: string, to?: string, subject?: string, description?: string) => void
}

const NEWS_SOURCE_COLORS: Record<string, string> = {
  bloomberg: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  ft: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
  reuters: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300',
  wsj: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  'gulf news': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  'pe wire': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  'pe news': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  preqin: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300',
  kpmg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  'cbre research': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  ey: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  'gulf business': 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
  'infrastructure investor': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  drewry: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
}

function getSourceBadge(source: string): string {
  const normalized = source.toLowerCase()
  const entry = Object.entries(NEWS_SOURCE_COLORS).find(([key]) => normalized.includes(key))
  return entry ? entry[1] : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
}

export function NewsAlerts({ alerts, onAction }: NewsAlertsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (alerts.length === 0) return null

  return (
    <div className="rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5">
      <SectionHeader icon={Newspaper} title="News Alerts" count={alerts.length} />

      <div className="space-y-3">
        {alerts.map((alert) => {
          const isExpanded = expanded[alert.id] ?? false
          const badgeClass = getSourceBadge(alert.source)

          return (
            <div
              key={alert.id}
              className="rounded-lg border border-border/40 p-4 hover:border-border transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <Globe className="h-4 w-4 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                    >
                      {alert.headline}
                      <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                    </a>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${badgeClass}`}>
                      {alert.source}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{alert.summary}</p>
                </div>
              </div>

              {/* Affected Clients — collapsible with per-client three dots */}
              {alert.affectedClients.length > 0 && (
                <div className="mt-3 ml-12">
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [alert.id]: !isExpanded }))}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {alert.affectedClients.length} affected client{alert.affectedClients.length > 1 ? 's' : ''}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-0.5">
                      {alert.affectedClients.map((client) => (
                        <div key={client.name} className="flex items-center gap-2 rounded-md px-2 py-2 -mx-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <div className="flex-1 min-w-0 text-xs">
                            <span className="font-medium text-foreground">{client.name}</span>
                            <span className="text-muted-foreground"> — {client.impact}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-700">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onAction('schedule_meeting', client.name, undefined, `Meeting: ${alert.headline} — ${client.name}`, `Discuss the impact of "${alert.headline}" on ${client.name}'s portfolio.\n\n${client.impact}`)}>
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Schedule a Meeting
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAction('create_task', 'Internal Team', undefined, `${alert.headline} — Review ${client.name}`, `Review impact of "${alert.headline}" on ${client.name}.\n\n${client.impact}\n\nSource: ${alert.source}`)}>
                                <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Create a Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAction('send_email', client.name, client.email, alert.clientEmailSubject, alert.clientEmailBody)}>
                                <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                Send an Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
