import { History, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getAudit, listAudits } from '@/api/auditClient'
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
import type { AuditSummary } from '@/types/audit'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Same thresholds as the scorecard, so a score reads identically in both places. */
function scoreTone(value: number) {
  if (value >= 85) return 'text-success'
  if (value >= 70) return 'text-warning'
  return 'text-destructive'
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { setResult } = useAudit()

  const [audits, setAudits] = useState<AuditSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setAudits(await listAudits())
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load audit history.')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  async function handleOpen(id: number) {
    setBusyId(id)
    try {
      setResult(await getAudit(id))
      navigate('/results')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open that audit.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit history</h1>
        <p className="text-muted-foreground">
          Every audit that has been run, newest first. Open one to see its full scorecard again.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past audits</CardTitle>
          <CardDescription>
            {audits.length} {audits.length === 1 ? 'audit' : 'audits'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : audits.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-3 py-10 text-center text-sm">
              <History className="size-8 opacity-40" />
              <p>No audits yet. Run one from the New Audit page.</p>
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
                    <TableHead className="text-right">Fairness</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead className="text-right">Flagged</TableHead>
                    <TableHead>Run at</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{audit.module_name}</TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${scoreTone(audit.fairness_index)}`}
                      >
                        {audit.fairness_index.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {audit.question_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {audit.warning_count > 0 ? (
                          <Badge variant="destructive">{audit.warning_count}</Badge>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(audit.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === audit.id}
                          onClick={() => void handleOpen(audit.id)}
                        >
                          Open
                        </Button>
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
