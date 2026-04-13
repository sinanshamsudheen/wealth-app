import { useState, useRef, useCallback, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { dealsApi } from '../../api'
import type { Document, DocumentStatus } from '../../types'

interface DocumentPanelProps {
  document: Document
  opportunityId: string
  onUpdate: (doc: Document) => void
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  in_review: { label: 'In Review', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
}

export function DocumentPanel({ document, opportunityId, onUpdate }: DocumentPanelProps) {
  const [name, setName] = useState(document.name)
  const [content, setContent] = useState(document.content ?? '')
  const [editingName, setEditingName] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const saveContent = useCallback(
    async (newContent: string) => {
      setSaveStatus('saving')
      try {
        const updated = await dealsApi.updateDocument(opportunityId, document.id, {
          content: newContent,
        })
        onUpdate(updated)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('idle')
      }
    },
    [opportunityId, document.id, onUpdate],
  )

  function handleContentChange(newContent: string) {
    setContent(newContent)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveContent(newContent)
    }, 2000)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  async function handleNameSave() {
    setEditingName(false)
    if (name === document.name) return
    try {
      const updated = await dealsApi.updateDocument(opportunityId, document.id, { name })
      onUpdate(updated)
    } catch {
      setName(document.name)
    }
  }

  const status = statusConfig[document.status]
  const isReadOnly = document.status === 'approved'

  return (
    <div className="flex flex-col h-full p-4">
      {/* Document header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        {editingName ? (
          <Input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') {
                setName(document.name)
                setEditingName(false)
              }
            }}
            className="h-8 text-base font-semibold max-w-xs"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              if (!isReadOnly) setEditingName(true)
            }}
            className={cn(
              'text-base font-semibold truncate text-left',
              !isReadOnly && 'hover:underline cursor-pointer',
            )}
            title={isReadOnly ? document.name : 'Click to rename'}
          >
            {document.name}
          </button>
        )}

        <Badge variant="secondary" className={cn('shrink-0', status.className)}>
          {status.label}
        </Badge>

        {saveStatus === 'saving' && (
          <span className="text-xs text-muted-foreground ml-auto">Saving...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-emerald-600 ml-auto">Saved</span>
        )}
      </div>

      {/* Document content */}
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        readOnly={isReadOnly}
        placeholder={isReadOnly ? '' : 'Start writing document content...'}
        className={cn(
          'flex-1 resize-none text-sm leading-relaxed font-mono min-h-0',
          isReadOnly && 'opacity-80 cursor-default',
        )}
      />
    </div>
  )
}
