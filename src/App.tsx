import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth-context'
import { MainLayout } from './components/layout/MainLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { LeadsPage } from './pages/LeadsPage'
import { CompanyPage } from './pages/CompanyPage'
import { SearchPage } from './pages/SearchPage'
import { PipelinePage } from './pages/PipelinePage'
import { CampaignsPage } from './pages/CampaignsPage'
import { ReportsPage } from './pages/ReportsPage'
import { InboxPage } from './pages/InboxPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminPage } from './pages/AdminPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
              <Route index element={<DashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/:id" element={<CompanyPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="campaigns/new" element={<CampaignsPage />} />
              <Route path="campaigns/:id" element={<CampaignsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
            </Route>
          </Routes>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  )
}
