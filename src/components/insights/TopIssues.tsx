import { AlertTriangle } from 'lucide-react';
import type { TopIssue } from '../../api/insights';

interface TopIssuesProps {
  issues: TopIssue[];
}

const severityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800',
};

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TopIssues({ issues }: TopIssuesProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Top Issues</h3>
        </div>
      </div>
      {issues.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-500">
          No issues detected. Your system is running smoothly.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {issues.map((issue) => (
            <li key={issue.category} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      severityStyles[issue.severity] || severityStyles.MEDIUM
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCategory(issue.category)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{issue.count} occurrences</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 pl-16">{issue.recommendation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
