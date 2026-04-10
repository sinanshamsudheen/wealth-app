import { http, HttpResponse, delay } from 'msw'
import { RunStatus, type AgentRunResponse, type RunStep } from '@/api/types'
import { WORKFLOW_DEFINITIONS } from './data/agents'
import { MOCK_RUNS } from './data/runs'
import { DAILY_SUMMARIES } from './data/dailySummaries'
import { getMeetingBriefById } from './data/meetingBriefs'

const dynamicRuns = new Map<string, AgentRunResponse>()
const runTimers = new Map<string, ReturnType<typeof setTimeout>>()

// Initialize with mock data
MOCK_RUNS.forEach(run => dynamicRuns.set(run.id, { ...run }))

function generateId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function advanceRun(runId: string) {
  const run = dynamicRuns.get(runId)
  if (!run) return

  const workflow = WORKFLOW_DEFINITIONS.find(w => w.workflow === run.workflow)
  if (!workflow) return

  const completedSteps = run.steps.filter(s => s.status === 'complete').length
  const runningStep = run.steps.find(s => s.status === 'running')

  if (runningStep) {
    // Complete the currently running step
    runningStep.status = 'complete'
    runningStep.completed_at = new Date().toISOString()
    runningStep.result_summary = `Completed ${runningStep.node.replace(/_/g, ' ')}`
    runningStep.actions = [`Processed ${runningStep.node.replace(/_/g, ' ')} step successfully`]

    // Check if this was an HITL step
    if (workflow.supportsHitl && runningStep.node === 'human_review') {
      run.status = RunStatus.AWAITING_REVIEW
      run.output = { draft: `Draft output for ${run.workflow} — awaiting advisor review`, status: 'pending_review' }
      dynamicRuns.set(runId, { ...run })
      return // Stop advancing
    }
  }

  // Start next step if available
  const nextStepIdx = run.steps.findIndex(s => s.status === 'pending')
  if (nextStepIdx !== -1) {
    run.steps[nextStepIdx].status = 'running'
    run.steps[nextStepIdx].started_at = new Date().toISOString()
    run.status = RunStatus.RUNNING
    dynamicRuns.set(runId, { ...run })

    const timer = setTimeout(() => advanceRun(runId), 2000 + Math.random() * 2000)
    runTimers.set(runId, timer)
  } else {
    // All steps done
    run.status = RunStatus.COMPLETE
    run.completed_at = new Date().toISOString()
    run.duration_ms = new Date(run.completed_at).getTime() - new Date(run.started_at!).getTime()
    run.output = { summary: `${run.workflow} completed successfully`, completed_steps: completedSteps + 1 }
    dynamicRuns.set(runId, { ...run })
  }
}

