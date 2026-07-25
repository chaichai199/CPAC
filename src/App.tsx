import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { ToastProvider } from '@/context/ToastContext'
import { BookingModalProvider } from '@/context/BookingModalContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <BookingModalProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute requireRole="admin">
                        <HistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute requireRole="admin">
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </BookingModalProvider>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
