import { Loader2, Play, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { checkHealth, postAudit, postAuditUpload, saveModule } from '@/api/auditClient'
import { ExamPaperInput, type InputMode } from '@/components/audit/ExamPaperInput'
import { SyllabusForm } from '@/components/audit/SyllabusForm'
import { SyllabusImport } from '@/components/audit/SyllabusImport'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAudit } from '@/context/AuditContext'
import type { ExtractedTopic } from '@/types/audit'

export function NewAuditPage() {
  const navigate = useNavigate()
  const {
    moduleName,
    setModuleName,
    topics,
    setTopics,
    setResult,
    moduleId,
    setModuleId,
    sourceFilename,
    setSourceFilename,
  } = useAudit()

  const [mode, setMode] = useState<InputMode>('text')
  const [examText, setExamText] = useState('')
  const [examFile, setExamFile] = useState<File | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiConfigured, setAiConfigured] = useState(false)

  useEffect(() => {
    void checkHealth().then((health) => setAiConfigured(health.aiExtractionConfigured))
  }, [])

  function handleExtracted(name: string, extracted: ExtractedTopic[], filename: string) {
    if (name) setModuleName(name)
    setTopics(extracted)
    setSourceFilename(filename)
    // These topics aren't the saved module any more — they're a fresh, unsaved import.
    setModuleId(null)
  }

  const namedTopics = topics.filter((t) => t.name.trim())
  const needsReviewCount = namedTopics.filter((t) => !t.level_stated_in_document).length

  async function handleSaveModule() {
    if (namedTopics.length === 0) {
      toast.error('Add at least one topic with a name before saving.')
      return
    }
    setIsSaving(true)
    try {
      const saved = await saveModule({
        name: moduleName.trim() || 'Untitled Module',
        topics: namedTopics,
        source: sourceFilename ? 'extracted' : 'manual',
        source_filename: sourceFilename,
      })
      setModuleId(saved.id)
      toast.success(`Saved "${saved.name}" with ${saved.topics.length} topics.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the module.')
    } finally {
      setIsSaving(false)
    }
  }

  async function runAudit() {
    if (namedTopics.length === 0) {
      toast.error('Add at least one syllabus topic with a name.')
      return
    }
    if (mode === 'text' && !examText.trim()) {
      toast.error('Paste the exam paper text, or switch to PDF upload.')
      return
    }
    if (mode === 'pdf' && !examFile) {
      toast.error('Choose a PDF exam paper to upload.')
      return
    }

    const name = moduleName.trim() || 'Untitled Module'
    const topicPayload = namedTopics.map((t) => ({
      name: t.name,
      description: t.description,
      required_bloom_level: t.required_bloom_level,
    }))

    setIsRunning(true)
    try {
      const result =
        mode === 'pdf'
          ? await postAuditUpload(name, topicPayload, examFile as File, moduleId)
          : await postAudit({
              module_name: name,
              topics: topicPayload,
              exam_paper_text: examText,
              module_id: moduleId,
            })

      if (result.question_count === 0) {
        toast.error('No questions were found in that exam paper. Check the formatting.')
        return
      }

      setResult(result)
      toast.success(`Audited ${result.question_count} questions.`)
      navigate('/results')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The audit failed.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">New audit</h1>
        <p className="text-muted-foreground">
          Define the syllabus, add the exam paper, and check whether the questions test what the
          module actually promises.
        </p>
      </div>

      <SyllabusImport onExtracted={handleExtracted} aiConfigured={aiConfigured} />

      <Card>
        <CardHeader>
          <CardTitle>1. Module &amp; syllabus</CardTitle>
          <CardDescription>
            Each topic carries the Bloom's level the syllabus expects it to be tested at.
            {needsReviewCount > 0 && (
              <span className="text-warning ml-1 font-medium">
                {needsReviewCount} level{needsReviewCount === 1 ? '' : 's'} inferred from the
                document — confirm before relying on the result.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="module-name">Module name</Label>
            <Input
              id="module-name"
              value={moduleName}
              placeholder="e.g. Database Systems II"
              onChange={(e) => setModuleName(e.target.value)}
            />
          </div>

          <SyllabusForm topics={topics} onChange={setTopics} />

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSaveModule} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save syllabus
                </>
              )}
            </Button>
            {moduleId !== null && (
              <span className="text-muted-foreground text-sm">
                Saved — audits will be linked to this module.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Exam paper</CardTitle>
          <CardDescription>
            Questions are split on numbered items such as <code>1.</code>, <code>2)</code>, or{' '}
            <code>Q3.</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamPaperInput
            mode={mode}
            onModeChange={setMode}
            text={examText}
            onTextChange={setExamText}
            file={examFile}
            onFileChange={setExamFile}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={runAudit} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Auditing…
            </>
          ) : (
            <>
              <Play className="size-4" />
              Run audit
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
