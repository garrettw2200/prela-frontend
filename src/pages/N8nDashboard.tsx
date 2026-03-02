import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkflowList } from '@/components/n8n';
import { useProject } from '../contexts/ProjectContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { QuickSetupCard } from '@/components/onboarding';
import { fetchN8nWorkflows } from '../api/n8n';

/**
 * n8n Workflow Observability Dashboard
 *
 * Displays all n8n workflows with real-time metrics including:
 * - Execution counts and success rates
 * - AI usage and token consumption
 * - Cost tracking
 * - Performance metrics
 */
export function N8nDashboard() {
  const { projectId } = useParams();
  const { currentProject, selectProject } = useProject();
  const queryClient = useQueryClient();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // If URL has projectId param, sync with context
  React.useEffect(() => {
    if (projectId && projectId !== currentProject?.project_id) {
      selectProject(projectId);
    }
  }, [projectId, currentProject?.project_id, selectProject]);

  // Use current project from context
  const activeProjectId = currentProject?.project_id || 'default';

  // Fetch workflows to derive aggregate stats
  const { data: workflows = [] } = useQuery({
    queryKey: ['n8n-workflows', activeProjectId],
    queryFn: () => fetchN8nWorkflows(activeProjectId),
    enabled: !!currentProject,
    staleTime: 60 * 1000,
  });

  const totalWorkflows = workflows.length;
  const totalExecutions24h = workflows.reduce((sum, w) => sum + (w.execution_count_24h || 0), 0);
  const totalCost24h = workflows.reduce((sum, w) => sum + (w.total_cost_24h || 0), 0);
  const avgSuccessRate = totalExecutions24h > 0
    ? workflows.reduce((sum, w) => sum + (w.success_rate_24h || 0) * (w.execution_count_24h || 0), 0) / totalExecutions24h
    : 0;

  // WebSocket integration for real-time updates
  useWebSocket({
    projectId: activeProjectId,
    eventType: 'trace.created',
    onEvent: (data) => {
      console.log('[N8nDashboard] New trace received:', data);

      // Show real-time indicator
      setRealtimeActive(true);
      setTimeout(() => setRealtimeActive(false), 2000);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['n8n-workflows', activeProjectId] });

      // If this trace is for a specific workflow, invalidate that workflow's data
      if (data.workflow_id) {
        queryClient.invalidateQueries({
          queryKey: ['workflow', activeProjectId, data.workflow_id],
        });
        queryClient.invalidateQueries({
          queryKey: ['workflow-executions', activeProjectId, data.workflow_id],
        });
      }

      // Optional: Show toast notification
      // toast.success(`New execution: ${data.trace_id}`);
    },
  });

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Select a project to view workflows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    n8n Workflows
                  </h1>
                  {realtimeActive && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                      </span>
                      Live update
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Monitor and analyze your n8n workflow executions with AI usage metrics
                </p>
              </div>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <svg
                  className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Setup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Workflows"
            value={String(totalWorkflows)}
            icon={WorkflowIcon}
          />
          <StatCard
            title="24h Executions"
            value={totalExecutions24h.toLocaleString()}
            icon={ExecutionIcon}
          />
          <StatCard
            title="Success Rate"
            value={totalExecutions24h > 0 ? `${(avgSuccessRate * 100).toFixed(1)}%` : '—'}
            icon={SuccessIcon}
          />
          <StatCard
            title="24h Cost"
            value={`$${totalCost24h.toFixed(2)}`}
            icon={CostIcon}
          />
        </div>

        {/* Workflow List */}
        <WorkflowList projectId={activeProjectId} />
      </main>

      {/* Setup Modal */}
      {showSetupModal && (
        <QuickSetupCard
          projectId={activeProjectId}
          webhookUrl={currentProject?.webhook_url || ''}
          onClose={() => setShowSetupModal(false)}
          showAsModal={true}
        />
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
          <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
        </div>
      </div>
    </div>
  );
}

// Icons
function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ExecutionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
