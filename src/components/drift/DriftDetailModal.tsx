import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../../contexts/ProjectContext';
import {
  DriftAlert,
  Anomaly,
  getSeverityColor,
  getSeverityIcon,
  formatMetricValue,
  formatChangePercent,
  calculateBaselines,
} from '../../api/drift';
import { formatDistanceToNow } from 'date-fns';

function safeFormatDistance(dateStr: string | undefined | null): string {
  if (!dateStr) return 'unknown time';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'unknown time';
  return formatDistanceToNow(d);
}

const WINDOW_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

interface DriftDetailModalProps {
  alert: DriftAlert;
  onClose: () => void;
  onMarkAsExpected: () => void;
}

export default function DriftDetailModal({
  alert,
  onClose,
  onMarkAsExpected,
}: DriftDetailModalProps) {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id || 'default';
  const queryClient = useQueryClient();

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(
    alert.anomalies[0] || null
  );
  const [showBaselinePanel, setShowBaselinePanel] = useState(false);
  const [windowDays, setWindowDays] = useState(7);
  const [recalcSuccess, setRecalcSuccess] = useState(false);

  const recalcMutation = useMutation({
    mutationFn: () => calculateBaselines(projectId, alert.agent_name, windowDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift-baselines', projectId] });
      setRecalcSuccess(true);
      setTimeout(() => setRecalcSuccess(false), 3000);
    },
  });

  const handleViewTraces = () => {
    const params = new URLSearchParams({ agent: alert.agent_name });
    if (alert.baseline?.window_start) params.set('start', alert.baseline.window_start);
    if (alert.baseline?.window_end) params.set('end', alert.baseline.window_end);
    onClose();
    navigate(`/traces?${params}`);
  };

  // Get severity info
  const highestSeverity = alert.anomalies.reduce((max: 'low' | 'medium' | 'high' | 'critical', anomaly) => {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityOrder[anomaly.severity] > severityOrder[max] ? anomaly.severity : max;
  }, 'low' as const);

  const severityIcon = getSeverityIcon(highestSeverity);

  const textColors: Record<string, string> = {
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    orange: 'text-orange-700',
    red: 'text-red-700',
  };

  const bgColors: Record<string, string> = {
    blue: 'bg-blue-100',
    yellow: 'bg-yellow-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
  };

  const borderColors: Record<string, string> = {
    blue: 'border-blue-300',
    yellow: 'border-yellow-300',
    orange: 'border-orange-300',
    red: 'border-red-300',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{severityIcon}</span>
                <div>
                  <h3
                    className="text-xl font-semibold text-gray-900"
                    id="modal-title"
                  >
                    Drift Alert: Agent Behavior Changed
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Detected {safeFormatDistance(alert.detected_at)} ago
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Agent</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {alert.agent_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Service</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {alert.service_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Baseline Period
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {safeFormatDistance(alert.baseline.window_start)} ago
                    – {safeFormatDistance(alert.baseline.window_end)} ago
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Sample Size</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {alert.baseline.sample_size} executions
                  </div>
                </div>
              </div>
            </div>

            {/* Anomalies */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Detected Anomalies ({alert.anomalies.length})
              </h4>
              <div className="space-y-3">
                {alert.anomalies.map((anomaly, idx) => {
                  const isSelected = selectedAnomaly === anomaly;
                  const color = getSeverityColor(anomaly.severity);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedAnomaly(anomaly)}
                      className={`w-full text-left bg-white rounded-lg p-4 border-2 transition-all ${
                        isSelected
                          ? `${borderColors[color]} shadow-md`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColors[color]} ${textColors[color]}`}
                            >
                              {anomaly.severity.toUpperCase()}
                            </span>
                            <span className="font-medium text-gray-900">
                              {anomaly.metric_name}
                            </span>
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Baseline</div>
                              <div className="font-semibold text-gray-900">
                                {formatMetricValue(
                                  anomaly.baseline_mean,
                                  anomaly.unit
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Current</div>
                              <div className="font-semibold text-gray-900">
                                {formatMetricValue(
                                  anomaly.current_value,
                                  anomaly.unit
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Change</div>
                              <div
                                className={`font-semibold ${
                                  anomaly.direction === 'increased'
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {formatChangePercent(
                                  anomaly.change_percent,
                                  anomaly.direction
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <svg
                            className="h-5 w-5 text-indigo-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Root Causes */}
            {alert.root_causes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Possible Causes
                </h4>
                <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
                  {alert.root_causes.map((cause, idx) => {
                    const hasHighConfidence = cause.confidence >= 0.8;

                    return (
                      <div key={idx} className="p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 text-2xl ${
                              hasHighConfidence ? '' : 'opacity-50'
                            }`}
                          >
                            {hasHighConfidence ? '✓' : '⚠️'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {cause.type
                                  .split('_')
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                  )
                                  .join(' ')}
                              </span>
                              <span className="text-sm text-gray-500">
                                {(cause.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {cause.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No root causes */}
            {alert.root_causes.length === 0 && (
              <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3 text-gray-500">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    No specific root cause identified. Manual investigation may be
                    required.
                  </span>
                </div>
              </div>
            )}

            {/* Adjust Baseline inline panel */}
            {showBaselinePanel && (
              <div className="bg-white rounded-lg shadow-sm p-4 border border-indigo-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Recalculate Baseline — {alert.agent_name}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Choose a new time window to recalculate the baseline. The drift
                  detection will use this updated baseline on the next check.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg border border-gray-300 bg-white">
                    {WINDOW_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setWindowDays(opt.value)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                          windowDays === opt.value
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => recalcMutation.mutate()}
                    disabled={recalcMutation.isPending}
                    className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {recalcMutation.isPending ? 'Recalculating…' : 'Recalculate'}
                  </button>
                  {recalcSuccess && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Baseline updated
                    </span>
                  )}
                  {recalcMutation.isError && (
                    <span className="text-sm text-red-600">
                      Failed — try again
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleViewTraces}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="-ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Traces
              </button>
              <button
                onClick={() => setShowBaselinePanel((v) => !v)}
                className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                  showBaselinePanel
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Adjust Baseline
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onMarkAsExpected}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Mark as Expected
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
