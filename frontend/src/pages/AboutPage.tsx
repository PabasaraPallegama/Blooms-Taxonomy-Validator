import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BLOOM_LEVELS } from '@/types/audit'

const PIPELINE = [
  {
    step: 'Ingestion',
    detail:
      'The exam paper is read from pasted text or a PDF text layer, then split into individual questions on numbered items.',
  },
  {
    step: 'Cognitive classification',
    detail:
      'A Bidirectional LSTM predicts which of the six Revised Bloom’s Taxonomy levels each question tests.',
  },
  {
    step: 'Topic matching',
    detail:
      'TF-IDF cosine similarity maps every question to the syllabus topic it most likely belongs to. A question that matches nothing is flagged out of bounds.',
  },
  {
    step: 'Fairness audit',
    detail:
      'Each predicted level is compared against the level its topic requires. Alignment below 0.70 raises a warning, and the mean across all questions becomes the Fairness Index.',
  },
]

export function AboutPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">About this system</h1>
        <p className="text-muted-foreground">
          An automated pedagogical guardrail: it checks whether an exam paper actually tests the
          cognitive levels its syllabus promises.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How an audit works</CardTitle>
          <CardDescription>Four stages, from raw paper to scorecard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PIPELINE.map((item, index) => (
            <div key={item.step} className="flex gap-4">
              <span className="bg-secondary text-secondary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                {index + 1}
              </span>
              <div className="space-y-0.5">
                <p className="font-medium">{item.step}</p>
                <p className="text-muted-foreground text-sm">{item.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revised Bloom's Taxonomy</CardTitle>
          <CardDescription>
            Lower-order recall through to higher-order creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-2 sm:grid-cols-2">
            {BLOOM_LEVELS.map((level, i) => (
              <li key={level} className="flex items-center gap-3 rounded-md border p-3">
                <span className="text-muted-foreground text-sm tabular-nums">{i + 1}</span>
                <span className="text-sm font-medium">{level}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interpreting the score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The Fairness Index is a decision-support metric, not a verdict. The system raises
            warnings; it never rejects a paper. Final pedagogical judgment rests with the
            educator.
          </p>
          <Separator />
          <p className="text-muted-foreground">
            Bloom's-level classification is inherently subjective — even human experts disagree on
            borderline questions. Treat a flagged question as a prompt to review, not proof of a
            defect.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
