import { useState } from 'react'
import { AlertCircle, Check, X, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { runsApi } from '@/api/endpoints'
import type { AgentRunResponse } from '@/api/types'
import { useRunStore } from '@/store/useRunStore'
import { JsonViewer } from '@/components/shared/JsonViewer'

interface ReviewPanelProps {
  run: AgentRunResponse
  onResumed: () => void
}

export function ReviewPanel({ run, onResumed }: ReviewPanelProps) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { setRun } = useRunStore()

  async function handleResume(approved: boolean) {
    setSubmitting(true)
    try {
      await runsApi.resume(run.id, { approved, feedback })
      setRun({ ...run, status: 'resuming' as AgentRunResponse['status'] })
      onResumed()
    } catch {
      // Handle error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          Human Review Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          This run has paused for your review. Please examine the draft output below and approve, provide feedback, or reject.
        </p>

        {run.output && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Draft Output</h4>
            <JsonViewer data={run.output} defaultExpanded />
          </div>
        )}

        {showFeedback && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Feedback / Instructions</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback or instructions for the agent..."
              className="text-sm min-h-[80px]"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleResume(true)}
            disabled={submitting}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {feedback ? 'Approve with Feedback' : 'Approve'}
          </Button>
          {!showFeedback && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFeedback(true)}
              className="gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Add Feedback
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (!feedback) {
                setShowFeedback(true)
                return
              }
              handleResume(false)
            }}
            disabled={submitting}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
