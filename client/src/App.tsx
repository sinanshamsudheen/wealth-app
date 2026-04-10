import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { InsightsHomePage } from '@/pages/InsightsHomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { AgentDetailPage } from '@/pages/AgentDetailPage'
import { RunDetailPage } from '@/pages/RunDetailPage'
import { TriggerPage } from '@/pages/TriggerPage'
import { RunsPage } from '@/pages/RunsPage'
import { MeetingBriefPage } from '@/pages/MeetingBriefPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        {/* Home page — platform-level landing */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />
        {/* Insights module — with sidebar layout */}
        <Route
          path="/insights"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<InsightsHomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="meetings/:meetingId" element={<MeetingBriefPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:workflow" element={<AgentDetailPage />} />
          <Route path="agents/:workflow/trigger" element={<TriggerPage />} />
          <Route path="runs" element={<RunsPage />} />
          <Route path="runs/:runId" element={<RunDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
