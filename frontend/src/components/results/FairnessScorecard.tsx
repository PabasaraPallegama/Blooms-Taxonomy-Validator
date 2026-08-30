import { AlertTriangle, CheckCircle2, ListChecks } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AuditResponse } from '@/types/audit'

/** Thresholds mirror the backend's 0.70 warning threshold (backend/app/fairness/engine.py). */
function scoreTone(index: number) {
  if (index >= 85) return { label: 'Well aligned', className: 'text-success' }
  if (index >= 70) return { label: 'Needs review', className: 'text-warning' }
  return { label: 'High risk', className: 'text-destructive' }
}

interface FairnessScorecardProps {
  result: AuditResponse
}

export function FairnessScorecard({ result }: FairnessScorecardProps) {
  const tone = scoreTone(result.fairness_index)
  const allClear = result.warning_count === 0

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="sm:col-span-1">
        <CardContent className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">Fairness Index</p>
          <p className={cn('text-4xl font-semibold tabular-nums', tone.className)}>
            {result.fairness_index.toFixed(1)}%
          </p>
          <p className={cn('text-sm font-medium', tone.className)}>{tone.label}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1">
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <ListChecks className="size-4" />
            Questions audited
          </p>
          <p className="text-4xl font-semibold tabular-nums">{result.question_count}</p>
          <p className="text-muted-foreground text-sm">in {result.module_name}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1">
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            {allClear ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            Flagged
          </p>
          <p
            className={cn(
              'text-4xl font-semibold tabular-nums',
              allClear ? 'text-success' : 'text-destructive',
            )}
          >
            {result.warning_count}
          </p>
          <p className="text-muted-foreground text-sm">
            {allClear
              ? 'No misalignments found'
              : `of ${result.question_count} questions need attention`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
