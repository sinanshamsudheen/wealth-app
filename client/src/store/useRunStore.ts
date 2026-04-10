import { create } from 'zustand'
import type { AgentRunResponse } from '@/api/types'
import { runsApi } from '@/api/endpoints'

interface RunState {
  runs: Record<string, AgentRunResponse>
  allRuns: AgentRunResponse[]
  loading: boolean
  fetchRun: (runId: string) => Promise<AgentRunResponse | null>
  fetchRuns: (workflow?: string) => Promise<void>
  setRun: (run: AgentRunResponse) => void
}

export const useRunStore = create<RunState>((set, get) => ({
  runs: {},
  allRuns: [],
  loading: false,

  fetchRun: async (runId: string) => {
    try {
      const run = await runsApi.get(runId)
      set((state) => ({
        runs: { ...state.runs, [runId]: run },
      }))
      return run
    } catch {
      return null
    }
  },

  fetchRuns: async (workflow?: string) => {
    set({ loading: true })
    try {
      const runs = await runsApi.list(workflow)
      const runsMap = { ...get().runs }
      runs.forEach((r) => { runsMap[r.id] = r })
      set({ allRuns: runs, runs: runsMap, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setRun: (run: AgentRunResponse) =>
    set((state) => ({
      runs: { ...state.runs, [run.id]: run },
    })),
}))
