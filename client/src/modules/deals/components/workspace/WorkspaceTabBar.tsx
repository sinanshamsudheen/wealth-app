import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkspaceTab } from '../../types'

interface WorkspaceTabBarProps {
  tabs: WorkspaceTab[]
  leftTabId: string | null
  rightTabId: string | null
  onTabClick: (tabId: string) => void
  onNewDocument: () => void
}

export function WorkspaceTabBar({
  tabs,
  leftTabId,
  rightTabId,
  onTabClick,
  onNewDocument,
}: WorkspaceTabBarProps) {
  function getIndicator(tabId: string) {
    const isLeft = leftTabId === tabId
    const isRight = rightTabId === tabId
    if (isLeft && isRight) return 'both'
    if (isLeft) return 'left'
    if (isRight) return 'right'
    return 'none'
  }

  return (
    <div className="flex items-center gap-1 border-b px-4 py-1.5 overflow-x-auto shrink-0">
      {tabs.map((tab) => {
        const indicator = getIndicator(tab.id)
        return (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={cn(
              'relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              'hover:bg-muted/60',
              indicator !== 'none' && 'bg-muted/40',
              indicator === 'none' && 'text-muted-foreground',
            )}
          >
            {/* Active indicator bar */}
            {indicator === 'left' && (
              <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-blue-500" />
            )}
            {indicator === 'right' && (
              <span className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-amber-500" />
            )}
            {indicator === 'both' && (
              <>
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-purple-500" />
                <span className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-purple-500" />
              </>
            )}
            <span className="px-1">{tab.label}</span>
          </button>
        )
      })}

      <Button
        variant="ghost"
        size="sm"
        className="ml-auto shrink-0 text-muted-foreground"
        onClick={onNewDocument}
      >
        <Plus className="h-4 w-4 mr-1" />
        New Document
      </Button>
    </div>
  )
}
