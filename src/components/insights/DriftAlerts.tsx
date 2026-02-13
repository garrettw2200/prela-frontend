import { Activity, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DriftSummaryData } from '../../api/insights';

interface DriftAlertsProps {
  data: DriftSummaryData;
}

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
};

const severityOrder = ['critical', 'high', 'medium', 'low'];

export function DriftAlerts({ data }: DriftAlertsProps) {
  const { active_alerts, by_severity, agents_affected } = data;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Drift</h3>
        </div>
      </div>

      {active_alerts === 0 ? (
        <div className="px-6 py-8 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            No drift detected
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Agent behavior is stable
          </p>
        </div>
      ) : (
        <div className="px-6 py-4 space-y-4">
          {/* Total */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{active_alerts}</span>
            <span className="text-sm text-gray-500">
              active {active_alerts === 1 ? 'alert' : 'alerts'}
            </span>
          </div>

          {/* Agents affected */}
          <div className="text-sm text-gray-600">
            {agents_affected} {agents_affected === 1 ? 'agent' : 'agents'} affected
          </div>

          {/* Severity breakdown */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2">By Severity</h4>
            <div className="flex gap-2 flex-wrap">
              {severityOrder
                .filter((sev) => by_severity[sev])
                .map((sev) => (
                  <span
                    key={sev}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      severityStyles[sev] || severityStyles.low
                    }`}
                  >
                    {sev}: {by_severity[sev]}
                  </span>
                ))}
            </div>
          </div>

          {/* Link to dashboard */}
          <Link
            to="/drift"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View details
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
