import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../contexts/ProjectContext';
import {
  fetchAlerts,
  fetchBaselines,
  fetchAlertRules,
  calculateBaselines,
  checkDrift,
  updateAlertStatus,
  deleteAlertRule,
  type StoredAlert,
  type AlertRule,
} from '../api/drift';
import { DriftAlertBanner } from '../components/drift';
import AlertRuleModal from '../components/drift/AlertRuleModal';

export function DriftDashboard() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id || 'default';
  const queryClient = useQueryClient();

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();

  // Fetch active alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['drift-alerts', projectId],
    queryFn: () => fetchAlerts(projectId, { status: 'active', limit: 50 }),
    staleTime: 60 * 1000,
  });

  // Fetch baselines
  const { data: baselinesData, isLoading: baselinesLoading } = useQuery({
    queryKey: ['drift-baselines', projectId],
    queryFn: () => fetchBaselines(projectId, undefined, 20),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch alert rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['alert-rules', projectId],
    queryFn: () => fetchAlertRules(projectId),
    staleTime: 2 * 60 * 1000,
  });

  // Calculate baselines mutation
  const calculateMutation = useMutation({
    mutationFn: () => calculateBaselines(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift-baselines', projectId] });
    },
  });

  // Check drift mutation
  const checkMutation = useMutation({
    mutationFn: () => checkDrift(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift-alerts', projectId] });
    },
  });

  // Dismiss alert mutation
  const dismissMutation = useMutation({
    mutationFn: (alertId: string) =>
      updateAlertStatus(projectId, alertId, { status: 'dismissed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift-alerts', projectId] });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(projectId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', projectId] });
    },
  });

  // Convert stored alerts to DriftAlert format for the banner component
  const bannerAlerts =
    alertsData?.alerts.map((a: StoredAlert) => ({
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
    })) || [];

  const isLoading = alertsLoading || baselinesLoading || rulesLoading;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drift Detection</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor agent behavior changes and configure alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => calculateMutation.mutate()}
            disabled={calculateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {calculateMutation.isPending ? 'Calculating...' : 'Refresh Baselines'}
          </button>
          <button
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {checkMutation.isPending ? 'Checking...' : 'Check for Drift'}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {calculateMutation.isSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Baselines recalculated: {calculateMutation.data.baselines_calculated} agents
        </div>
      )}
      {checkMutation.isSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Drift check complete:{' '}
          {(checkMutation.data as any).alerts?.length || 0} alerts found
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Active Alerts */}
          {bannerAlerts.length > 0 && (
            <DriftAlertBanner
              alerts={bannerAlerts}
              onDismiss={(alert) => {
                const stored = alertsData?.alerts.find(
                  (a: StoredAlert) => a.agent_name === alert.agent_name
                );
                if (stored) dismissMutation.mutate(stored.alert_id);
              }}
            />
          )}

          {bannerAlerts.length === 0 && (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No active drift alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Agent behavior is within expected baselines
              </p>
            </div>
          )}

          {/* Baselines */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Agent Baselines</h2>
              <p className="mt-1 text-sm text-gray-500">
                Statistical baselines calculated from recent agent behavior
              </p>
            </div>

            {baselinesData?.baselines && baselinesData.baselines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Samples</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Window</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {baselinesData.baselines.map((b) => (
                      <tr key={b.baseline_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {b.agent_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {b.sample_size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {b.duration_mean < 1000
                            ? `${b.duration_mean.toFixed(0)}ms`
                            : `${(b.duration_mean / 1000).toFixed(1)}s`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(b.success_rate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${b.cost_mean.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {b.window_start
                            ? new Date(b.window_start).toLocaleDateString()
                            : '—'}{' '}
                          –{' '}
                          {b.window_end
                            ? new Date(b.window_end).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No baselines calculated yet. Click "Refresh Baselines" to compute them.
              </div>
            )}
          </div>

          {/* Alert Rules */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Alert Rules</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure notifications for drift alerts
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingRule(undefined);
                  setShowRuleModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add Rule
              </button>
            </div>

            {rulesData?.rules && rulesData.rules.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {rulesData.rules.map((rule) => (
                  <li key={rule.rule_id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{rule.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            rule.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                          {rule.severity_threshold}+ severity
                        </span>
                      </div>
                      {rule.description && (
                        <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
                      )}
                      <div className="mt-1 flex gap-3 text-xs text-gray-400">
                        {rule.agent_name && <span>Agent: {rule.agent_name}</span>}
                        {rule.notify_email && <span>Email</span>}
                        {rule.notify_slack && <span>Slack</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleModal(true);
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRuleMutation.mutate(rule.rule_id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No alert rules configured. Add a rule to get notified about drift.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert Rule Modal */}
      {showRuleModal && (
        <AlertRuleModal
          projectId={projectId}
          rule={editingRule}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(undefined);
          }}
        />
      )}
    </div>
  );
}
