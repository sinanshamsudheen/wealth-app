import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AssetAllocationItem } from '../../types'

interface AssetAllocationTableProps {
  items: AssetAllocationItem[]
  onChange?: (items: AssetAllocationItem[]) => void
  readOnly?: boolean
}

export function AssetAllocationTable({ items, onChange, readOnly }: AssetAllocationTableProps) {
  function handleChange(index: number, field: keyof AssetAllocationItem, value: string) {
    if (!onChange) return
    const updated = items.map((item, i) => {
      if (i !== index) return item
      if (field === 'allocationPct') {
        return { ...item, [field]: parseFloat(value) || 0 }
      }
      return { ...item, [field]: value }
    })
    onChange(updated)
  }

  function handleAdd() {
    if (!onChange) return
    onChange([...items, { assetClass: '', allocationPct: 0, targetReturn: '' }])
  }

  function handleRemove(index: number) {
    if (!onChange) return
    onChange(items.filter((_, i) => i !== index))
  }

  if (items.length === 0 && readOnly) {
    return <p className="text-sm text-muted-foreground">No asset allocation defined.</p>
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_100px_120px_auto] gap-2 text-xs font-medium text-muted-foreground">
        <span>Asset Class</span>
        <span>Allocation %</span>
        <span>Target Return</span>
        {!readOnly && <span className="w-8" />}
      </div>
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_100px_120px_auto] items-center gap-2"
        >
          {readOnly ? (
            <>
              <span className="text-sm">{item.assetClass}</span>
              <span className="text-sm">{item.allocationPct}%</span>
              <span className="text-sm">{item.targetReturn}</span>
            </>
          ) : (
            <>
              <Input
                value={item.assetClass}
                onChange={(e) => handleChange(index, 'assetClass', e.target.value)}
                placeholder="e.g. Equities"
              />
              <Input
                type="number"
                value={item.allocationPct}
                onChange={(e) => handleChange(index, 'allocationPct', e.target.value)}
                min={0}
                max={100}
              />
              <Input
                value={item.targetReturn}
                onChange={(e) => handleChange(index, 'targetReturn', e.target.value)}
                placeholder="e.g. 8-12%"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemove(index)}
                aria-label="Remove row"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={handleAdd} className="mt-1">
          <Plus className="size-3.5 mr-1" />
          Add Row
        </Button>
      )}
    </div>
  )
}
