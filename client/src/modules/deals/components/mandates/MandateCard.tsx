import { DollarSign, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Mandate, MandateStatus } from '../../types'

interface MandateCardProps {
  mandate: Mandate
  onClick: () => void
}

const statusConfig: Record<MandateStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  draft: { label: 'Draft', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
}

export function MandateCard({ mandate, onClick }: MandateCardProps) {
  const status = statusConfig[mandate.status]

  const formattedAllocation = mandate.targetAllocation
    ? `$${(mandate.targetAllocation / 1_000_000).toFixed(0)}M`
    : '--'

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent/50',
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1">{mandate.name}</CardTitle>
          <Badge variant="secondary" className={cn('shrink-0', status.className)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="size-3.5" />
            {formattedAllocation}
          </span>
          {mandate.expectedReturn && (
            <span className="flex items-center gap-1">
              <TrendingUp className="size-3.5" />
              {mandate.expectedReturn}
            </span>
          )}
          {mandate.timeHorizon && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {mandate.timeHorizon}
            </span>
          )}
        </div>
        {mandate.investmentTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mandate.investmentTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-xs font-normal">
                {type}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
