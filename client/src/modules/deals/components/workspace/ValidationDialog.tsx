import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useDealsStore } from '../../store'
import { dealsApi } from '../../api'
import type { Document } from '../../types'

interface ValidationDialogProps {
  documents: Document[]
  onClose: () => void
}

const typeLabels: Record<string, string> = {
  investment_memo: 'Memo',
  pre_screening: 'Pre-screening',
  ddq: 'DDQ',
  news: 'News',
  market_analysis: 'Analysis',
  custom: 'Custom',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
}

export function ValidationDialog({ documents, onClose }: ValidationDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reviewerId, setReviewerId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const updateWorkspaceDocument = useDealsStore((s) => s.updateWorkspaceDocument)

  function handleToggle(docId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) {
        next.delete(docId)
      } else {
        next.add(docId)
      }
      return next
    })
  }

  async function handleSubmit() {
    if (selectedIds.size === 0 || !reviewerId.trim()) return

    setSubmitting(true)
    try {
      await dealsApi.createReview({
        reviewerId: reviewerId.trim(),
        documentIds: Array.from(selectedIds),
      })

      for (const doc of documents) {
        if (selectedIds.has(doc.id)) {
          updateWorkspaceDocument({ ...doc, status: 'in_review' })
        }
      }

      onClose()
    } catch {
      // Error handling will be improved when toast notifications are added
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = selectedIds.size > 0 && reviewerId.trim().length > 0 && !submitting

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send for Validation</DialogTitle>
          <DialogDescription>
            Select documents to send for review and specify a reviewer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document selection */}
          <div className="space-y-2">
            <Label>Documents</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {documents.map((doc) => {
                const isDraft = doc.status === 'draft'
                const isSelected = selectedIds.has(doc.id)

                return (
                  <label
                    key={doc.id}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${
                      isDraft
                        ? 'cursor-pointer hover:bg-muted/60'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isDraft}
                      onChange={() => handleToggle(doc.id)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="flex-1 truncate">{doc.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {typeLabels[doc.documentType] ?? doc.documentType}
                    </Badge>
                    <Badge
                      variant={isDraft ? 'outline' : 'default'}
                      className="text-[10px]"
                    >
                      {statusLabels[doc.status] ?? doc.status}
                    </Badge>
                  </label>
                )
              })}
              {documents.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No documents in this workspace.
                </p>
              )}
            </div>
          </div>

          {/* Reviewer */}
          <div className="space-y-2">
            <Label htmlFor="reviewer-id">Reviewer ID</Label>
            <Input
              id="reviewer-id"
              placeholder="Enter reviewer user ID"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Sending...' : 'Send for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
