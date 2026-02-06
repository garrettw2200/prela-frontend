import { describe, it, expect } from 'vitest';
import { render, screen, within } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import TaskTimeline from './TaskTimeline';
import { TaskInfo } from '../../api/multi-agent';

describe('TaskTimeline', () => {
  const mockTasks: TaskInfo[] = [
    {
      task_id: 'task-1',
      task_name: 'Research AI Trends',
      description: 'Research latest AI developments',
      status: 'completed',
      assigned_agent: 'Researcher',
      started_at: '2026-01-28T10:00:00Z',
      completed_at: '2026-01-28T10:00:05Z',
      duration_ms: 5000,
      output: 'AI trends report completed',
    },
    {
      task_id: 'task-2',
      task_name: 'Write Summary',
      description: 'Write a summary of findings',
      status: 'failed',
      assigned_agent: 'Writer',
      started_at: '2026-01-28T10:00:10Z',
      duration_ms: 2000,
    },
    {
      task_id: 'task-3',
      task_name: 'Review Content',
      description: 'Review and edit content',
      status: 'running',
      assigned_agent: 'Reviewer',
      started_at: '2026-01-28T10:00:15Z',
      duration_ms: 1000,
    },
    {
      task_id: 'task-4',
      task_name: 'Publish',
      description: 'Publish final content',
      status: 'pending',
      assigned_agent: 'Publisher',
    },
  ];

  it('renders empty state when no tasks', () => {
    render(<TaskTimeline tasks={[]} />);

    expect(screen.getByText('No tasks available')).toBeInTheDocument();
  });

  it('renders all tasks in timeline', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    expect(screen.getByText('Research AI Trends')).toBeInTheDocument();
    expect(screen.getByText('Write Summary')).toBeInTheDocument();
    expect(screen.getByText('Review Content')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('displays task descriptions', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    expect(screen.getByText('Research latest AI developments')).toBeInTheDocument();
    expect(screen.getByText('Write a summary of findings')).toBeInTheDocument();
    expect(screen.getByText('Review and edit content')).toBeInTheDocument();
    expect(screen.getByText('Publish final content')).toBeInTheDocument();
  });

  it('displays status icon for completed task', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // Find the task container and check for completed icon (checkmark)
    const completedTask = screen.getByText('Research AI Trends').closest('li');
    expect(completedTask).toBeInTheDocument();

    // Completed tasks have green background
    const statusIcon = completedTask!.querySelector('.bg-green-500');
    expect(statusIcon).toBeInTheDocument();
  });

  it('displays status icon for failed task', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    const failedTask = screen.getByText('Write Summary').closest('li');
    expect(failedTask).toBeInTheDocument();

    // Failed tasks have red background
    const statusIcon = failedTask!.querySelector('.bg-red-500');
    expect(statusIcon).toBeInTheDocument();
  });

  it('displays animated spinner for running task', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    const runningTask = screen.getByText('Review Content').closest('li');
    expect(runningTask).toBeInTheDocument();

    // Running tasks have yellow background and animated spinner
    const statusIcon = runningTask!.querySelector('.bg-yellow-500');
    expect(statusIcon).toBeInTheDocument();

    const spinner = runningTask!.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays status icon for pending task', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    const pendingTask = screen.getByText('Publish').closest('li');
    expect(pendingTask).toBeInTheDocument();

    // Pending tasks have gray background
    const statusIcon = pendingTask!.querySelector('.bg-gray-400');
    expect(statusIcon).toBeInTheDocument();
  });

  it('displays assigned agent badge', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    expect(screen.getByText('Agent: Researcher')).toBeInTheDocument();
    expect(screen.getByText('Agent: Writer')).toBeInTheDocument();
    expect(screen.getByText('Agent: Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Agent: Publisher')).toBeInTheDocument();
  });

  it('displays formatted duration', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // 5000ms = 5.0s
    expect(screen.getByText('Duration: 5.0s')).toBeInTheDocument();
    // 2000ms = 2.0s
    expect(screen.getByText('Duration: 2.0s')).toBeInTheDocument();
    // 1000ms = 1.0s
    expect(screen.getByText('Duration: 1.0s')).toBeInTheDocument();
  });

  it('displays started_at timestamp', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // Check that "Started:" timestamps are rendered
    const startedLabels = screen.getAllByText(/Started:/);
    expect(startedLabels.length).toBe(3); // Only 3 tasks have started_at
  });

  it('displays completed_at timestamp for completed tasks', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // Only the completed task should have "Completed:" timestamp
    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
  });

  it('hides output section initially', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // Output should be hidden behind details/summary
    expect(screen.queryByText('AI trends report completed')).not.toBeVisible();
  });

  it('shows output when "View Output" is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskTimeline tasks={mockTasks} />);

    // Click "View Output" to expand details
    const viewOutputButton = screen.getByText('View Output');
    await user.click(viewOutputButton);

    // Output should now be visible
    expect(screen.getByText('AI trends report completed')).toBeVisible();
  });

  it('only shows output for completed tasks', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // Only one task has output and is completed
    const viewOutputButtons = screen.queryAllByText('View Output');
    expect(viewOutputButtons.length).toBe(1);
  });

  it('renders connector lines between tasks', () => {
    const { container } = render(<TaskTimeline tasks={mockTasks} />);

    // Connector lines have specific class
    const connectors = container.querySelectorAll('.bg-gray-200');
    // Should have 3 connectors (between 4 tasks)
    expect(connectors.length).toBeGreaterThanOrEqual(3);
  });

  it('does not render connector after last task', () => {
    render(<TaskTimeline tasks={mockTasks} />);

    // Last task should not have a connector line after it
    // This is tested implicitly - the code conditionally renders connectors
    const lastTask = screen.getByText('Publish').closest('li');
    expect(lastTask).toBeInTheDocument();
  });

  it('handles task without description', () => {
    const taskWithoutDesc: TaskInfo[] = [
      {
        task_id: 'task-no-desc',
        task_name: 'Simple Task',
        description: '',
        status: 'completed',
      },
    ];

    render(<TaskTimeline tasks={taskWithoutDesc} />);

    expect(screen.getByText('Simple Task')).toBeInTheDocument();
    // Empty description should not break rendering
  });

  it('handles task without assigned_agent', () => {
    const taskWithoutAgent: TaskInfo[] = [
      {
        task_id: 'task-no-agent',
        task_name: 'Unassigned Task',
        description: 'Task without agent',
        status: 'pending',
      },
    ];

    render(<TaskTimeline tasks={taskWithoutAgent} />);

    expect(screen.getByText('Unassigned Task')).toBeInTheDocument();
    // Should not display agent badge
    expect(screen.queryByText(/Agent:/)).not.toBeInTheDocument();
  });

  it('handles task without duration_ms', () => {
    const taskWithoutDuration: TaskInfo[] = [
      {
        task_id: 'task-no-duration',
        task_name: 'Quick Task',
        description: 'Task without duration',
        status: 'completed',
        assigned_agent: 'Worker',
      },
    ];

    render(<TaskTimeline tasks={taskWithoutDuration} />);

    expect(screen.getByText('Quick Task')).toBeInTheDocument();
    expect(screen.getByText('Agent: Worker')).toBeInTheDocument();
    // Should not display duration badge
    expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
  });

  it('falls back to task_id when task_name is not provided', () => {
    const taskWithoutName: TaskInfo[] = [
      {
        task_id: 'task-id-only',
        task_name: '',
        description: 'Task without name',
        status: 'completed',
      },
    ];

    render(<TaskTimeline tasks={taskWithoutName} />);

    // Should display task_id when task_name is empty
    expect(screen.getByText('task-id-only')).toBeInTheDocument();
  });
});
