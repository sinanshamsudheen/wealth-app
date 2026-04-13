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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dealsApi } from '../../api'

interface ShareDialogProps {
  documentId: string
  documentName: string
  onClose: () => void
}

export function ShareDialog({ documentId, documentName, onClose }: ShareDialogProps) {
  const [userIdsInput, setUserIdsInput] = useState('')
  const [permission, setPermission] = useState<'comment' | 'view'>('view')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    const userIds = userIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (userIds.length === 0) return

    setSubmitting(true)
    try {
      await dealsApi.shareDocument(documentId, {
        sharedWith: userIds,
        permission,
      })
      onClose()
    } catch {
      // Error handling will be improved when toast notifications are added
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    userIdsInput.trim().length > 0 && !submitting

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share <span className="font-medium text-foreground">{documentName}</span> with
            team members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User IDs */}
          <div className="space-y-2">
            <Label htmlFor="share-users">Team Members</Label>
            <Input
              id="share-users"
              placeholder="Enter user IDs, separated by commas"
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A proper user picker will replace this in a future release.
            </p>
          </div>

          {/* Permission */}
          <div className="space-y-2">
            <Label>Permission</Label>
            <Select value={permission} onValueChange={(val) => setPermission(val as 'comment' | 'view')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View only</SelectItem>
                <SelectItem value="comment">Can comment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
