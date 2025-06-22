import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import WorkspaceSetupPage from './pages/WorkspaceSetupPage'
import ScriptsPage from './pages/ScriptsPage'
import NewScriptPage from './pages/NewScriptPage'
import ScriptViewPage from './pages/ScriptViewPage'
import ScriptExecutePage from './pages/ScriptExecutePage'
import TargetGroupsPage from './pages/TargetGroupsPage'
import NewTargetGroupPage from './pages/NewTargetGroupPage'
import TargetGroupViewPage from './pages/TargetGroupViewPage'
import EditScriptPage from './pages/EditScriptPage'
import EditTargetGroupPage from './pages/EditTargetGroupPage'
import IAMCredentialsPage from './pages/IAMCredentialsPage'
import NewIAMCredentialPage from './pages/NewIAMCredentialPage'
import EditIAMCredentialPage from './pages/EditIAMCredentialPage'
import AuditLogPage from './pages/AuditLogPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import RunnersPage from './pages/RunnersPage'
import NewRunnerPage from './pages/NewRunnerPage'
import RunnerViewPage from './pages/RunnerViewPage'
import EditRunnerPage from './pages/EditRunnerPage'

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/scripts" replace />
  }
  
  return children
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/setup" element={<WorkspaceSetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/scripts" replace />} />
          <Route 
            path="/scripts" 
            element={
              <ProtectedRoute>
                <Layout><ScriptsPage /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scripts/new" 
            element={
              <ProtectedRoute>
                <Layout><NewScriptPage /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scripts/:id" 
            element={
              <ProtectedRoute>
                <Layout><ScriptViewPage /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scripts/:id/edit" 
            element={
              <ProtectedRoute>
                <Layout><EditScriptPage /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scripts/:id/execute" 
            element={
              <ProtectedRoute>
                <Layout><ScriptExecutePage /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Layout><AdminDashboardPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/targets" 
            element={
              <AdminRoute>
                <Layout><TargetGroupsPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/targets/new" 
            element={
              <AdminRoute>
                <Layout><NewTargetGroupPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/targets/:id" 
            element={
              <AdminRoute>
                <Layout><TargetGroupViewPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/targets/:id/edit" 
            element={
              <AdminRoute>
                <Layout><EditTargetGroupPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/iam-credentials" 
            element={
              <AdminRoute>
                <Layout><IAMCredentialsPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/iam-credentials/new" 
            element={
              <AdminRoute>
                <Layout><NewIAMCredentialPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/iam-credentials/:id/edit" 
            element={
              <AdminRoute>
                <Layout><EditIAMCredentialPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/audit-log" 
            element={
              <ProtectedRoute>
                <Layout><AuditLogPage /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/runners" 
            element={
              <AdminRoute>
                <Layout><RunnersPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/runners/new" 
            element={
              <AdminRoute>
                <Layout><NewRunnerPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/runners/:id" 
            element={
              <AdminRoute>
                <Layout><RunnerViewPage /></Layout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/runners/:id/edit" 
            element={
              <AdminRoute>
                <Layout><EditRunnerPage /></Layout>
              </AdminRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
