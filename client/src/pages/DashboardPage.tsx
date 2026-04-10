import { useEffect, useState } from 'react'
import { Bot, AlertCircle, CheckCircle2, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAgentStore } from '@/store/useAgentStore'
import { useRunStore } from '@/store/useRunStore'
import { AgentGrid } from '@/components/agents/AgentGrid'
import { RunHistoryTable } from '@/components/runs/RunHistoryTable'
import { ModuleFilter } from '@/components/shared/ModuleFilter'

export function DashboardPage() {
  const { agents, fetchAgents } = useAgentStore()
  const { allRuns, fetchRuns } = useRunStore()
  const [selectedModule, setSelectedModule] = useState('all')

  useEffect(() => {
    fetchAgents()
    fetchRuns()
  }, [fetchAgents, fetchRuns])

  // Filter by module
  const filteredAgents = selectedModule === 'all'
    ? agents
    : agents.filter(a => a.module === selectedModule)

  const filteredWorkflows = new Set(filteredAgents.map(a => a.workflow))
  const filteredRuns = selectedModule === 'all'
    ? allRuns
    : allRuns.filter(r => filteredWorkflows.has(r.workflow))

  // Stats (based on filtered data)
  const activeRuns = filteredRuns.filter((r) => r.status === 'running' || r.status === 'resuming' || r.status === 'queued')
  const awaitingReview = filteredRuns.filter((r) => r.status === 'awaiting_review')
  const completedToday = filteredRuns.filter((r) => {
    if (r.status !== 'complete' || !r.completed_at) return false
    const today = new Date()
    const completed = new Date(r.completed_at)
    return completed.toDateString() === today.toDateString()
  })

  // Module counts for filter
  const moduleCounts: Record<string, number> = { all: agents.length }
  agents.forEach(a => { moduleCounts[a.module] = (moduleCounts[a.module] || 0) + 1 })

  const stats = [
    { label: 'Total Agents', value: filteredAgents.length, icon: Bot, color: 'text-primary' },
    { label: 'Active Runs', value: activeRuns.length, icon: Activity, color: 'text-blue-500' },
    { label: 'Awaiting Review', value: awaitingReview.length, icon: AlertCircle, color: 'text-amber-500' },
    { label: 'Completed Today', value: completedToday.length, icon: CheckCircle2, color: 'text-emerald-500' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-lg font-semibold">Invictus AI</h1>
        <p className="text-sm text-muted-foreground">Monitor and manage your AI agents and workflows</p>
      </div>

      {/* Module Filter */}
      <ModuleFilter selected={selectedModule} onChange={setSelectedModule} counts={moduleCounts} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Agents {selectedModule !== 'all' && <span className="text-muted-foreground font-normal">({filteredAgents.length})</span>}
          </h2>
          <a href="/insights/agents" className="text-xs text-primary hover:underline">View All</a>
        </div>
        <AgentGrid agents={filteredAgents} runs={filteredRuns} />
      </div>

      {/* Recent Runs */}
      {filteredRuns.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-4">Recent Runs</h2>
          <Card>
            <CardContent className="p-0">
              <RunHistoryTable runs={filteredRuns.slice(0, 10)} showWorkflow agents={agents} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
