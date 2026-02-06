import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentGraph as AgentGraphData } from '../../api/multi-agent';

interface AgentGraphProps {
  graph: AgentGraphData;
}

export default function AgentGraph({ graph }: AgentGraphProps) {
  // Convert graph data to ReactFlow nodes and edges
  const initialNodes: Node[] = graph.nodes.map((node, idx) => ({
    id: node.id,
    type: node.type === 'agent' ? 'default' : 'input',
    data: {
      label: (
        <div className="text-center">
          <div className="font-semibold">{node.label}</div>
          {node.invocations > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {node.invocations} invocation{node.invocations > 1 ? 's' : ''}
            </div>
          )}
          {node.avg_duration_ms && (
            <div className="text-xs text-gray-500">
              Avg: {node.avg_duration_ms < 1000
                ? `${node.avg_duration_ms.toFixed(0)}ms`
                : `${(node.avg_duration_ms / 1000).toFixed(1)}s`}
            </div>
          )}
        </div>
      ),
    },
    position: calculatePosition(idx, graph.nodes.length),
    style: {
      background: node.type === 'agent' ? '#e0e7ff' : '#dbeafe',
      border: node.type === 'agent' ? '2px solid #6366f1' : '2px solid #3b82f6',
      borderRadius: 8,
      padding: 10,
      minWidth: 150,
    },
  }));

  const initialEdges: Edge[] = graph.edges.map((edge, idx) => ({
    id: `edge-${idx}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.type === 'handoff',
    label: edge.count > 1 ? `${edge.count}x` : '',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.type === 'delegation' ? '#6366f1' : '#f59e0b',
    },
    style: {
      stroke: edge.type === 'delegation' ? '#6366f1' : '#f59e0b',
      strokeWidth: 2,
    },
  }));

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback(() => {
    // Auto-layout can be triggered here if needed
  }, []);

  // If no nodes, show empty state
  if (graph.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="mt-2 text-sm">No agent communication data available</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={onInit}
      fitView
      attributionPosition="bottom-left"
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
}

/**
 * Calculate position for nodes in a circular layout
 */
function calculatePosition(index: number, total: number): { x: number; y: number } {
  const radius = 150;
  const centerX = 300;
  const centerY = 200;

  if (total === 1) {
    return { x: centerX, y: centerY };
  }

  const angle = (2 * Math.PI * index) / total - Math.PI / 2; // Start from top
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}
