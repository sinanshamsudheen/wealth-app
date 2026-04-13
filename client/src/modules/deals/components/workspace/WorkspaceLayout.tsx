import { useRef, useCallback, useState } from 'react'
import { SnapshotPanel } from './SnapshotPanel'
import { DocumentPanel } from './DocumentPanel'
import { cn } from '@/lib/utils'
import type { Opportunity, InvestmentType, Document, WorkspaceTab } from '../../types'

interface WorkspaceLayoutProps {
  opportunity: Opportunity
  investmentTypes: InvestmentType[]
  documents: Document[]
  tabs: WorkspaceTab[]
  leftTabId: string | null
  rightTabId: string | null
  onOpportunityUpdate: (opp: Opportunity) => void
  onDocumentUpdate: (doc: Document) => void
}

const MIN_PANEL_WIDTH = 300

export function WorkspaceLayout({
  opportunity,
  investmentTypes,
  documents,
  tabs,
  leftTabId,
  rightTabId,
  onOpportunityUpdate,
  onDocumentUpdate,
}: WorkspaceLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftWidthPct, setLeftWidthPct] = useState(40)
  const draggingRef = useRef(false)

  const leftTab = tabs.find((t) => t.id === leftTabId) ?? null
  const rightTab = tabs.find((t) => t.id === rightTabId) ?? null

  const hasBothPanels = leftTab !== null && rightTab !== null

  const handleMouseDown = useCallback(() => {
    draggingRef.current = true

    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalWidth = rect.width
      const x = e.clientX - rect.left
      const pct = (x / totalWidth) * 100

      // Enforce min widths
      const minPct = (MIN_PANEL_WIDTH / totalWidth) * 100
      const maxPct = 100 - minPct
      setLeftWidthPct(Math.min(maxPct, Math.max(minPct, pct)))
    }

    function onMouseUp() {
      draggingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  function renderPanelContent(tab: WorkspaceTab) {
    if (tab.type === 'snapshot') {
      return (
        <SnapshotPanel
          opportunity={opportunity}
          investmentTypes={investmentTypes}
          onUpdate={onOpportunityUpdate}
        />
      )
    }

    if (tab.type === 'document' && tab.documentId) {
      const doc = documents.find((d) => d.id === tab.documentId)
      if (!doc) {
        return (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Document not found
          </div>
        )
      }
      return (
        <DocumentPanel
          key={doc.id}
          document={doc}
          opportunityId={opportunity.id}
          onUpdate={onDocumentUpdate}
        />
      )
    }

    return null
  }

  // No tabs assigned at all
  if (!leftTab && !rightTab) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Select a tab to get started
      </div>
    )
  }

  // Single panel — full width
  if (!hasBothPanels) {
    const activeTab = leftTab ?? rightTab!
    return (
      <div ref={containerRef} className="h-full overflow-auto">
        {renderPanelContent(activeTab)}
      </div>
    )
  }

  // Two panels with draggable divider
  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left panel */}
      <div
        className={cn('overflow-auto border-r')}
        style={{ width: `${leftWidthPct}%` }}
      >
        {renderPanelContent(leftTab)}
      </div>

      {/* Divider */}
      <div
        className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Right panel */}
      <div
        className="overflow-auto flex-1"
      >
        {renderPanelContent(rightTab)}
      </div>
    </div>
  )
}
