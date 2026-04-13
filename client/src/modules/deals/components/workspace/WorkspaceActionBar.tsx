import { Shield, Share2, Download, AlertCircle, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { downloadAsHTML, downloadAsText } from './downloadDocument'
import type { WorkspaceTab, Opportunity, Document } from '../../types'

interface WorkspaceActionBarProps {
  activeTab: WorkspaceTab | null
  opportunity: Opportunity
  documents: Document[]
  onValidate: () => void
  onShare: () => void
  onDownload: (doc: Document) => void
}

function DownloadDropdown({ doc, opportunityName }: { doc: Document; opportunityName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Download
        <ChevronDown className="h-3 w-3 ml-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadAsHTML(doc, opportunityName)}>
          Download as HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadAsText(doc)}>
          Download as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function WorkspaceActionBar({
  activeTab,
  opportunity,
  documents,
  onValidate,
  onShare,
}: WorkspaceActionBarProps) {
  // Only show for document tabs
  if (!activeTab || activeTab.type === 'snapshot' || activeTab.type === 'source_file') {
    return null
  }

  // Find the current document
  const doc = activeTab.documentId
    ? documents.find((d) => d.id === activeTab.documentId)
    : null

  if (!doc) {
    return null
  }

  // Pass recommendation warning
  if (opportunity.recommendation === 'pass') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0 bg-amber-50 dark:bg-amber-950/30">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm text-amber-800 dark:text-amber-200">
          This deal is marked as Pass — what would you like to do?
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Placeholder — will update pipelineStatus in a future task
              console.log('Move to Rejected:', opportunity.id)
            }}
          >
            Move to Rejected
          </Button>
          <Button size="sm" onClick={onValidate}>
            Share for Review
          </Button>
        </div>
      </div>
    )
  }

  // Document status-based bars
  if (doc.status === 'draft') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0 bg-background">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onValidate}>
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Send for Validation
          </Button>
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Share
          </Button>
          <DownloadDropdown doc={doc} opportunityName={opportunity.name} />
        </div>
      </div>
    )
  }

  if (doc.status === 'in_review') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0 bg-blue-50 dark:bg-blue-950/30">
        <span className="text-sm text-blue-800 dark:text-blue-200">
          This document is currently in review
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => console.log('View Details:', doc.id)}>
            View Details
          </Button>
        </div>
      </div>
    )
  }

  if (doc.status === 'approved') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0 bg-emerald-50 dark:bg-emerald-950/30">
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm text-emerald-800 dark:text-emerald-200">
          This document has been approved
        </span>
        <div className="ml-auto flex items-center gap-2">
          <DownloadDropdown doc={doc} opportunityName={opportunity.name} />
        </div>
      </div>
    )
  }

  return null
}
