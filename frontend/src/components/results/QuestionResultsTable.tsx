import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { BLOOM_LEVELS, type QuestionResult, type QuestionStatus } from '@/types/audit'

const STATUS_META: Record<
  QuestionStatus,
  { label: string; variant: 'success' | 'destructive' | 'warning'; Icon: typeof CheckCircle2 }
> = {
  ALIGNED: { label: 'Aligned', variant: 'success', Icon: CheckCircle2 },
  MISALIGNED: { label: 'Misaligned', variant: 'destructive', Icon: AlertTriangle },
  OUT_OF_BOUNDS: { label: 'Out of bounds', variant: 'warning', Icon: HelpCircle },
}

function levelLabel(level: number | null) {
  if (level === null) return '—'
  return `${level}. ${BLOOM_LEVELS[level - 1] ?? 'Unknown'}`
}

interface QuestionResultsTableProps {
  questions: QuestionResult[]
}

export function QuestionResultsTable({ questions }: QuestionResultsTableProps) {
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false)
  const visible = showOnlyFlagged ? questions.filter((q) => q.warning) : questions

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Question breakdown</CardTitle>
          <CardDescription>
            Each question's predicted level against what its matched syllabus topic requires.
          </CardDescription>
        </div>
        <label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyFlagged}
            onChange={(e) => setShowOnlyFlagged(e.target.checked)}
            className="accent-primary size-4"
          />
          Flagged only
        </label>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Question</TableHead>
              <TableHead>Predicted</TableHead>
              <TableHead>Matched topic</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="text-right">Alignment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((question, index) => {
              const meta = STATUS_META[question.status]
              return (
                <TableRow key={index}>
                  <TableCell>
                    <p className="line-clamp-3 text-sm">{question.question}</p>
                    {question.warning && (
                      <p className="text-muted-foreground mt-1.5 text-xs">{question.reason}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {levelLabel(question.predicted_level)}
                    <span className="text-muted-foreground block text-xs">
                      {(question.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {question.matched_topic ?? (
                      <span className="text-muted-foreground">No match</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {levelLabel(question.required_level)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-sm tabular-nums',
                      question.warning && 'text-destructive font-medium',
                    )}
                  >
                    {(question.alignment_score * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>
                      <meta.Icon className="size-3" />
                      {meta.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {visible.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No flagged questions — every question aligns with its syllabus topic.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
