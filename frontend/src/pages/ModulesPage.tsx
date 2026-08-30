import { FileText, FolderOpen, Loader2, PencilLine, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { deleteModule, getModule, listModules } from '@/api/auditClient'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAudit } from '@/context/AuditContext'
import type { ModuleSummary } from '@/types/audit'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function ModulesPage() {
  const navigate = useNavigate()
  const { setModuleName, setTopics, setModuleId, setSourceFilename } = useAudit()

  const [modules, setModules] = useState<ModuleSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setModules(await listModules())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load saved modules.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleLoad(id: number) {
    setBusyId(id)
    try {
      const module = await getModule(id)
      setModuleName(module.name)
      setTopics(
        module.topics.map((t) => ({
          name: t.name,
          description: t.description,
          outcome_text: t.outcome_text,
          required_bloom_level: t.required_bloom_level,
          level_stated_in_document: t.level_stated_in_document,
        })),
      )
      setModuleId(module.id)
      setSourceFilename(module.source_filename)
      toast.success(`Loaded "${module.name}".`)
      navigate('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load that module.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(module: ModuleSummary) {
    if (
      !window.confirm(
        `Delete "${module.name}"? Its saved audits will be removed too. This can't be undone.`,
      )
    ) {
      return
    }
    setBusyId(module.id)
    try {
      await deleteModule(module.id)
      toast.success(`Deleted "${module.name}".`)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete that module.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Saved syllabi</h1>
        <p className="text-muted-foreground">
          Load a stored module to audit another paper against it, without re-entering the topics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            {modules.length} saved {modules.length === 1 ? 'module' : 'modules'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : modules.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-3 py-10 text-center text-sm">
              <FolderOpen className="size-8 opacity-40" />
              <p>
                Nothing saved yet. Build a syllabus on the New Audit page and press
                &ldquo;Save syllabus&rdquo;.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                Go to New Audit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Saved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell>{module.topic_count}</TableCell>
                      <TableCell>
                        {module.source === 'extracted' ? (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="size-3" />
                            {module.source_filename ?? 'document'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <PencilLine className="size-3" />
                            manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(module.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === module.id}
                            onClick={() => void handleLoad(module.id)}
                          >
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={busyId === module.id}
                            onClick={() => void handleDelete(module)}
                            aria-label={`Delete ${module.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
