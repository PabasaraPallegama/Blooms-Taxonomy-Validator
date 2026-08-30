import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BLOOM_LEVELS, type CognitiveDistribution } from '@/types/audit'

interface CognitiveRadarChartProps {
  distribution: CognitiveDistribution
}

export function CognitiveRadarChart({ distribution }: CognitiveRadarChartProps) {
  const data = BLOOM_LEVELS.map((level, i) => ({
    level,
    Exam: distribution.actual[i] ?? 0,
    Syllabus: distribution.required[i] ?? 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cognitive Distribution</CardTitle>
        <CardDescription>
          Where the exam's questions actually sit on Bloom's Taxonomy, against the levels the
          syllabus asks for.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="level"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <PolarRadiusAxis
                allowDecimals={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                stroke="var(--border)"
              />
              <Radar
                name="Exam questions"
                dataKey="Exam"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.25}
              />
              <Radar
                name="Syllabus requirement"
                dataKey="Syllabus"
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="var(--chart-2)"
                fillOpacity={0.2}
              />
              <Legend
                wrapperStyle={{ fontSize: 13, color: 'var(--muted-foreground)' }}
                iconType="plainline"
              />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <table className="mt-4 w-full text-sm">
          <caption className="text-muted-foreground mb-2 text-left text-xs">
            Question counts per Bloom's level
          </caption>
          <thead>
            <tr className="text-muted-foreground border-b text-xs">
              <th scope="col" className="py-1.5 text-left font-medium">
                Level
              </th>
              {BLOOM_LEVELS.map((level) => (
                <th key={level} scope="col" className="py-1.5 text-right font-medium">
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <th scope="row" className="py-1.5 text-left font-normal">
                Exam
              </th>
              {distribution.actual.map((count, i) => (
                <td key={i} className="py-1.5 text-right tabular-nums">
                  {count}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="py-1.5 text-left font-normal">
                Syllabus
              </th>
              {distribution.required.map((count, i) => (
                <td key={i} className="py-1.5 text-right tabular-nums">
                  {count}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
