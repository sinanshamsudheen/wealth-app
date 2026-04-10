import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LLM_PROVIDERS, LLM_MODELS } from '@/lib/constants'

interface LLMConfigFormProps {
  provider: string
  model: string
  onProviderChange: (v: string) => void
  onModelChange: (v: string) => void
}

export function LLMConfigForm({ provider, model, onProviderChange, onModelChange }: LLMConfigFormProps) {
  const models = LLM_MODELS[provider] || []

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-xs">LLM Provider</Label>
        <Select value={provider} onValueChange={(v) => {
          if (!v) return
          onProviderChange(v)
          const firstModel = LLM_MODELS[v]?.[0]?.value
          if (firstModel) onModelChange(firstModel)
        }}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LLM_PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Model</Label>
        <Select value={model} onValueChange={(v) => { if (v) onModelChange(v) }}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