export const handlers = [
  // List agents
  http.get('/api/agents', async () => {
    await delay(300)
    return HttpResponse.json(WORKFLOW_DEFINITIONS)
  }),

  // Trigger a run
  http.post('/api/agents/:workflow/run', async ({ params, request }) => {
    await delay(500)
    const { workflow } = params as { workflow: string }
    const body = await request.json() as Record<string, unknown>
    const workflowDef = WORKFLOW_DEFINITIONS.find(w => w.workflow === workflow)
    if (!workflowDef) {
      return HttpResponse.json({ error: 'Unknown workflow' }, { status: 404 })
    }

    const runId = generateId()
    const now = new Date().toISOString()
    const steps: RunStep[] = workflowDef.steps.map(stepName => ({
      node: stepName,
      status: 'pending' as const,
      started_at: null,
      completed_at: null,
      result_summary: null,
      actions: [],
    }))

    const newRun: AgentRunResponse = {
      id: runId,
      tenant_id: 'tenant-watar',
      user_id: 'user-raoof',
      workflow,
      status: RunStatus.QUEUED,
      input: (body as { input: Record<string, unknown> }).input || {},
      output: null,
      steps,
      llm_config: (body as { llm_config?: Record<string, unknown> }).llm_config || { provider: 'azure_openai', model: 'gpt-4o' },
      error: null,
      triggered_by: 'user-raoof',
      created_at: now,
      started_at: null,
      completed_at: null,
      duration_ms: null,
    }

    dynamicRuns.set(runId, newRun)

    // Start advancing after a short delay
    setTimeout(() => {
      const run = dynamicRuns.get(runId)!
      run.status = RunStatus.RUNNING
      run.started_at = new Date().toISOString()
      run.steps[0].status = 'running'
      run.steps[0].started_at = new Date().toISOString()
      dynamicRuns.set(runId, { ...run })

      const timer = setTimeout(() => advanceRun(runId), 2000 + Math.random() * 1000)
      runTimers.set(runId, timer)
    }, 1000)

    return HttpResponse.json({ run_id: runId, status: 'queued' }, { status: 202 })
  }),

  // Get run status
  http.get('/api/runs/:runId', async ({ params }) => {
    await delay(200)
    const { runId } = params as { runId: string }
    const run = dynamicRuns.get(runId)
    if (!run) {
      return HttpResponse.json({ error: 'Run not found' }, { status: 404 })
    }
    return HttpResponse.json(run)
  }),

  // List runs (optionally filtered by workflow)
  http.get('/api/runs', async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const workflow = url.searchParams.get('workflow')
    let runs = Array.from(dynamicRuns.values())
    if (workflow) {
      runs = runs.filter(r => r.workflow === workflow)
    }
    runs.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    return HttpResponse.json(runs)
  }),

  // Resume a run (HITL)
  http.post('/api/runs/:runId/resume', async ({ params, request }) => {
    await delay(500)
    const { runId } = params as { runId: string }
    const body = await request.json() as { approved: boolean; feedback: string }
    const run = dynamicRuns.get(runId)

    if (!run) {
      return HttpResponse.json({ error: 'Run not found' }, { status: 404 })
    }
    if (run.status !== RunStatus.AWAITING_REVIEW) {
      return HttpResponse.json({ error: 'Run is not awaiting review' }, { status: 400 })
    }

    // Complete the human_review step
    const reviewStep = run.steps.find(s => s.node === 'human_review')
    if (reviewStep) {
      reviewStep.status = 'complete'
      reviewStep.completed_at = new Date().toISOString()
      reviewStep.result_summary = body.approved
        ? `Approved by advisor${body.feedback ? ` with feedback: "${body.feedback}"` : ''}`
        : `Rejected by advisor: "${body.feedback}"`
      reviewStep.actions = [body.approved ? 'Advisor approved the draft' : 'Advisor rejected the draft', ...(body.feedback ? [`Feedback: ${body.feedback}`] : [])]
    }

    run.status = RunStatus.RESUMING
    dynamicRuns.set(runId, { ...run })

    // Continue advancing
    setTimeout(() => {
      run.status = RunStatus.RUNNING
      dynamicRuns.set(runId, { ...run })

      const nextPending = run.steps.findIndex(s => s.status === 'pending')
      if (nextPending !== -1) {
        run.steps[nextPending].status = 'running'
        run.steps[nextPending].started_at = new Date().toISOString()
        dynamicRuns.set(runId, { ...run })
        const timer = setTimeout(() => advanceRun(runId), 2000)
        runTimers.set(runId, timer)
      } else {
        run.status = RunStatus.COMPLETE
        run.completed_at = new Date().toISOString()
        run.duration_ms = new Date(run.completed_at).getTime() - new Date(run.started_at!).getTime()
        dynamicRuns.set(runId, { ...run })
      }
    }, 1500)

    return HttpResponse.json({ run_id: runId, status: 'resuming' }, { status: 202 })
  }),

  // ── Daily Summaries ──────────────────────────────────────────────

  http.get('/api/daily-summaries', async () => {
    await delay(300)
    return HttpResponse.json(DAILY_SUMMARIES)
  }),

  // ── Meeting Briefs ───────────────────────────────────────────────

  http.get('/api/meeting-briefs/:meetingId', async ({ params }) => {
    await delay(300)
    const { meetingId } = params as { meetingId: string }
    const brief = getMeetingBriefById(meetingId)
    if (!brief) {
      return HttpResponse.json({ error: 'Meeting brief not found' }, { status: 404 })
    }
    return HttpResponse.json(brief)
  }),
]
