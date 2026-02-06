import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import userEvent from '@testing-library/user-event';
import ExecutionDetail from './ExecutionDetail';
import * as multiAgentApi from '../api/multi-agent';

// Mock the API functions
vi.mock('../api/multi-agent', async () => {
  const actual = await vi.importActual('../api/multi-agent');
  return {
    ...actual,
    fetchExecutionDetail: vi.fn(),
    fetchAgentGraph: vi.fn(),
    fetchExecutionTasks: vi.fn(),
  };
});

// Mock child components to avoid rendering complexity
vi.mock('../components/multi-agent/AgentGraph', () => ({
  default: ({ graph }: any) => (
    <div data-testid="agent-graph">Agent Graph: {graph.nodes.length} nodes</div>
  ),
}));

vi.mock('../components/multi-agent/TaskTimeline', () => ({
  default: ({ tasks }: any) => (
    <div data-testid="task-timeline">Task Timeline: {tasks.length} tasks</div>
  ),
}));

describe('ExecutionDetail', () => {
  const mockOnClose = vi.fn();

  const mockExecution = {
    execution_id: 'exec-123',
    framework: 'crewai',
    trace_id: 'trace-123',
    service_name: 'test-crew',
    status: 'success',
    started_at: '2026-01-28T10:00:00Z',
    duration_ms: 5000,
    agents_used: ['Researcher', 'Writer', 'Reviewer'],
    handoffs: [
      {
        from_agent: 'Researcher',
        to_agent: 'Writer',
        reason: 'Research completed',
      },
      {
        from_agent: 'Writer',
        to_agent: 'Reviewer',
      },
    ],
    context_variables: ['user_id', 'session_id'],
  };

  const mockGraph = {
    nodes: [
      {
        id: 'agent-1',
        label: 'Researcher',
        type: 'agent' as const,
        invocations: 5,
        avg_duration_ms: 1500,
      },
    ],
    edges: [],
  };

  const mockTasks = [
    {
      task_id: 'task-1',
      task_name: 'Research Task',
      description: 'Research AI trends',
      status: 'completed' as const,
      assigned_agent: 'Researcher',
      duration_ms: 2000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(mockExecution);
    (multiAgentApi.fetchAgentGraph as any).mockResolvedValue(mockGraph);
    (multiAgentApi.fetchExecutionTasks as any).mockResolvedValue(mockTasks);
  });

  it('renders loading state initially', () => {
    (multiAgentApi.fetchExecutionDetail as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    expect(screen.getByText('Loading execution details...')).toBeInTheDocument();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders error state when execution not found', async () => {
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(null);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution not found')).toBeInTheDocument();
    });
  });

  it('calls onClose when Close button is clicked in error state', async () => {
    const user = userEvent.setup();
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(null);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution not found')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders execution details modal', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
      expect(screen.getByText('CrewAI • exec-123')).toBeInTheDocument();
    });
  });

  it('displays summary section with status, duration, and started time', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();

      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('5.0s')).toBeInTheDocument();

      expect(screen.getByText('Started At')).toBeInTheDocument();
    });
  });

  it('displays agents involved section', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Agents Involved')).toBeInTheDocument();
      // Agents may appear multiple times (in agents section and tasks), use getAllByText
      expect(screen.getAllByText('Researcher').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Writer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Reviewer').length).toBeGreaterThan(0);
    });
  });

  it('displays handoffs section when handoffs exist', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Agent Handoffs')).toBeInTheDocument();
      expect(screen.getByText('(Research completed)')).toBeInTheDocument();
    });
  });

  it('hides handoffs section when no handoffs', async () => {
    const executionWithoutHandoffs = {
      ...mockExecution,
      handoffs: [],
    };
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(executionWithoutHandoffs);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('Agent Handoffs')).not.toBeInTheDocument();
  });

  it('displays agent communication graph', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Agent Communication Graph')).toBeInTheDocument();
      expect(screen.getByTestId('agent-graph')).toBeInTheDocument();
      expect(screen.getByText('Agent Graph: 1 nodes')).toBeInTheDocument();
    });
  });

  it('displays tasks section for CrewAI framework', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByTestId('task-timeline')).toBeInTheDocument();
      expect(screen.getByText('Task Timeline: 1 tasks')).toBeInTheDocument();
    });
  });

  it('displays tasks section for AutoGen framework', async () => {
    const autogenExecution = {
      ...mockExecution,
      framework: 'autogen',
    };
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(autogenExecution);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByTestId('task-timeline')).toBeInTheDocument();
    });
  });

  it('does not fetch tasks for non-CrewAI/AutoGen frameworks', async () => {
    const langgraphExecution = {
      ...mockExecution,
      framework: 'langgraph',
    };
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(langgraphExecution);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    // Tasks should not be fetched for LangGraph
    expect(multiAgentApi.fetchExecutionTasks).not.toHaveBeenCalled();
  });

  it('hides tasks section when no tasks', async () => {
    (multiAgentApi.fetchExecutionTasks as any).mockResolvedValue([]);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
  });

  it('displays context variables section', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Context Variables')).toBeInTheDocument();
      expect(screen.getByText('user_id')).toBeInTheDocument();
      expect(screen.getByText('session_id')).toBeInTheDocument();
    });
  });

  it('hides context variables section when empty', async () => {
    const executionWithoutContext = {
      ...mockExecution,
      context_variables: [],
    };
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(executionWithoutContext);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('Context Variables')).not.toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    // Click the X button (close icon)
    const closeButton = screen.getAllByRole('button')[0]; // First button is the X
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when footer Close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    // Click the footer Close button
    const closeButtons = screen.getAllByText('Close');
    await user.click(closeButtons[closeButtons.length - 1]); // Last "Close" button

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays correct status badge styling for success', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      const successBadge = screen.getByText('Success');
      expect(successBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('displays correct status badge styling for error', async () => {
    const errorExecution = {
      ...mockExecution,
      status: 'error',
    };
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(errorExecution);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      const errorBadge = screen.getByText('Error');
      expect(errorBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  it('displays correct status badge styling for running', async () => {
    const runningExecution = {
      ...mockExecution,
      status: 'running',
    };
    (multiAgentApi.fetchExecutionDetail as any).mockResolvedValue(runningExecution);

    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      const runningBadge = screen.getByText('Running');
      expect(runningBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  it('renders modal with overlay', async () => {
    const { container } = render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument();
    });

    // Modal should have overlay with semi-transparent background
    expect(container.querySelector('.bg-gray-500.bg-opacity-75')).toBeInTheDocument();
  });

  it('passes correct projectId from auth context', async () => {
    render(<ExecutionDetail executionId="exec-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(multiAgentApi.fetchExecutionDetail).toHaveBeenCalledWith('default', 'exec-123');
      expect(multiAgentApi.fetchAgentGraph).toHaveBeenCalledWith('default', 'exec-123');
      expect(multiAgentApi.fetchExecutionTasks).toHaveBeenCalledWith('default', 'exec-123');
    });
  });
});
