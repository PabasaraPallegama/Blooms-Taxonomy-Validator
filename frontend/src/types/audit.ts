/** Mirrors backend/app/schemas.py — keep in sync by hand. */

export const BLOOM_LEVELS = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
] as const

export type BloomLevelName = (typeof BLOOM_LEVELS)[number]

export interface TopicInput {
  id?: string | null
  name: string
  description: string
  required_bloom_level: number
}

export interface AuditRequest {
  module_name: string
  topics: TopicInput[]
  exam_paper_text: string
  module_id?: number | null
}

/** A topic as extracted from a document, before a human has confirmed it. */
export interface ExtractedTopic {
  name: string
  description: string
  outcome_text?: string | null
  required_bloom_level: number
  /** False when the level was inferred from the outcome's verb — needs human review. */
  level_stated_in_document: boolean
}

export interface ExtractionResponse {
  module_name: string
  topics: ExtractedTopic[]
  source_filename: string
  needs_review_count: number
}

export interface SavedTopic extends ExtractedTopic {
  id: number
}

export interface ModuleSummary {
  id: number
  name: string
  source: string
  source_filename: string | null
  created_at: string
  topic_count: number
}

export interface ModuleDetail {
  id: number
  name: string
  source: string
  source_filename: string | null
  created_at: string
  topics: SavedTopic[]
}

export interface AuditSummary {
  id: number
  module_id: number | null
  module_name: string
  fairness_index: number
  question_count: number
  warning_count: number
  source_filename: string | null
  created_at: string
}

export type QuestionStatus = 'ALIGNED' | 'MISALIGNED' | 'OUT_OF_BOUNDS'

export interface QuestionResult {
  question: string
  predicted_level: number
  predicted_level_name: string
  confidence: number
  matched_topic: string | null
  topic_match_similarity?: number | null
  required_level: number | null
  alignment_score: number
  status: QuestionStatus
  warning: boolean
  reason: string
}

export interface CognitiveDistribution {
  actual: number[]
  required: number[]
}

export interface AuditResponse {
  module_name: string
  fairness_index: number
  question_count: number
  warning_count: number
  questions: QuestionResult[]
  cognitive_distribution: CognitiveDistribution
  audit_id?: number | null
}
