import { Check, Download, File, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SourceFile } from '../../types'

interface SourceFileViewerProps {
  sourceFile: SourceFile
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SourceFileViewer({ sourceFile }: SourceFileViewerProps) {
  const { fileName, fileUrl, fileType, fileSize, processed, createdAt } = sourceFile

  const isPdf = fileType?.toLowerCase().includes('pdf') ?? false
  const isImage = fileType?.toLowerCase().includes('image') ?? false

  const fileTypeLabel = fileType ? fileType.toUpperCase().replace('APPLICATION/', '').replace('IMAGE/', '') : 'File'

  function handleDownload() {
    window.open(fileUrl, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          {isPdf ? (
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <File className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <span className="text-base font-semibold truncate">{fileName}</span>
        </div>

        <p className="text-sm text-muted-foreground">
          {fileTypeLabel} &bull; {formatFileSize(fileSize)} &bull; Uploaded {formatDate(createdAt)}
        </p>

        <div className="flex items-center gap-2">
          {processed ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              <Check className="h-3 w-3 mr-1" />
              Processed
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
              Pending
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* Viewer */}
      {isPdf ? (
        <div className="flex-1 overflow-hidden">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 rounded"
            title={fileName}
          />
        </div>
      ) : isImage ? (
        <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-center gap-3 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Preview not available for this file type. Use the download button to view.
          </p>
        </div>
      )}
    </div>
  )
}
