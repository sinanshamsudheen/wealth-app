import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JsonViewer } from '@/components/shared/JsonViewer'

interface RunOutputViewerProps {
  output: Record<string, unknown>
  workflow: string
}

function renderFormattedOutput(output: Record<string, unknown>) {
  return (
    <div className="space-y-4">
      {Object.entries(output).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

        if (typeof value === 'string') {
          return (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h4>
              <p className="text-sm leading-relaxed">{value}</p>
            </div>
          )
        }

        if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
          return (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h4>
              <ul className="space-y-1">
                {value.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-muted-foreground shrink-0">-</span>
                    <span>{item as string}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        if (Array.isArray(value) && value.every((v) => typeof v === 'object')) {
          return (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">{label}</h4>
              <div className="space-y-2">
                {value.map((item, i) => (
                  <Card key={i} className="border-dashed">
                    <CardContent className="p-3 text-sm">
                      {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="font-medium text-xs text-muted-foreground min-w-[80px]">
                            {k.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-xs">{String(v)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="bg-muted/50 rounded-md p-2">
                    <p className="text-[10px] text-muted-foreground">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        return (
          <div key={key}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h4>
            <p className="text-sm">{String(value)}</p>
          </div>
        )
      })}
    </div>
  )
}

export function RunOutputViewer({ output, workflow: _ }: RunOutputViewerProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Output</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formatted">
          <TabsList className="h-8">
            <TabsTrigger value="formatted" className="text-xs">Formatted</TabsTrigger>
            <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="formatted" className="mt-3">
            {renderFormattedOutput(output)}
          </TabsContent>
          <TabsContent value="json" className="mt-3">
            <JsonViewer data={output} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
