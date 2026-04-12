import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { dealsApi } from '../../api'

interface MandateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MandateForm({ open, onOpenChange }: MandateFormProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const mandate = await dealsApi.createMandate({ name: name.trim() })
      onOpenChange(false)
      setName('')
      navigate(`/home/deals/mandates/${mandate.id}`)
    } catch {
      // TODO: surface error to user
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Mandate</DialogTitle>
            <DialogDescription>
              Give your new mandate a name. You can fill in the strategy details after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor="mandate-name">Name</Label>
            <Input
              id="mandate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Growth Equity Fund 2026"
              autoFocus
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
