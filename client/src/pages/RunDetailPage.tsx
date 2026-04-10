import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Cpu, User as UserIcon, Loader2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RunTimeline } from '@/components/runs/RunTimeline'
import { RunStatusBadge } from '@/components/runs/RunStatusBadge'
import { RunOutputViewer } from '@/components/runs/RunOutputViewer'
import { ReviewPanel } from '@/components/hitl/ReviewPanel'
import { useRunStatus } from '@/hooks/useRunStatus'
import { isActiveStatus } from '@/lib/constants'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const { run, isPolling, startPolling } = useRunStatus(runId ?? null)

  if (!run) {
    return <LoadingScreen message="Loading run..." fullScreen={false} />
  }

  const completedSteps = run.steps.filter((s) => s.status === 'complete').length
  const totalSteps = run.steps.length
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const workflowName = run.workflow.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const modelName = (run.llm_config as Record<string, string>)?.model || 'N/A'
  const providerName = (run.llm_config as Record<string, string>)?.provider || 'N/A'

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2 gap-1 text-xs">
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-semibold">{workflowName}</h1>
              <RunStatusBadge status={run.status} />
              {isPolling && (
                <span className="flex items-center gap-1 text-[10px] text-blue-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Live
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{run.id}</p>
          </div>
        </div>

        {/* Meta cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-muted/50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
              <Clock className="h-3 w-3" /> Started
            </div>
            <p className="text-xs font-medium">
              {run.started_at ? format(new Date(run.started_at), 'MMM d, HH:mm:ss') : 'Pending'}
            </p>
            {run.started_at && (
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
              </p>
            )}
          </div>
          <div className="bg-muted/50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
              <Clock className="h-3 w-3" /> Duration
            </div>
            <p className="text-xs font-medium">{formatDuration(run.duration_ms)}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
              <Cpu className="h-3 w-3" /> Model
            </div>
            <p className="text-xs font-medium">{modelName}</p>
            <p className="text-[10px] text-muted-foreground">{providerName}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
              <UserIcon className="h-3 w-3" /> Triggered By
            </div>
            <p className="text-xs font-medium">{run.triggered_by || 'System'}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isActiveStatus(run.status) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps}/{totalSteps} steps</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* HITL Review Panel */}
      {run.status === 'awaiting_review' && (
        <ReviewPanel run={run} onResumed={startPolling} />
      )}

      {/* Step Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Execution Timeline</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {completedSteps}/{totalSteps} steps
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <RunTimeline steps={run.steps} />
        </CardContent>
      </Card>

      {/* Output */}
      {run.output && run.status === 'complete' && (
        <RunOutputViewer output={run.output} workflow={run.workflow} />
      )}

      {/* Error */}
      {run.error && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-destructive font-mono whitespace-pre-wrap">{run.error}</pre>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
