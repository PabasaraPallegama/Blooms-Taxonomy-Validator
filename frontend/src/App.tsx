import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuditProvider } from '@/context/AuditContext'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AuditProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuditProvider>
    </BrowserRouter>
  )
}
