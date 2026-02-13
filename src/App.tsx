import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { N8nDashboard } from './pages/N8nDashboard';
import { MultiAgentDashboard } from './pages/MultiAgentDashboard';
import { ProjectManagement } from './pages/ProjectManagement';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { BillingPage } from './pages/BillingPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/sign-in/*" element={<SignIn />} />
                <Route path="/sign-up/*" element={<SignUp />} />
                {/* Legacy login route - redirect to sign-in */}
                <Route path="/login" element={<Navigate to="/sign-in" replace />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Outlet />
                      </Layout>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/n8n" replace />} />
                  <Route path="n8n" element={<N8nDashboard />} />
                  <Route path="multi-agent" element={<MultiAgentDashboard />} />

                  {/* Account management */}
                  <Route path="api-keys" element={<ApiKeysPage />} />
                  <Route path="data-sources" element={<DataSourcesPage />} />
                  <Route path="billing" element={<BillingPage />} />

                  {/* Project management */}
                  <Route path="projects/manage" element={<ProjectManagement />} />

                  {/* Project-specific routes */}
                  <Route path="projects/:projectId/n8n" element={<N8nDashboard />} />

                  {/* Future routes */}
                  {/* <Route path="replay" element={<ReplayDashboard />} /> */}

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
