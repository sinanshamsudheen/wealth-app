import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonViewerProps {
  data: unknown
  defaultExpanded?: boolean
}

function JsonNode({ name, value, depth = 0 }: { name?: string; value: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)

  if (value === null || value === undefined) {
    return (
      <div className="flex gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-purple-600 dark:text-purple-400">"{name}"</span>}
        {name && <span>: </span>}
        <span className="text-muted-foreground italic">null</span>
      </div>
    )
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-0.5 hover:bg-muted/50 rounded px-0.5"
          style={{ paddingLeft: depth * 16 }}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {name && <span className="text-purple-600 dark:text-purple-400">"{name}"</span>}
          {name && <span>: </span>}
          <span className="text-muted-foreground">{`{${entries.length}}`}</span>
        </button>
        {expanded && entries.map(([k, v]) => <JsonNode key={k} name={k} value={v} depth={depth + 1} />)}
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-0.5 hover:bg-muted/50 rounded px-0.5"
          style={{ paddingLeft: depth * 16 }}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {name && <span className="text-purple-600 dark:text-purple-400">"{name}"</span>}
          {name && <span>: </span>}
          <span className="text-muted-foreground">[{value.length}]</span>
        </button>
        {expanded && value.map((v, i) => <JsonNode key={i} name={String(i)} value={v} depth={depth + 1} />)}
      </div>
    )
  }

  const color = typeof value === 'string'
    ? 'text-emerald-600 dark:text-emerald-400'
    : typeof value === 'number'
    ? 'text-blue-600 dark:text-blue-400'
    : typeof value === 'boolean'
    ? 'text-amber-600 dark:text-amber-400'
    : ''

  return (
    <div className="flex gap-1" style={{ paddingLeft: depth * 16 }}>
      {name && <span className="text-purple-600 dark:text-purple-400">"{name}"</span>}
      {name && <span>: </span>}
      <span className={cn(color)}>
        {typeof value === 'string' ? `"${value}"` : String(value)}
      </span>
    </div>
  )
}

export function JsonViewer({ data, defaultExpanded: _ }: JsonViewerProps) {
  return (
    <div className="font-mono text-xs leading-relaxed bg-muted/30 rounded-lg p-3 overflow-x-auto">
      <JsonNode value={data} />
    </div>
  )
}
