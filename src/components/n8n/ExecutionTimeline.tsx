import { formatDuration } from '@/lib/utils';

/**
 * Timeline Node Data
 *
 * Represents a single node's execution within a workflow timeline.
 */
interface TimelineNode {
  /** Unique identifier for the node */
  node_id: string;

  /** Human-readable node name */
  node_name: string;

  /** Type of node (e.g., "webhook", "function", "llm") */
  node_type: string;

  /** Milliseconds from workflow start when this node began */
  start_offset_ms: number;

  /** Duration of node execution in milliseconds */
  duration_ms: number;

  /** Execution status */
  status: 'success' | 'error';

  /** Whether this node performs AI operations */
  is_ai_node: boolean;
}

/**
 * ExecutionTimeline Props
 */
interface ExecutionTimelineProps {
  /** Array of nodes with timing information */
  nodes: TimelineNode[];

  /** Total workflow execution duration in milliseconds */
  totalDuration: number;
}

/**
 * ExecutionTimeline Component
 *
 * Displays a visual timeline of node executions within a workflow.
 * Shows timing, duration, and status for each node with color-coded bars.
 *
 * Features:
 * - Proportional bar widths based on duration
 * - Color-coded by node type and status
 * - Time markers along the top
 * - Legend for bar colors
 *
 * @example
 * ```tsx
 * const nodes = [
 *   {
 *     node_id: "node1",
 *     node_name: "Start",
 *     node_type: "webhook",
 *     start_offset_ms: 0,
 *     duration_ms: 50,
 *     status: "success",
 *     is_ai_node: false
 *   },
 *   {
 *     node_id: "node2",
 *     node_name: "OpenAI Chat",
 *     node_type: "llm",
 *     start_offset_ms: 50,
 *     duration_ms: 2000,
 *     status: "success",
 *     is_ai_node: true
 *   }
 * ];
 *
 * <ExecutionTimeline nodes={nodes} totalDuration={2050} />
 * ```
 */
export function ExecutionTimeline({ nodes, totalDuration }: ExecutionTimelineProps) {
  // Sort nodes by start time to display in execution order
  const sortedNodes = [...nodes].sort((a, b) => a.start_offset_ms - b.start_offset_ms);

  // Handle edge case: no nodes
  if (sortedNodes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-900">Execution Timeline</h3>
        <p className="text-sm text-gray-500">No node execution data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-900">Execution Timeline</h3>

      {/* Timeline header with time markers */}
      <div className="relative mb-4 h-6">
        {[0, 25, 50, 75, 100].map((pct) => (
          <div
            key={pct}
            className="absolute text-xs text-gray-400"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          >
            {formatDuration((totalDuration * pct) / 100)}
          </div>
        ))}
      </div>

      {/* Timeline bars */}
      <div className="space-y-2">
        {sortedNodes.map((node) => {
          // Calculate position and width as percentages
          const leftPct = (node.start_offset_ms / totalDuration) * 100;
          const widthPct = (node.duration_ms / totalDuration) * 100;

          // Choose bar color based on status and node type
          let barColor = 'bg-blue-400'; // Default: regular node
          if (node.status === 'error') {
            barColor = 'bg-red-400'; // Error overrides all
          } else if (node.is_ai_node) {
            barColor = 'bg-purple-400'; // AI node
          }

          return (
            <div key={node.node_id} className="relative h-8">
              {/* Node label (left side) */}
              <div className="absolute left-0 top-0 w-32 truncate text-xs text-gray-600" title={node.node_name}>
                {node.node_name}
              </div>

              {/* Timeline bar container */}
              <div className="absolute left-36 right-0 top-0 h-8">
                {/* Background track */}
                <div className="absolute inset-0 rounded bg-gray-100" />

                {/* Execution bar */}
                <div
                  className={`absolute bottom-1 top-1 rounded ${barColor} transition-opacity hover:opacity-80`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${Math.max(widthPct, 1)}%`, // Minimum 1% width for visibility
                  }}
                  title={`${node.node_name}: ${formatDuration(node.duration_ms)} (started at ${formatDuration(node.start_offset_ms)})`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-400" />
          <span>Regular Node</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-purple-400" />
          <span>AI Node</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-400" />
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}
