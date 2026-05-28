import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { Navbar } from '@/components/layout/Navbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import InputPage from '@/pages/InputPage'
import ResultsPage from '@/pages/ResultsPage'
import DetailPage from '@/pages/DetailPage'
import ComparePage from '@/pages/ComparePage'
import ChatPage from '@/pages/ChatPage'
import ReportPage from '@/pages/ReportPage'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<InputPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/report" element={<ReportPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  )
}

export default App
