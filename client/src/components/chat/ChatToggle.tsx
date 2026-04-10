import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/useChatStore'

export function ChatToggle() {
  const { toggle, isOpen } = useChatStore()

  if (isOpen) return null

  return (
    <Button
      onClick={toggle}
      size="icon"
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40"
    >
      <MessageSquare className="h-5 w-5" />
    </Button>
  )
}
