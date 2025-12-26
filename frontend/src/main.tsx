import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.tsx'
import ProblemPage from './components/ProblemPage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import CategoryOrderPage from './pages/CategoryOrderPage.tsx'
import ProblemOrderPage from './pages/ProblemOrderPage.tsx'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ToastProvider'
// Export useToast for use throughout application
export { useToast } from './context/ToastContext'

// Initialize admin token generator (accessible via console)
import './utils/adminToken'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/problem/:slug" element={<ProblemPage />} />
              {/* Hidden admin route - no navigation links */}
              <Route path="/access-admin" element={<AdminPage />} />
              {/* Admin sub-pages for order management */}
              <Route path="/admin/category-order" element={<CategoryOrderPage />} />
              <Route path="/admin/problem-order" element={<ProblemOrderPage />} />
              {/* Redirect /admin to /access-admin */}
              <Route path="/admin" element={<Navigate to="/access-admin" replace />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  </StrictMode>,
)

