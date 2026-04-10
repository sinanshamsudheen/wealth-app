import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { ModulesHomePage } from '@/pages/ModulesHomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { AgentDetailPage } from '@/pages/AgentDetailPage'
import { RunDetailPage } from '@/pages/RunDetailPage'
import { TriggerPage } from '@/pages/TriggerPage'
import { RunsPage } from '@/pages/RunsPage'
import { MeetingBriefPage } from '@/pages/MeetingBriefPage'
import { ChatPage } from '@/pages/ChatPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/home" replace />
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
        {/* Main app — with sidebar layout */}
        <Route
          path="/home"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<ModulesHomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="meetings/:meetingId" element={<MeetingBriefPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:workflow" element={<AgentDetailPage />} />
          <Route path="agents/:workflow/trigger" element={<TriggerPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="runs" element={<RunsPage />} />
          <Route path="runs/:runId" element={<RunDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
