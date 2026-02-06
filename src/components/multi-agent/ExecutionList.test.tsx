import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import ExecutionList from './ExecutionList';
import { ExecutionSummary } from '../../api/multi-agent';

// Mock ExecutionDetail component to avoid rendering complexity
vi.mock('../../pages/ExecutionDetail', () => ({
  default: ({ executionId, onClose }: { executionId: string; onClose: () => void }) => (
    <div data-testid="execution-detail-modal">
      <p>Execution Detail Modal: {executionId}</p>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

describe('ExecutionList', () => {
  const mockExecutions: ExecutionSummary[] = [
    {
      execution_id: 'exec-1',
      trace_id: 'trace-1',
      framework: 'crewai',
      service_name: 'test-crew',
      status: 'success',
      started_at: '2026-01-28T10:00:00Z',
      duration_ms: 5000,
      num_agents: 3,
      num_handoffs: 2,
    },
    {
      execution_id: 'exec-2',
      trace_id: 'trace-2',
      framework: 'autogen',
      service_name: 'test-autogen',
      status: 'error',
      started_at: '2026-01-28T11:00:00Z',
      duration_ms: 3000,
      num_agents: 2,
      num_handoffs: 0,
    },
    {
      execution_id: 'exec-3',
      trace_id: 'trace-3',
      framework: 'langgraph',
      service_name: 'test-langgraph',
      status: 'running',
      started_at: '2026-01-28T12:00:00Z',
      duration_ms: 1000,
      num_agents: 1,
    },
  ];

  it('renders loading state', () => {
    const { container } = render(<ExecutionList executions={[]} isLoading={true} />);

    expect(screen.getByText('Loading executions...')).toBeInTheDocument();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-indigo-600');
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch executions';
    render(<ExecutionList executions={[]} isLoading={false} error={errorMessage} />);

    expect(screen.getByText('Failed to load executions')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<ExecutionList executions={[]} isLoading={false} />);

    expect(screen.getByText('No executions found')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your filters or run a multi-agent execution')
    ).toBeInTheDocument();
  });

  it('renders table with executions', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    // Check table headers
    expect(screen.getByText('Execution ID')).toBeInTheDocument();
    expect(screen.getByText('Framework')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Started At')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check execution data is rendered
    expect(screen.getByText('exec-1...')).toBeInTheDocument();
    expect(screen.getByText('exec-2...')).toBeInTheDocument();
    expect(screen.getByText('exec-3...')).toBeInTheDocument();
  });

  it('displays framework badges with correct names', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    expect(screen.getByText('CrewAI')).toBeInTheDocument();
    expect(screen.getByText('AutoGen')).toBeInTheDocument();
    expect(screen.getByText('LangGraph')).toBeInTheDocument();
  });

  it('displays status badges with correct styling', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    const successBadge = screen.getByText('Success');
    const errorBadge = screen.getByText('Error');
    const runningBadge = screen.getByText('Running');

    expect(successBadge).toHaveClass('bg-green-100', 'text-green-800');
    expect(errorBadge).toHaveClass('bg-red-100', 'text-red-800');
    expect(runningBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('displays agent count with correct pluralization', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    expect(screen.getByText('3 agents • 2 handoffs')).toBeInTheDocument();
    expect(screen.getByText('2 agents')).toBeInTheDocument();
    expect(screen.getByText('1 agent')).toBeInTheDocument();
  });

  it('handles missing num_agents gracefully', () => {
    const executionWithoutAgents: ExecutionSummary[] = [
      {
        execution_id: 'exec-no-agents',
        trace_id: 'trace-no-agents',
        framework: 'crewai',
        service_name: 'test',
        status: 'success',
        started_at: '2026-01-28T10:00:00Z',
        duration_ms: 1000,
      },
    ];

    render(<ExecutionList executions={executionWithoutAgents} isLoading={false} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('formats duration correctly', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    // 5000ms = 5.0s
    expect(screen.getByText('5.0s')).toBeInTheDocument();
    // 3000ms = 3.0s
    expect(screen.getByText('3.0s')).toBeInTheDocument();
    // 1000ms = 1.0s
    expect(screen.getByText('1.0s')).toBeInTheDocument();
  });

  it('formats started_at timestamp correctly', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    // Check that timestamps are rendered (exact format may vary by locale)
    const timestamps = screen.getAllByText(/1\/28\/2026/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('opens ExecutionDetail modal when View Details is clicked', async () => {
    const user = userEvent.setup();
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    // Click "View Details" for first execution
    const viewDetailsButtons = screen.getAllByText('View Details');
    await user.click(viewDetailsButtons[0]);

    // Modal should be rendered
    await waitFor(() => {
      expect(screen.getByTestId('execution-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Execution Detail Modal: exec-1')).toBeInTheDocument();
    });
  });

  it('closes ExecutionDetail modal when Close is clicked', async () => {
    const user = userEvent.setup();
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    await user.click(viewDetailsButtons[0]);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByTestId('execution-detail-modal')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close Modal');
    await user.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('execution-detail-modal')).not.toBeInTheDocument();
    });
  });

  it('handles row hover state', () => {
    render(<ExecutionList executions={mockExecutions} isLoading={false} />);

    const rows = screen.getAllByRole('row');
    // First row is header, skip it
    const dataRow = rows[1];

    expect(dataRow).toHaveClass('hover:bg-gray-50');
  });

  it('truncates long execution IDs', () => {
    const longIdExecution: ExecutionSummary[] = [
      {
        execution_id: 'very-long-execution-id-12345678',
        trace_id: 'trace-1',
        framework: 'crewai',
        service_name: 'test',
        status: 'success',
        started_at: '2026-01-28T10:00:00Z',
        duration_ms: 1000,
        num_agents: 1,
      },
    ];

    render(<ExecutionList executions={longIdExecution} isLoading={false} />);

    // Should show first 8 characters + ellipsis
    expect(screen.getByText('very-lon...')).toBeInTheDocument();
  });
});
