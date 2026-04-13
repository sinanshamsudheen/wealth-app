import { useEffect, useState } from 'react'
import { AlertCircle, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useDealsStore } from '../../store'
import { dealsApi } from '../../api'
import type { Document, DocumentReview } from '../../types'

interface ReviewBannerProps {
  opportunityId: string
  documents: Document[]
  currentUserId: string
}

export function ReviewBanner({ opportunityId, documents, currentUserId }: ReviewBannerProps) {
  const [reviews, setReviews] = useState<DocumentReview[]>([])
  const [activeAction, setActiveAction] = useState<{ reviewId: string; action: 'approve' | 'request_changes' } | null>(null)
  const [rationale, setRationale] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const updateWorkspaceDocument = useDealsStore((s) => s.updateWorkspaceDocument)

  useEffect(() => {
    let cancelled = false

    async function fetchReviews() {
      try {
        const allReviews = await dealsApi.listReviews({ status: 'pending' })

        // Filter reviews to those relevant to this workspace's documents
        const docIds = new Set(documents.map((d) => d.id))
        const relevant = allReviews.filter((r) =>
          r.documents.some((rd) => docIds.has(rd.documentId)),
        )

        if (!cancelled) {
          setReviews(relevant)
        }
      } catch {
        // Silently fail — banner just won't render
      }
    }

    if (documents.length > 0) {
      fetchReviews()
    }

    return () => {
      cancelled = true
    }
  }, [opportunityId, documents])

  async function handleSubmitAction() {
    if (!activeAction || !rationale.trim()) return

    setSubmitting(true)
    try {
      const status = activeAction.action === 'approve' ? 'approved' : 'changes_requested'
      await dealsApi.updateReview(activeAction.reviewId, {
        status,
        rationale: rationale.trim(),
      })

      // Find which documents are part of this review
      const review = reviews.find((r) => r.id === activeAction.reviewId)
      if (review) {
        const reviewDocIds = new Set(review.documents.map((d) => d.documentId))
        const newDocStatus = activeAction.action === 'approve' ? 'approved' as const : 'draft' as const

        for (const doc of documents) {
          if (reviewDocIds.has(doc.id)) {
            updateWorkspaceDocument({ ...doc, status: newDocStatus })
          }
        }
      }

      // Remove the handled review from local state
      setReviews((prev) => prev.filter((r) => r.id !== activeAction.reviewId))
      setActiveAction(null)
      setRationale('')
    } catch {
      // Error handling will be improved when toast notifications are added
    } finally {
      setSubmitting(false)
    }
  }

  // Count documents in review
  const inReviewDocs = documents.filter((d) => d.status === 'in_review')

  if (reviews.length === 0 || inReviewDocs.length === 0) {
    return null
  }

  // Check if the current user is a reviewer on any of the active reviews
  const userReviews = reviews.filter((r) => r.reviewerId === currentUserId)
  const isReviewer = userReviews.length > 0

  return (
    <div className="border-b bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {inReviewDocs.length} document{inReviewDocs.length !== 1 ? 's' : ''} pending review
              {reviews[0] && (
                <span className="font-normal text-amber-700 dark:text-amber-300">
                  {' '}— reviewer: {reviews[0].reviewerId}
                </span>
              )}
            </p>

            {isReviewer && !activeAction && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/50 dark:text-green-300 dark:hover:bg-green-950"
                  onClick={() =>
                    setActiveAction({ reviewId: userReviews[0].id, action: 'approve' })
                  }
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setActiveAction({ reviewId: userReviews[0].id, action: 'request_changes' })
                  }
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Request Changes
                </Button>
              </div>
            )}
          </div>

          {activeAction && (
            <div className="space-y-2">
              <Textarea
                placeholder={
                  activeAction.action === 'approve'
                    ? 'Add approval rationale...'
                    : 'Describe the changes needed...'
                }
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={3}
                className="bg-white dark:bg-background"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitAction}
                  disabled={!rationale.trim() || submitting}
                >
                  {submitting
                    ? 'Submitting...'
                    : activeAction.action === 'approve'
                      ? 'Confirm Approval'
                      : 'Submit Feedback'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActiveAction(null)
                    setRationale('')
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
