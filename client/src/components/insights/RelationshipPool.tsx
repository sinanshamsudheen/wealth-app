import { Users, TrendingUp, TrendingDown, Sparkles, BarChart3 } from 'lucide-react'
import { FlipCard } from './FlipCard'
import type { RelationshipPool as RelationshipPoolType } from '@/api/types'

interface RelationshipPoolProps {
  pool: RelationshipPoolType
}

const SEGMENT_COLORS: Record<string, { fill: string }> = {
  Affluents: { fill: '#34d399' },
  HNI: { fill: '#60a5fa' },
  UHNI: { fill: '#a78bfa' },
}

const GAP_COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b']

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const radius = 32
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      {segments.map((seg) => {
        const length = (seg.value / total) * circumference
        const dashArray = `${length} ${circumference - length}`
        const dashOffset = -offset
        offset += length
        return (
          <circle
            key={seg.label}
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        )
      })}
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-sm font-bold">
        {total}
      </text>
    </svg>
  )
}

export function RelationshipPool({ pool }: RelationshipPoolProps) {
  const maxGap = Math.max(...pool.deployableGaps.map((g) => g.amountNumeric))
  const totalDeployable = pool.deployableGaps.reduce((s, g) => s + g.amountNumeric, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] md:grid-rows-[1fr_1fr] gap-4 md:h-[240px] min-w-0">
      {/* Top-left: Total Clients (flip) */}
      <FlipCard
        className="md:row-start-1 md:col-start-1"
        front={
          <div className="h-full rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Users className="h-5 w-5 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-muted-foreground">Total Clients</span>
              <div className={`flex items-center gap-1 mt-0.5 text-[11px] font-medium ${pool.clientsTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {pool.clientsTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                +{pool.clientsTrend} this quarter
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">{pool.totalClients}</div>
          </div>
        }
        back={
          <div className="h-full rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-4 flex items-center gap-3">
            <DonutChart
              segments={pool.segmentSplit.map((seg) => ({
                label: seg.segment,
                value: seg.count,
                color: SEGMENT_COLORS[seg.segment]?.fill || '#94a3b8',
              }))}
            />
            <div className="flex-1 space-y-1.5">
              {pool.segmentSplit.map((seg) => (
                <div key={seg.segment} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[seg.segment]?.fill }} />
                    <span className="text-[11px] text-muted-foreground">{seg.segment}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        }
      />

      {/* Bottom-left: Total Networth */}
      <div className="md:row-start-2 md:col-start-1 rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm px-5 py-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <TrendingUp className="h-5 w-5 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">Total Networth</span>
          <div className={`flex items-center gap-1 mt-0.5 text-[11px] font-medium ${pool.networthTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {pool.networthTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pool.networthTrend >= 0 ? '+' : ''}{pool.networthTrend}% QoQ
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight text-foreground">{pool.totalNetworth}</div>
      </div>

      {/* Center: Deployment Gaps — spans 2 rows */}
      <div className="md:row-span-2 md:col-start-2 rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <BarChart3 className="h-4 w-4 text-foreground/70" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Deployment Gaps</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">${totalDeployable}m total</span>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-4">
          {pool.deployableGaps.map((gap, i) => (
            <div key={gap.assetClass} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{gap.assetClass}</span>
              <div className="flex-1 h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(gap.amountNumeric / maxGap) * 100}%`,
                    backgroundColor: GAP_COLORS[i % GAP_COLORS.length],
                  }}
                />
              </div>
              <span className="text-sm font-bold text-foreground w-12 text-right shrink-0">{gap.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Insights — spans 2 rows, starts from top */}
      <div className="md:row-span-2 md:col-start-3 rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Insights</span>
        </div>
        <div className="space-y-3">
          {pool.insights.map((insight, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <p className="text-sm text-foreground leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
