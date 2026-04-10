import { useThemeStore } from '@/store/useThemeStore'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = 'Loading...', fullScreen = true }: LoadingScreenProps) {
  const theme = useThemeStore((s) => s.theme)
  const src = theme === 'dark' ? '/logo_white_clean.png' : '/logo_black_clean.png'

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      fullScreen && 'h-screen w-full bg-background'
    )}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-[-12px] rounded-full border-2 border-transparent border-t-primary/40 animate-spin" />
        {/* Logo with pulse */}
        <img
          src={src}
          alt="Invictus"
          className="h-14 w-14 object-contain animate-pulse"
        />
      </div>
      <p className="text-xs text-muted-foreground animate-pulse">{message}</p>
    </div>
  )
}
