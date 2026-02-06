import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fetchN8nWorkflows } from '@/api/n8n';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { QuickSetupCard } from '@/components/onboarding';
import { useProject } from '@/contexts/ProjectContext';

interface WorkflowListProps {
  projectId: string;
}

export function WorkflowList({ projectId }: WorkflowListProps) {
  // Must call hooks at top level, not conditionally
  const { currentProject } = useProject();

  const { data: workflows, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['n8n-workflows', projectId],
    queryFn: () => fetchN8nWorkflows(projectId),
    // Disable polling since we have WebSocket real-time updates
    refetchInterval: false,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load workflows. Please try again.
        </p>
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">
            Get Started with n8n Tracing
          </h3>
          <p className="text-sm text-blue-700">
            No workflows found yet. Follow the setup instructions below to start
            tracing.
          </p>
        </div>

        <QuickSetupCard
          projectId={currentProject?.project_id || 'default'}
          webhookUrl={currentProject?.webhook_url || ''}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">n8n Workflows</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'} tracked
          </div>
          {dataUpdatedAt && (
            <div className="text-xs text-gray-400">
              Last updated: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Workflow
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Executions (24h)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Success Rate
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Avg Duration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                AI Calls
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Cost
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Last Run
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {workflows.map((workflow) => (
              <tr key={workflow.workflow_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/n8n/workflows/${workflow.workflow_id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    {workflow.workflow_name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {workflow.execution_count_24h.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SuccessRateBadge rate={workflow.success_rate_24h} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDuration(workflow.avg_duration_ms)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {workflow.total_ai_calls_24h.toLocaleString()}
                  <span className="ml-1 text-gray-500">
                    ({formatTokens(workflow.total_tokens_24h)})
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${workflow.total_cost_24h.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(workflow.last_execution), {
                    addSuffix: true,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SuccessRateBadgeProps {
  rate: number;
}

function SuccessRateBadge({ rate }: SuccessRateBadgeProps) {
  const colorClass =
    rate >= 95
      ? 'bg-green-100 text-green-800'
      : rate >= 80
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

// Helper functions
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}
