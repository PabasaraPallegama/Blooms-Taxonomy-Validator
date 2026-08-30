import { AlertTriangle, FileUp, Loader2, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { extractSyllabus } from '@/api/auditClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExtractedTopic } from '@/types/audit'

const ACCEPTED = '.pptx,.docx,.pdf,.txt,.md'

interface SyllabusImportProps {
  /** Called with the extracted topics once the document has been read. */
  onExtracted: (moduleName: string, topics: ExtractedTopic[], filename: string) => void
  /** From GET /health — when false, extraction is unavailable and we say why up front. */
  aiConfigured: boolean
}

export function SyllabusImport({ onExtracted, aiConfigured }: SyllabusImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [filename, setFilename] = useState<string | null>(null)

  async function handleFile(file: File) {
    setFilename(file.name)
    setIsExtracting(true)
    try {
      const result = await extractSyllabus(file)

      if (result.topics.length === 0) {
        toast.error("No learning outcomes found in that document. Try adding topics manually.")
        return
      }

      onExtracted(result.module_name, result.topics, result.source_filename)

      if (result.needs_review_count > 0) {
        toast.warning(
          `Found ${result.topics.length} topics. ${result.needs_review_count} had no stated Bloom's level — please check those.`,
        )
      } else {
        toast.success(`Found ${result.topics.length} topics, all with stated levels.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not read that document.')
    } finally {
      setIsExtracting(false)
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Import from a module document
        </CardTitle>
        <CardDescription>
          Upload a module descriptor, lecture deck, or handbook and the learning outcomes will be
          read out of it. You review everything before it's saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isExtracting || !aiConfigured}
          >
            {isExtracting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reading document…
              </>
            ) : (
              <>
                <FileUp className="size-4" />
                Choose document
              </>
            )}
          </Button>

          {filename && !isExtracting && (
            <span className="text-muted-foreground text-sm">{filename}</span>
          )}
          <span className="text-muted-foreground text-xs">PPTX, DOCX, PDF, TXT</span>
        </div>

        {!aiConfigured && (
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Document import needs an <code>ANTHROPIC_API_KEY</code> in{' '}
              <code>backend/.env</code>. You can still add topics by hand below.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
