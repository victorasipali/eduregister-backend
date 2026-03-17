import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import FeesPage from './pages/FeesPage'
import PaymentsPage from './pages/PaymentsPage'
import UsersPage from './pages/UsersPage'
import CoursesPage from './pages/CoursesPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading…</div>
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="students"       element={<ProtectedRoute roles={['registrar','teacher']}><StudentsPage /></ProtectedRoute>} />
        <Route path="students/:id"   element={<ProtectedRoute roles={['registrar','teacher']}><StudentDetailPage /></ProtectedRoute>} />
        <Route path="fees"           element={<ProtectedRoute roles={['registrar']}><FeesPage /></ProtectedRoute>} />
        <Route path="payments"       element={<ProtectedRoute roles={['registrar']}><PaymentsPage /></ProtectedRoute>} />
        <Route path="courses"        element={<ProtectedRoute roles={['registrar','teacher']}><CoursesPage /></ProtectedRoute>} />
        <Route path="users"          element={<ProtectedRoute roles={['registrar']}><UsersPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
