import { useState } from 'react'
import { Check, Loader2, Clock, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RunStep } from '@/api/types'

interface RunStepCardProps {
  step: RunStep
  isLast: boolean
}

const STATUS_ICONS = {
  complete: Check,
  running: Loader2,
  pending: Clock,
  failed: X,
}

function humanizeNode(node: string): string {
  return node.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getDuration(step: RunStep): string | null {
  if (!step.started_at || !step.completed_at) return null
  const ms = new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function RunStepCard({ step, isLast }: RunStepCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = STATUS_ICONS[step.status]
  const duration = getDuration(step)

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2',
            step.status === 'complete' && 'bg-emerald-500/10 border-emerald-500 text-emerald-500',
            step.status === 'running' && 'bg-blue-500/10 border-blue-500 text-blue-500',
            step.status === 'pending' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
            step.status === 'failed' && 'bg-red-500/10 border-red-500 text-red-500'
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', step.status === 'running' && 'animate-spin')} />
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[24px]',
              step.status === 'complete' ? 'bg-emerald-500/40' : 'bg-border'
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            'text-sm font-medium',
            step.status === 'pending' && 'text-muted-foreground'
          )}>
            {humanizeNode(step.node)}
          </span>
          {duration && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {duration}
            </span>
          )}
        </div>

        {step.result_summary && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {step.result_summary}
          </p>
        )}

        {step.actions.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-primary mt-1.5 hover:underline"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {step.actions.length} action{step.actions.length > 1 ? 's' : ''}
          </button>
        )}

        {expanded && (
          <ul className="mt-1.5 space-y-0.5">
            {step.actions.map((action, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex gap-1.5">
                <span className="text-muted-foreground/50 shrink-0">-</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
