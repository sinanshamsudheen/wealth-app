import {
  ArrowLeft,
  Bell,
  Redo2,
  Share2,
  Undo2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { Opportunity } from '../../types'

interface WorkspaceHeaderProps {
  opportunity: Opportunity
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onBack: () => void
  onShare: () => void
}

const pipelineColors: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  archived: 'bg-muted text-muted-foreground',
  ignored: 'bg-muted text-muted-foreground',
}

const fitColors: Record<string, string> = {
  strong: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  moderate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  limited: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

const recoColors: Record<string, string> = {
  approve: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  watch: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  pass: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function WorkspaceHeader({
  opportunity,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  onShare,
}: WorkspaceHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0 bg-background">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <span className="text-lg font-semibold truncate">
        {opportunity.name}
      </span>

      <Badge
        className={cn(
          'border-transparent',
          pipelineColors[opportunity.pipelineStatus],
        )}
      >
        {capitalize(opportunity.pipelineStatus)}
      </Badge>

      {(opportunity.strategyFit || opportunity.recommendation) && (
        <>
          <div className="h-5 w-px bg-border mx-2" />

          {opportunity.strategyFit && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
                Strategy Fit
              </span>
              <Badge
                className={cn(
                  'border-transparent',
                  fitColors[opportunity.strategyFit],
                )}
              >
                {capitalize(opportunity.strategyFit)}
              </Badge>
            </div>
          )}

          {opportunity.recommendation && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
                Recommendation
              </span>
              <Badge
                className={cn(
                  'border-transparent',
                  recoColors[opportunity.recommendation],
                )}
              >
                {capitalize(opportunity.recommendation)}
              </Badge>
            </div>
          )}
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
