import { FileText, Upload, X } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type InputMode = 'text' | 'pdf'

interface ExamPaperInputProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  text: string
  onTextChange: (text: string) => void
  file: File | null
  onFileChange: (file: File | null) => void
}

export function ExamPaperInput({
  mode,
  onModeChange,
  text,
  onTextChange,
  file,
  onFileChange,
}: ExamPaperInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <div className="bg-muted inline-flex rounded-lg p-1">
        {(['text', 'pdf'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onModeChange(option)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === option
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option === 'text' ? 'Paste text' : 'Upload PDF'}
          </button>
        ))}
      </div>

      {mode === 'text' ? (
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={10}
          placeholder={
            'Paste the exam paper text here, one question per numbered item:\n\n1. Define normalization in relational databases.\n2. Analyze why a schema in 2NF may still show update anomalies.'
          }
          className="font-mono text-sm"
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileText className="text-muted-foreground size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onFileChange(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                aria-label="Remove selected file"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:border-ring hover:bg-muted/50 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-8 transition-colors"
            >
              <Upload className="text-muted-foreground size-6" />
              <span className="text-sm font-medium">Choose a PDF exam paper</span>
              <span className="text-muted-foreground text-xs">
                Text-layer PDFs only — scanned images need OCR, which isn't wired up yet
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
