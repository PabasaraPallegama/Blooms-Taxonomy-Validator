import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AboutPage } from '@/pages/AboutPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ModulesPage } from '@/pages/ModulesPage'
import { NewAuditPage } from '@/pages/NewAuditPage'
import { ResultsPage } from '@/pages/ResultsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<NewAuditPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
