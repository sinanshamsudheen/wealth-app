import { Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SendEmailDialogProps {
  onClose: () => void
}

export function SendEmailDialog({ onClose }: SendEmailDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send via Email</DialogTitle>
          <DialogDescription>
            Email sending will be available when Gmail integration is configured.
            This feature is coming in Phase 3.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
