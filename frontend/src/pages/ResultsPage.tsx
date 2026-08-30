import { ArrowLeft, FileSearch } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CognitiveRadarChart } from '@/components/results/CognitiveRadarChart'
import { FairnessScorecard } from '@/components/results/FairnessScorecard'
import { QuestionResultsTable } from '@/components/results/QuestionResultsTable'
import { Button } from '@/components/ui/button'
import { useAudit } from '@/context/AuditContext'

export function ResultsPage() {
  const { result } = useAudit()

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <FileSearch className="text-muted-foreground size-10" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">No audit results yet</h1>
          <p className="text-muted-foreground max-w-md text-sm">
            Run an audit to see the Fairness Index, the cognitive distribution, and the
            per-question breakdown.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="size-4" />
            Start an audit
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Fairness scorecard</h1>
          <p className="text-muted-foreground">{result.module_name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" />
            New audit
          </Link>
        </Button>
      </div>

      <FairnessScorecard result={result} />
      <CognitiveRadarChart distribution={result.cognitive_distribution} />
      <QuestionResultsTable questions={result.questions} />
    </div>
  )
}
