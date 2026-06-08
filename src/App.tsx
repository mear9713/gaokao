import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'
import { RouteProgress } from '@/components/ui/route-progress'
import { RequireAuth } from '@/components/auth/RequireAuth'
import InputPage from '@/pages/InputPage'
import ResultsPage from '@/pages/ResultsPage'
import DetailPage from '@/pages/DetailPage'
import ComparePage from '@/pages/ComparePage'
import ChatPage from '@/pages/ChatPage'
import ReportPage from '@/pages/ReportPage'
import LoginPage from '@/pages/LoginPage'
import AdminKbPage from '@/pages/AdminKbPage'
import AdminAIConfigPage from '@/pages/AdminAIConfigPage'

function Layout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <RouteProgress />
      <Navbar />
      <main className="flex-1">
        {/* key 变化触发重新挂载 + fade-in 动画 */}
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Routes>
              <Route element={<Layout />}>
                {/* 公开路由：登录页 */}
                <Route path="/login" element={<LoginPage />} />

                {/* 学生 / 管理员都可访问的功能页 */}
                <Route
                  path="/"
                  element={
                    <RequireAuth role={['student', 'admin']}>
                      <InputPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/results"
                  element={
                    <RequireAuth role={['student', 'admin']}>
                      <ResultsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/detail/:id"
                  element={
                    <RequireAuth role={['student', 'admin']}>
                      <DetailPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/compare"
                  element={
                    <RequireAuth role={['student', 'admin']}>
                      <ComparePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <RequireAuth role={['student', 'admin']}>
                      <ChatPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <RequireAuth role={['student', 'admin']}>
                      <ReportPage />
                    </RequireAuth>
                  }
                />

                {/* 仅管理员可访问 */}
                <Route
                  path="/admin/kb"
                  element={
                    <RequireAuth role="admin">
                      <AdminKbPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/ai-api"
                  element={
                    <RequireAuth role="admin">
                      <AdminAIConfigPage />
                    </RequireAuth>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
