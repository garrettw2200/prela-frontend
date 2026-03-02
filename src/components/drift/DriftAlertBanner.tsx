import { useState } from 'react';
import {
  DriftAlert,
  getSeverityColor,
  getSeverityIcon,
  formatMetricValue,
  formatChangePercent,
} from '../../api/drift';
import DriftDetailModal from './DriftDetailModal';

interface DriftAlertBannerProps {
  alerts: DriftAlert[];
  onDismiss?: (alert: DriftAlert) => void;
  onMarkAsExpected?: (alert: DriftAlert) => void;
}

export default function DriftAlertBanner({
  alerts,
  onDismiss,
  onMarkAsExpected,
}: DriftAlertBannerProps) {
  const [selectedAlert, setSelectedAlert] = useState<DriftAlert | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  if (alerts.length === 0) {
    return null;
  }

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(
    (alert) => !dismissedAlerts.has(`${alert.agent_name}-${alert.detected_at}`)
  );

  if (visibleAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (alert: DriftAlert) => {
    const key = `${alert.agent_name}-${alert.detected_at}`;
    setDismissedAlerts((prev) => new Set([...prev, key]));
    onDismiss?.(alert);
  };

  const handleMarkAsExpected = (alert: DriftAlert) => {
    const key = `${alert.agent_name}-${alert.detected_at}`;
    setDismissedAlerts((prev) => new Set([...prev, key]));
    onMarkAsExpected?.(alert);
  };

  // Get highest severity from all visible alerts
  const highestSeverity = visibleAlerts.reduce((max: 'low' | 'medium' | 'high' | 'critical', alert) => {
    const alertMax = alert.anomalies.reduce((aMax: 'low' | 'medium' | 'high' | 'critical', anomaly) => {
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityOrder[anomaly.severity] > severityOrder[aMax]
        ? anomaly.severity
        : aMax;
    }, 'low' as const);
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityOrder[alertMax] > severityOrder[max] ? alertMax : max;
  }, 'low' as const);

  const severityColor = getSeverityColor(highestSeverity);
  const severityIcon = getSeverityIcon(highestSeverity);

  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-800',
    yellow: 'text-yellow-800',
    orange: 'text-orange-800',
    red: 'text-red-800',
  };

  return (
    <>
      <div
        className={`rounded-lg border-2 p-4 mb-6 ${bgColors[severityColor]}`}
        role="alert"
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl">{severityIcon}</div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${textColors[severityColor]}`}>
                  {visibleAlerts.length === 1
                    ? 'Drift Alert: Agent behavior changed'
                    : `${visibleAlerts.length} Drift Alerts Detected`}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {visibleAlerts.length === 1
                    ? `Agent "${visibleAlerts[0].agent_name}" is exhibiting unusual behavior`
                    : 'Multiple agents are showing anomalous behavior patterns'}
                </p>
              </div>

              {/* Dismiss all button */}
              {visibleAlerts.length > 1 && (
                <button
                  onClick={() => {
                    visibleAlerts.forEach(handleDismiss);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss all alerts"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Alert previews */}
            <div className="mt-4 space-y-3">
              {visibleAlerts.slice(0, 3).map((alert) => {
                const primaryAnomaly = alert.anomalies[0];
                const additionalCount = alert.anomalies.length - 1;

                return (
                  <div
                    key={alert.agent_name}
                    className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {alert.agent_name}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">
                          {primaryAnomaly.metric_name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          Baseline:{' '}
                          {formatMetricValue(
                            primaryAnomaly.baseline_mean,
                            primaryAnomaly.unit
                          )}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="font-semibold text-gray-900">
                          Current:{' '}
                          {formatMetricValue(
                            primaryAnomaly.current_value,
                            primaryAnomaly.unit
                          )}
                        </span>
                        <span
                          className={`font-semibold ${
                            primaryAnomaly.direction === 'increased'
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {formatChangePercent(
                            primaryAnomaly.change_percent,
                            primaryAnomaly.direction
                          )}
                        </span>
                        {additionalCount > 0 && (
                          <span className="text-xs text-gray-400">
                            +{additionalCount} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Investigate
                      </button>
                      <button
                        onClick={() => handleMarkAsExpected(alert)}
                        className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
                      >
                        Mark as Expected
                      </button>
                      <button
                        onClick={() => handleDismiss(alert)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Dismiss alert"
                      >
                        <svg
                          className="h-4 w-4"
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
                );
              })}

              {/* Show more button */}
              {visibleAlerts.length > 3 && (
                <button
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  onClick={() => {
                    // Could open a modal showing all alerts
                    console.log('Show all alerts');
                  }}
                >
                  Show {visibleAlerts.length - 3} more alerts
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <DriftDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onMarkAsExpected={() => {
            handleMarkAsExpected(selectedAlert);
            setSelectedAlert(null);
          }}
        />
      )}
    </>
  );
}
