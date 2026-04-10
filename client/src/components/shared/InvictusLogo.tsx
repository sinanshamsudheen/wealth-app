import { useThemeStore } from '@/store/useThemeStore'
import { cn } from '@/lib/utils'

interface InvictusLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

const SIZES = {
  xs: 'h-5 w-5',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
}

export function InvictusLogo({ size = 'md', className, animated = false }: InvictusLogoProps) {
  const theme = useThemeStore((s) => s.theme)
  const src = theme === 'dark' ? '/logo_white_clean.png' : '/logo_black_clean.png'

  return (
    <img
      src={src}
      alt="Invictus"
      className={cn(
        SIZES[size],
        'object-contain',
        animated && 'animate-pulse',
        className
      )}
    />
  )
}
