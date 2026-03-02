import { Shield, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SecuritySummaryData } from '../../api/insights';

interface SecuritySummaryProps {
  data: SecuritySummaryData;
}

const severityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800',
};

const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function formatType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SecuritySummary({ data }: SecuritySummaryProps) {
  const { total_findings, by_severity, by_type } = data;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Security</h3>
        </div>
      </div>

      {total_findings === 0 ? (
        <div className="px-6 py-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-green-500" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            No security issues detected
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Your traces are clean
          </p>
        </div>
      ) : (
        <div className="px-6 py-4 space-y-4">
          {/* Total */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{total_findings}</span>
            <span className="text-sm text-gray-500">
              {total_findings === 1 ? 'finding' : 'findings'}
            </span>
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
                      severityStyles[sev] || severityStyles.LOW
                    }`}
                  >
                    {sev}: {by_severity[sev]}
                  </span>
                ))}
            </div>
          </div>

          {/* Type breakdown */}
          {Object.keys(by_type).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Top Types</h4>
              <ul className="space-y-1">
                {Object.entries(by_type)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <li key={type} className="flex justify-between text-xs">
                      <span className="text-gray-600">{formatType(type)}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <Link
            to="/traces"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View traces
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
