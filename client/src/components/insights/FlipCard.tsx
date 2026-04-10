import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FlipCardProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
}

export function FlipCard({ front, back, className }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={cn('group cursor-pointer [perspective:1000px]', className)}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={cn(
          'relative h-full w-full preserve-3d transition-transform duration-500 ease-out',
          flipped ? 'rotate-y-180' : 'group-hover:rotate-y-180'
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          {front}
        </div>
        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          {back}
        </div>
      </div>
    </div>
  )
}
