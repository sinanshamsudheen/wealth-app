import { useCallback, useState } from 'react'
import { useRunStore } from '@/store/useRunStore'
import { usePolling } from './usePolling'
import { isActiveStatus } from '@/lib/constants'
import type { AgentRunResponse } from '@/api/types'

export function useRunStatus(runId: string | null) {
  const { fetchRun, runs } = useRunStore()
  const [polling, setPolling] = useState(true)

  const run = runId ? runs[runId] : null
  const shouldPoll = polling && !!runId && (!run || isActiveStatus(run.status))

  const poll = useCallback(async () => {
    if (!runId) return
    const updated = await fetchRun(runId)
    if (updated && !isActiveStatus(updated.status)) {
      setPolling(false)
    }
  }, [runId, fetchRun])

  usePolling(poll, 2000, shouldPoll)

  const startPolling = () => setPolling(true)

  return { run: run as AgentRunResponse | null, isPolling: shouldPoll, startPolling }
}
