import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import type { AuditResponse, ExtractedTopic } from '@/types/audit'

interface AuditContextValue {
  result: AuditResponse | null
  setResult: (result: AuditResponse | null) => void
  moduleName: string
  setModuleName: (name: string) => void
  topics: ExtractedTopic[]
  setTopics: (topics: ExtractedTopic[]) => void
  /** Set when the syllabus came from (or was saved to) a stored module, so audits link to it. */
  moduleId: number | null
  setModuleId: (id: number | null) => void
  /** Filename the topics were extracted from, carried through to the saved module. */
  sourceFilename: string | null
  setSourceFilename: (name: string | null) => void
}

const AuditContext = createContext<AuditContextValue | null>(null)

export const EMPTY_TOPIC: ExtractedTopic = {
  name: '',
  description: '',
  required_bloom_level: 3,
  level_stated_in_document: true,
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AuditResponse | null>(null)
  const [moduleName, setModuleName] = useState('')
  const [topics, setTopics] = useState<ExtractedTopic[]>([{ ...EMPTY_TOPIC }])
  const [moduleId, setModuleId] = useState<number | null>(null)
  const [sourceFilename, setSourceFilename] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      result,
      setResult,
      moduleName,
      setModuleName,
      topics,
      setTopics,
      moduleId,
      setModuleId,
      sourceFilename,
      setSourceFilename,
    }),
    [result, moduleName, topics, moduleId, sourceFilename],
  )

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
}

export function useAudit() {
  const context = useContext(AuditContext)
  if (!context) throw new Error('useAudit must be used within an AuditProvider')
  return context
}
