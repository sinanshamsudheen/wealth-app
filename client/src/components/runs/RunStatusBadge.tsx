import { Badge } from '@/components/ui/badge'
import { STATUS_CONFIG } from '@/lib/constants'
import { StatusDot } from '@/components/shared/StatusDot'
import type { RunStatus } from '@/api/types'
import { cn } from '@/lib/utils'

interface RunStatusBadgeProps {
  status: RunStatus
  className?: string
}

export function RunStatusBadge({ status, className }: RunStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  const dotStatus = status === 'awaiting_review' ? 'awaiting_review'
    : status === 'complete' ? 'complete'
    : status === 'failed' ? 'failed'
    : status === 'running' || status === 'resuming' ? 'running'
    : 'pending'

  return (
    <Badge variant="secondary" className={cn('gap-1.5 font-normal', config.bgColor, config.color, className)}>
      <StatusDot status={dotStatus} />
      {config.label}
    </Badge>
  )
}
