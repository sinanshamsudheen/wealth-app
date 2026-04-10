import type { RunStep } from '@/api/types'
import { RunStepCard } from './RunStepCard'

interface RunTimelineProps {
  steps: RunStep[]
}

export function RunTimeline({ steps }: RunTimelineProps) {
  if (steps.length === 0) return null

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <RunStepCard key={step.node} step={step} isLast={i === steps.length - 1} />
      ))}
    </div>
  )
}
