import { useEffect, useState } from 'react'
import { useDealsStore } from '../store'
import { useAuthStore } from '@/store/useAuthStore'
import { PipelineSummary } from '../components/dashboard/PipelineSummary'
import { AllocationOverview } from '../components/dashboard/AllocationOverview'
import { RecentNews } from '../components/dashboard/RecentNews'
import { PipelineFunnel } from '../components/dashboard/PipelineFunnel'
import { TeamActivity } from '../components/dashboard/TeamActivity'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DateRange = '7d' | '30d' | '90d' | 'custom'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' },
]

export function DealsDashboardPage() {
  const { dashboardSummary, loadingDashboard, fetchDashboardSummary } = useDealsStore()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const role = useAuthStore((s) => s.getModuleRole('deals'))
  const isManagerOrOwner = role === 'manager' || role === 'owner'

  useEffect(() => {
    fetchDashboardSummary()
  }, [fetchDashboardSummary, dateRange])

  if (loadingDashboard || !dashboardSummary) {
    return <div className="text-muted-foreground">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Deals Dashboard</h1>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-3 text-xs',
                dateRange === opt.value && 'bg-background shadow-sm',
              )}
              onClick={() => setDateRange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <PipelineSummary
        pipelineCounts={dashboardSummary.pipelineCounts}
        totalOpportunities={dashboardSummary.totalOpportunities}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationOverview mandateAllocations={dashboardSummary.mandateAllocations} />
        <PipelineFunnel pipelineCounts={dashboardSummary.pipelineCounts} />
      </div>

      {isManagerOrOwner && <TeamActivity />}

      <RecentNews newsItems={dashboardSummary.recentNews} />
    </div>
  )
}
