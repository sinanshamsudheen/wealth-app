import { useState } from 'react'
import { DollarSign, TrendingUp, Clock, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { dealsApi } from '../../api'
import { AssetAllocationTable } from './AssetAllocationTable'
import type { Mandate, AssetAllocationItem } from '../../types'

interface StrategyOverviewProps {
  mandate: Mandate
  onUpdate: (mandate: Mandate) => void
}

export function StrategyOverview({ mandate, onUpdate }: StrategyOverviewProps) {
  const [draft, setDraft] = useState<Partial<Mandate>>({})
  const [saving, setSaving] = useState(false)

  // Merge draft changes over the mandate for display
  const merged = { ...mandate, ...draft }

  function updateField<K extends keyof Mandate>(field: K, value: Mandate[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleTagInput(field: 'investmentTypes' | 'targetSectors' | 'geographicFocus', value: string) {
    const tags = value.split(',').map((s) => s.trim()).filter(Boolean)
    updateField(field, tags)
  }

  async function handleSave() {
    if (Object.keys(draft).length === 0) return
    setSaving(true)
    try {
      const updated = await dealsApi.updateMandate(mandate.id, draft)
      onUpdate(updated)
      setDraft({})
    } catch {
      // TODO: surface error
    } finally {
      setSaving(false)
    }
  }

  const formattedAllocation = merged.targetAllocation
    ? `$${(merged.targetAllocation / 1_000_000).toFixed(0)}M`
    : '--'

  const isDirty = Object.keys(draft).length > 0

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target Allocation</p>
              <p className="text-lg font-semibold">{formattedAllocation}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected Avg Return</p>
              <p className="text-lg font-semibold">{merged.expectedReturn || '--'}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Clock className="size-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time Horizon</p>
              <p className="text-lg font-semibold">{merged.timeHorizon || '--'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editable fields */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Target Allocation ($)</Label>
            <Input
              type="number"
              value={merged.targetAllocation ?? ''}
              onChange={(e) => updateField('targetAllocation', e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 50000000"
            />
          </div>

          <div className="space-y-2">
            <Label>Expected Return</Label>
            <Input
              value={merged.expectedReturn}
              onChange={(e) => updateField('expectedReturn', e.target.value)}
              placeholder="e.g. 8-12%"
            />
          </div>

          <div className="space-y-2">
            <Label>Time Horizon</Label>
            <Input
              value={merged.timeHorizon}
              onChange={(e) => updateField('timeHorizon', e.target.value)}
              placeholder="e.g. 5-7 years"
            />
          </div>

          <div className="space-y-2">
            <Label>Investment Types</Label>
            <Input
              value={(merged.investmentTypes ?? []).join(', ')}
              onChange={(e) => handleTagInput('investmentTypes', e.target.value)}
              placeholder="Private Equity, Venture Capital, ..."
            />
            {merged.investmentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {merged.investmentTypes.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target Sectors</Label>
            <Input
              value={(merged.targetSectors ?? []).join(', ')}
              onChange={(e) => handleTagInput('targetSectors', e.target.value)}
              placeholder="Technology, Healthcare, ..."
            />
            {merged.targetSectors.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {merged.targetSectors.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Geographic Focus</Label>
            <Input
              value={(merged.geographicFocus ?? []).join(', ')}
              onChange={(e) => handleTagInput('geographicFocus', e.target.value)}
              placeholder="North America, Europe, ..."
            />
            {merged.geographicFocus.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {merged.geographicFocus.map((g) => (
                  <Badge key={g} variant="outline" className="text-xs font-normal">
                    {g}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Asset Allocation &amp; Target Returns</Label>
            <AssetAllocationTable
              items={merged.assetAllocation ?? []}
              onChange={(items: AssetAllocationItem[]) => updateField('assetAllocation', items)}
            />
          </div>

          <div className="space-y-2">
            <Label>Investment Criteria</Label>
            <Textarea
              value={merged.investmentCriteria}
              onChange={(e) => updateField('investmentCriteria', e.target.value)}
              placeholder="Describe the investment criteria..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Investment Constraints</Label>
            <Textarea
              value={merged.investmentConstraints}
              onChange={(e) => updateField('investmentConstraints', e.target.value)}
              placeholder="Describe any constraints..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Investment Strategy</Label>
            <Textarea
              value={merged.investmentStrategy}
              onChange={(e) => updateField('investmentStrategy', e.target.value)}
              placeholder="Describe the overall strategy..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || saving}>
          <Save className="mr-1.5 size-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
