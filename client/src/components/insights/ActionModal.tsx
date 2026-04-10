import { useState } from 'react'
import { Calendar, ClipboardList, Mail, CheckCircle2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ActionModalContext } from '@/api/types'

interface ActionModalProps {
  context: ActionModalContext
  onClose: () => void
}

const MODAL_CONFIG = {
  schedule_meeting: {
    icon: Calendar,
    title: 'Schedule a Meeting',
    description: 'Set up a meeting with your client',
  },
  create_task: {
    icon: ClipboardList,
    title: 'Create a Task',
    description: 'Create a follow-up task',
  },
  send_email: {
    icon: Mail,
    title: 'Send an Email',
    description: 'Compose and send an email to your client',
  },
} as const

export function ActionModal({ context, onClose }: ActionModalProps) {
  const [submitted, setSubmitted] = useState(false)

  if (!context.type) return null

  const config = MODAL_CONFIG[context.type]
  const Icon = config.icon

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 1200)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSubmitted(false)
      onClose()
    }
  }

  return (
    <Dialog open={!!context.type} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {context.type === 'schedule_meeting' && 'Meeting scheduled successfully'}
              {context.type === 'create_task' && 'Task created successfully'}
              {context.type === 'send_email' && 'Email sent successfully'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <Icon className="h-4.5 w-4.5 text-foreground/70" />
                {config.title}
              </DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Schedule Meeting */}
              {context.type === 'schedule_meeting' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="client" className="text-xs font-medium">Client</Label>
                    <Input id="client" defaultValue={context.clientName || ''} placeholder="e.g. Al-Rashidi Family" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="attendees" className="text-xs font-medium">Attendees</Label>
                    <Input id="attendees" placeholder="e.g. ahmed@alrashidi-fo.com, sarah.chen@invictus-ai.com" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs font-medium">Date</Label>
                      <Input id="date" type="date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="time" className="text-xs font-medium">Time</Label>
                      <Input id="time" type="time" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="duration" className="text-xs font-medium">Duration</Label>
                      <Input id="duration" placeholder="30 min" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agenda" className="text-xs font-medium">Agenda / Notes</Label>
                    <Textarea id="agenda" defaultValue={context.prefillDescription || ''} placeholder="Meeting agenda or talking points..." rows={3} />
                  </div>
                </>
              )}

              {/* Create Task */}
              {context.type === 'create_task' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="assignee" className="text-xs font-medium">Assign To</Label>
                    <Input id="assignee" defaultValue={context.clientName || ''} placeholder="e.g. James Wilson, Internal Team" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-medium">Title</Label>
                    <Input id="title" defaultValue={context.prefillSubject || ''} placeholder="e.g. Review client portfolio allocation" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                    <Textarea
                      id="description"
                      defaultValue={context.prefillDescription || ''}
                      placeholder="Detailed description of the task..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-xs font-medium">Priority</Label>
                      <Input id="priority" placeholder="High / Medium / Low" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="due-date" className="text-xs font-medium">Due Date</Label>
                      <Input id="due-date" type="date" />
                    </div>
                  </div>
                </>
              )}

              {/* Send Email */}
              {context.type === 'send_email' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="to" className="text-xs font-medium">To</Label>
                    <Input id="to" type="email" defaultValue={context.prefillTo || ''} placeholder="e.g. ahmed@alrashidi-fo.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs font-medium">Subject</Label>
                    <Input id="subject" defaultValue={context.prefillSubject || ''} placeholder="Email subject line" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="body" className="text-xs font-medium">Body</Label>
                    <Textarea
                      id="body"
                      defaultValue={context.prefillDescription || ''}
                      placeholder="Compose your email..."
                      rows={8}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">
                {context.type === 'schedule_meeting' && 'Schedule Meeting'}
                {context.type === 'create_task' && 'Create Task'}
                {context.type === 'send_email' && 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
