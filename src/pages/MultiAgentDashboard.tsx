import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import {
  fetchMultiAgentExecutions,
  fetchAgentPerformance,
  ExecutionSummary,
  AgentPerformance,
  getFrameworkName,
  getFrameworkColor,
} from '../api/multi-agent';
import ExecutionList from '../components/multi-agent/ExecutionList';
import { DriftAlertBanner } from '../components/drift';
import { fetchAlerts, updateAlertStatus, StoredAlert, DriftAlert } from '../api/drift';
import AlertRuleModal from '../components/drift/AlertRuleModal';

export function MultiAgentDashboard() {
  const { user } = useAuth();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const projectId = routeProjectId ?? currentProject?.project_id ?? 'default';

  const [selectedFramework, setSelectedFramework] = useState<
    'crewai' | 'autogen' | 'langgraph' | 'swarm' | undefined
  >(undefined);
  const [selectedStatus, setSelectedStatus] = useState<
    'success' | 'error' | 'running' | undefined
  >(undefined);
  const [showAlertRuleModal, setShowAlertRuleModal] = useState(false);

  // Fetch executions with filters
  const {
    data: executions = [],
    isLoading: executionsLoading,
    error: executionsError,
  } = useQuery<ExecutionSummary[]>({
    queryKey: ['multi-agent-executions', projectId, selectedFramework, selectedStatus],
    queryFn: () =>
      fetchMultiAgentExecutions(projectId, selectedFramework, selectedStatus, undefined, 50),
    refetchInterval: 10000, // Refetch every 10 seconds for running executions
  });

  // Fetch agent performance analytics
  const {
    data: agentPerformance = [],
    isLoading: performanceLoading,
  } = useQuery<AgentPerformance[]>({
    queryKey: ['agent-performance', projectId, selectedFramework],
    queryFn: () => fetchAgentPerformance(projectId, selectedFramework, undefined, 10),
  });

  // Fetch drift alerts (stored alerts from database)
  const {
    data: driftData,
    isLoading: driftLoading,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['drift-alerts', projectId, selectedFramework],
    queryFn: async () => {
      try {
        return await fetchAlerts(projectId, {
          agentName: selectedFramework,
          status: 'active', // Only show active alerts by default
        });
      } catch (error) {
        console.error('Failed to fetch drift alerts:', error);
        return { alerts: [], count: 0 };
      }
    },
    refetchInterval: 60000, // Check for drift every minute
  });

  // Calculate stats from executions
  const stats = {
    total: executions.length,
    success: executions.filter((e) => e.status === 'success').length,
    error: executions.filter((e) => e.status === 'error').length,
    running: executions.filter((e) => e.status === 'running').length,
    avgDuration:
      executions.length > 0
        ? executions.reduce((sum, e) => sum + e.duration_ms, 0) / executions.length
        : 0,
  };

  // Framework distribution
  const frameworkCounts = executions.reduce(
    (acc, e) => {
      acc[e.framework] = (acc[e.framework] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleDismissAlert = async (alert: DriftAlert) => {
    const storedAlert = alert as unknown as StoredAlert;
    try {
      await updateAlertStatus(projectId, storedAlert.alert_id, {
        status: 'dismissed',
        user_id: user?.id || 'anonymous',
        notes: 'Dismissed from dashboard',
      });
      refetchAlerts();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleMarkAsExpected = async (alert: DriftAlert) => {
    const storedAlert = alert as unknown as StoredAlert;
    try {
      await updateAlertStatus(projectId, storedAlert.alert_id, {
        status: 'acknowledged',
        user_id: user?.id || 'anonymous',
        notes: 'Marked as expected behavior',
      });
      refetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Agent Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and analyze multi-agent framework executions
          </p>
        </div>
        <button
          onClick={() => setShowAlertRuleModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Configure Alerts
        </button>
      </div>

      {/* Drift Alerts — convert StoredAlert → DriftAlert, deduplicate by agent_name */}
      {!driftLoading && driftData && driftData.alerts.length > 0 && (() => {
        const seen = new Set<string>();
        const uniqueAlerts = (driftData.alerts as unknown as StoredAlert[])
          .map((a): DriftAlert => ({
            agent_name: a.agent_name,
            service_name: a.service_name,
            anomalies: a.anomalies,
            root_causes: a.root_causes,
            baseline: {
              baseline_id: a.baseline_id,
              agent_name: a.agent_name,
              service_name: a.service_name,
              window_start: '',
              window_end: '',
              sample_size: 0,
              duration_mean: 0,
              duration_stddev: 0,
              duration_p50: 0,
              duration_p95: 0,
              token_usage_mean: 0,
              token_usage_stddev: 0,
              success_rate: 0,
              error_count: 0,
              cost_mean: 0,
              cost_total: 0,
            },
            detected_at: a.detected_at,
          }))
          .filter((a) => {
            if (seen.has(a.agent_name)) return false;
            seen.add(a.agent_name);
            return true;
          });
        return uniqueAlerts.length > 0 ? (
          <DriftAlertBanner
            alerts={uniqueAlerts}
            onDismiss={handleDismissAlert}
            onMarkAsExpected={handleMarkAsExpected}
          />
        ) : null;
      })()}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Executions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Executions
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.total > 0
                      ? `${((stats.success / stats.total) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Duration</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.avgDuration > 0
                      ? stats.avgDuration < 1000
                        ? `${stats.avgDuration.toFixed(0)}ms`
                        : `${(stats.avgDuration / 1000).toFixed(1)}s`
                      : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Frameworks */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Frameworks
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {Object.keys(frameworkCounts).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Framework Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="framework" className="block text-sm font-medium text-gray-700 mb-1">
              Framework
            </label>
            <select
              id="framework"
              value={selectedFramework || ''}
              onChange={(e) =>
                setSelectedFramework(
                  e.target.value as 'crewai' | 'autogen' | 'langgraph' | 'swarm' | undefined
                )
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Frameworks</option>
              <option value="crewai">CrewAI</option>
              <option value="autogen">AutoGen</option>
              <option value="langgraph">LangGraph</option>
              <option value="swarm">Swarm</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus || ''}
              onChange={(e) =>
                setSelectedStatus(e.target.value as 'success' | 'error' | 'running' | undefined)
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="running">Running</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(selectedFramework || selectedStatus) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedFramework(undefined);
                  setSelectedStatus(undefined);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Agents Performance */}
      {!performanceLoading && agentPerformance.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performing Agents</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Framework
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invocations
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentPerformance.slice(0, 5).map((agent, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getFrameworkColor(
                          agent.framework
                        )}-100 text-${getFrameworkColor(agent.framework)}-800`}
                      >
                        {getFrameworkName(agent.framework)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.total_invocations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.avg_duration_ms < 1000
                        ? `${agent.avg_duration_ms.toFixed(0)}ms`
                        : `${(agent.avg_duration_ms / 1000).toFixed(1)}s`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          agent.success_rate >= 0.9
                            ? 'bg-green-100 text-green-800'
                            : agent.success_rate >= 0.7
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {(agent.success_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Executions</h2>
        </div>
        <ExecutionList
          executions={executions}
          isLoading={executionsLoading}
          error={executionsError ? String(executionsError) : undefined}
        />
      </div>

      {/* Alert Rule Modal */}
      {showAlertRuleModal && (
        <AlertRuleModal
          projectId={projectId}
          onClose={() => setShowAlertRuleModal(false)}
        />
      )}
    </div>
  );
}
