import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { dealsApi } from '../../api'
import type { Opportunity, InvestmentType, SnapshotField } from '../../types'

interface SnapshotPanelProps {
  opportunity: Opportunity
  investmentTypes: InvestmentType[]
  onUpdate: (opportunity: Opportunity) => void
}

const fieldTypeBadgeMap: Record<string, string> = {
  text: 'Text',
  textarea: 'Text',
  number: '#',
  currency: '$',
  percentage: '%',
  date: 'Date',
  select: 'Select',
  'multi-select': 'Multi',
  boolean: 'Y/N',
}

export function SnapshotPanel({ opportunity, investmentTypes, onUpdate }: SnapshotPanelProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...opportunity.snapshotData })
  const [saving, setSaving] = useState(false)

  const investmentType = investmentTypes.find((t) => t.id === opportunity.investmentTypeId)
  const sections = investmentType?.snapshotConfig?.sections ?? []

  const isDirty = JSON.stringify(draft) !== JSON.stringify(opportunity.snapshotData)

  function updateField(fieldName: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [fieldName]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await dealsApi.updateOpportunity(opportunity.id, { snapshotData: draft })
      onUpdate(updated)
    } catch {
      // TODO: surface error
    } finally {
      setSaving(false)
    }
  }

  function renderField(field: SnapshotField) {
    const rawValue = draft[field.name]
    const value = rawValue != null ? String(rawValue) : ''
    const isEmpty = value === ''
    const isRequired = field.required

    return (
      <div key={field.name} className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-sm">
            {field.name}
            {isRequired && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
            {fieldTypeBadgeMap[field.type] ?? field.type}
          </Badge>
        </div>

        {field.type === 'textarea' ? (
          <Textarea
            value={String(value)}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.instruction || `Enter ${field.name}...`}
            rows={3}
            className={isEmpty && isRequired ? 'border-destructive/50' : ''}
          />
        ) : field.type === 'boolean' ? (
          <select
            value={String(value)}
            onChange={(e) => updateField(field.name, e.target.value === 'true')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">--</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        ) : field.type === 'select' && field.options ? (
          <select
            value={String(value)}
            onChange={(e) => updateField(field.name, e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <Input
            type={field.type === 'number' || field.type === 'currency' || field.type === 'percentage' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={String(value)}
            onChange={(e) => updateField(field.name, field.type === 'number' || field.type === 'currency' || field.type === 'percentage' ? Number(e.target.value) : e.target.value)}
            placeholder={field.instruction || `Enter ${field.name}...`}
            className={isEmpty && isRequired ? 'border-destructive/50' : ''}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with save */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Snapshot</h2>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No snapshot configuration found for this investment type.
        </p>
      )}

      {sections
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => (
          <div key={section.name} className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b pb-1.5">
              {section.name}
            </h3>
            <div className="grid gap-4">
              {section.fields.map(renderField)}
            </div>
          </div>
        ))}
    </div>
  )
}
