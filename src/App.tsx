import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { N8nDashboard } from './pages/N8nDashboard';
import { MultiAgentDashboard } from './pages/MultiAgentDashboard';
import { InsightsDashboard } from './pages/InsightsDashboard';
import { ProjectManagement } from './pages/ProjectManagement';
import { DriftDashboard } from './pages/DriftDashboard';
import { EvalGeneratorPage } from './pages/EvalGeneratorPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { BillingPage } from './pages/BillingPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { TracesPage } from './pages/TracesPage';
import { ReplayDashboard } from './pages/ReplayDashboard';
import { ReplayExecutionDetail } from './pages/ReplayExecutionDetail';
import { BatchReplayDetail } from './pages/BatchReplayDetail';
import { TeamSettingsPage } from './pages/TeamSettingsPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { TeamProvider } from './contexts/TeamContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/sign-in/*" element={<SignIn />} />
                <Route path="/sign-up/*" element={<SignUp />} />
                {/* Legacy login route - redirect to sign-in */}
                <Route path="/login" element={<Navigate to="/sign-in" replace />} />

                {/* Protected routes — TeamProvider and ProjectProvider only mount after auth */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <TeamProvider>
                        <ProjectProvider>
                          <Layout>
                            <Outlet />
                          </Layout>
                        </ProjectProvider>
                      </TeamProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/insights" replace />} />
                  <Route path="insights" element={<InsightsDashboard />} />
                  <Route path="n8n" element={<N8nDashboard />} />
                  <Route path="multi-agent" element={<MultiAgentDashboard />} />
                  <Route path="drift" element={<DriftDashboard />} />
                  <Route path="traces" element={<TracesPage />} />
                  <Route path="eval-generator" element={<EvalGeneratorPage />} />

                  {/* Account management */}
                  <Route path="api-keys" element={<ApiKeysPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                  <Route path="data-sources" element={<DataSourcesPage />} />
                  <Route path="billing" element={<BillingPage />} />

                  {/* Project management */}
                  <Route path="projects/manage" element={<ProjectManagement />} />

                  {/* Project-specific routes */}
                  <Route path="projects/:projectId/n8n" element={<N8nDashboard />} />

                  {/* Replay */}
                  <Route path="replay" element={<ReplayDashboard />} />
                  <Route path="replay/batch/:batchId" element={<BatchReplayDetail />} />
                  <Route path="replay/:executionId" element={<ReplayExecutionDetail />} />

                  {/* Team */}
                  <Route path="team" element={<TeamSettingsPage />} />
                  <Route path="invite/:token" element={<AcceptInvitationPage />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
