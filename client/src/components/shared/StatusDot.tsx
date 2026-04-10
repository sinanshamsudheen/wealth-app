import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'running' | 'complete' | 'failed' | 'pending' | 'awaiting_review'
  className?: string
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full shrink-0',
        status === 'running' && 'bg-blue-500 animate-pulse',
        status === 'complete' && 'bg-emerald-500',
        status === 'failed' && 'bg-red-500',
        status === 'pending' && 'bg-gray-400',
        status === 'awaiting_review' && 'bg-amber-500 animate-pulse',
        className
      )}
    />
  )
}
