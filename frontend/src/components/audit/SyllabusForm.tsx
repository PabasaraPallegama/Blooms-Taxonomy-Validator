import { Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPTY_TOPIC } from '@/context/AuditContext'
import { BLOOM_LEVELS, type ExtractedTopic } from '@/types/audit'

interface SyllabusFormProps {
  topics: ExtractedTopic[]
  onChange: (topics: ExtractedTopic[]) => void
}

export function SyllabusForm({ topics, onChange }: SyllabusFormProps) {
  function updateTopic(index: number, patch: Partial<ExtractedTopic>) {
    onChange(topics.map((topic, i) => (i === index ? { ...topic, ...patch } : topic)))
  }

  function addTopic() {
    onChange([...topics, { ...EMPTY_TOPIC }])
  }

  function removeTopic(index: number) {
    onChange(topics.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {topics.map((topic, index) => {
        const needsReview = !topic.level_stated_in_document
        return (
          <div
            key={index}
            className={
              needsReview
                ? 'border-warning/60 bg-warning/5 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto_auto]'
                : 'bg-muted/30 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto_auto]'
            }
          >
            {topic.outcome_text && (
              <div className="text-muted-foreground sm:col-span-4 text-xs">
                <span className="font-medium">From outcome:</span> {topic.outcome_text}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`topic-name-${index}`}>Topic name</Label>
              <Input
                id={`topic-name-${index}`}
                value={topic.name}
                placeholder="e.g. Normalization"
                onChange={(e) => updateTopic(index, { name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`topic-desc-${index}`}>Description</Label>
              <Input
                id={`topic-desc-${index}`}
                value={topic.description}
                placeholder="Keywords that describe this topic"
                onChange={(e) => updateTopic(index, { description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor={`topic-level-${index}`}>Required level</Label>
                {needsReview && (
                  <Badge variant="outline" className="text-warning border-warning/50 text-[10px]">
                    inferred
                  </Badge>
                )}
              </div>
              <Select
                value={String(topic.required_bloom_level)}
                onValueChange={(value) =>
                  // Confirming or changing an inferred level clears the review flag.
                  updateTopic(index, {
                    required_bloom_level: Number(value),
                    level_stated_in_document: true,
                  })
                }
              >
                <SelectTrigger id={`topic-level-${index}`} className="sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOM_LEVELS.map((level, i) => (
                    <SelectItem key={level} value={String(i + 1)}>
                      {i + 1}. {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTopic(index)}
                disabled={topics.length === 1}
                aria-label={`Remove topic ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        )
      })}

      <Button variant="outline" size="sm" onClick={addTopic}>
        <Plus className="size-4" />
        Add topic
      </Button>
    </div>
  )
}
