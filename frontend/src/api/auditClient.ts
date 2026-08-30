import axios from 'axios'

import type {
  AuditRequest,
  AuditResponse,
  AuditSummary,
  ExtractedTopic,
  ExtractionResponse,
  ModuleDetail,
  ModuleSummary,
  TopicInput,
} from '@/types/audit'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

/** Normalizes FastAPI error shapes (string detail, or a validation-error array) into one message. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        return Promise.reject(new Error(detail))
      }
      if (Array.isArray(detail)) {
        const message = detail
          .map((d: { msg?: string }) => d.msg ?? 'Invalid input')
          .join('; ')
        return Promise.reject(new Error(message))
      }
      if (!error.response) {
        return Promise.reject(
          new Error(`Cannot reach the backend at ${API_BASE}. Is it running?`),
        )
      }
      return Promise.reject(
        new Error(`Request failed (${error.response.status} ${error.response.statusText})`),
      )
    }
    return Promise.reject(error)
  },
)

export interface HealthStatus {
  reachable: boolean
  aiExtractionConfigured: boolean
}

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const { data } = await api.get<{ ai_extraction_configured?: boolean }>('/health')
    return { reachable: true, aiExtractionConfigured: data.ai_extraction_configured ?? false }
  } catch {
    return { reachable: false, aiExtractionConfigured: false }
  }
}

// --- Syllabus extraction ---

/** Uploads a module document and returns the topics found in it. Nothing is saved yet. */
export async function extractSyllabus(file: File): Promise<ExtractionResponse> {
  const formData = new FormData()
  formData.append('syllabus_doc', file)

  const { data } = await api.post<ExtractionResponse>('/syllabus/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Reading a document with an LLM is slower than the app's other calls.
    timeout: 180_000,
  })
  return data
}

// --- Saved modules ---

export async function saveModule(payload: {
  name: string
  topics: ExtractedTopic[]
  source?: string
  source_filename?: string | null
}): Promise<ModuleDetail> {
  const { data } = await api.post<ModuleDetail>('/modules', payload)
  return data
}

export async function listModules(): Promise<ModuleSummary[]> {
  const { data } = await api.get<ModuleSummary[]>('/modules')
  return data
}

export async function getModule(id: number): Promise<ModuleDetail> {
  const { data } = await api.get<ModuleDetail>(`/modules/${id}`)
  return data
}

export async function deleteModule(id: number): Promise<void> {
  await api.delete(`/modules/${id}`)
}

// --- Audit history ---

export async function listAudits(): Promise<AuditSummary[]> {
  const { data } = await api.get<AuditSummary[]>('/audits')
  return data
}

export async function getAudit(id: number): Promise<AuditResponse> {
  const { data } = await api.get<AuditResponse>(`/audits/${id}`)
  return data
}

export async function postAudit(request: AuditRequest): Promise<AuditResponse> {
  const { data } = await api.post<AuditResponse>('/audit', request)
  return data
}

export async function postAuditUpload(
  moduleName: string,
  topics: TopicInput[],
  examPdf: File,
  moduleId?: number | null,
): Promise<AuditResponse> {
  const formData = new FormData()
  formData.append('module_name', moduleName)
  formData.append('topics_json', JSON.stringify(topics))
  formData.append('exam_pdf', examPdf)
  if (moduleId != null) formData.append('module_id', String(moduleId))

  const { data } = await api.post<AuditResponse>('/audit/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
