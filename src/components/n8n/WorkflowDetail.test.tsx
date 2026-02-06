import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkflowDetail } from './WorkflowDetail';

// Mock ReactFlow to avoid complex graph rendering in tests
vi.mock('reactflow', () => ({
  default: ({ nodes, edges }: any) => (
    <div data-testid="react-flow-mock">
      ReactFlow Mock ({nodes?.length || 0} nodes, {edges?.length || 0} edges)
    </div>
  ),
  Background: () => <div>Background</div>,
  Controls: () => <div>Controls</div>,
  MiniMap: () => <div>MiniMap</div>,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

// Mock ExecutionTimeline component
vi.mock('./ExecutionTimeline', () => ({
  ExecutionTimeline: ({ executionId }: { executionId: string }) => (
    <div data-testid="execution-timeline">ExecutionTimeline: {executionId}</div>
  ),
}));

function renderWorkflowDetail(workflowId: string = 'wf-123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/workflows/${workflowId}`]}>
        <Routes>
          <Route path="/workflows/:workflowId" element={<WorkflowDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WorkflowDetail', () => {
  it('renders loading state initially', () => {
    renderWorkflowDetail();

    // Check for loading text (component shows loading immediately before data arrives)
    expect(screen.getByText(/Loading workflow details/i)).toBeInTheDocument();
  });

  it('renders workflow name and breadcrumb', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });

    // Check for breadcrumb navigation
    expect(screen.getByText(/Back to Workflows/i)).toBeInTheDocument();
  });

  it('displays workflow metrics', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      // Check for Last 24 Hours section header
      expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();

      // Check for metric values (use getAllByText since some appear multiple times)
      expect(screen.getAllByText(/Executions/i).length).toBeGreaterThan(0);
      expect(screen.getByText('100')).toBeInTheDocument();

      // Success Rate
      expect(screen.getAllByText(/Success Rate/i).length).toBeGreaterThan(0);
      expect(screen.getByText('95.0%')).toBeInTheDocument();

      // Avg Duration and Total Cost labels
      expect(screen.getAllByText(/Avg Duration/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Total Cost/i).length).toBeGreaterThan(0);
    });
  });

  it('renders ReactFlow graph component', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    });
  });

  it('displays AI nodes section', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      // Check for AI Nodes section header (use getAllByText since "AI nodes" appears elsewhere)
      expect(screen.getAllByText(/AI Nodes/i).length).toBeGreaterThan(0);
    });
  });

  it('displays recent executions list', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      expect(screen.getByText(/Recent Executions/i)).toBeInTheDocument();
    });
  });

  it('renders execution timeline when execution is selected', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      // Click on an execution button to select it
      const executionButton = screen.getByText(/✓ Success/i).closest('button');
      if (executionButton) {
        executionButton.click();
      }
    });

    // Timeline modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('execution-timeline')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    renderWorkflowDetail('error-workflow');

    await waitFor(() => {
      expect(screen.getByText(/Failed to load workflow details/i)).toBeInTheDocument();
    });
  });

  it('formats duration correctly', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      // Duration should be formatted (2000ms = 2.0s) - appears multiple times
      expect(screen.getAllByText('2.0s').length).toBeGreaterThan(0);
    });
  });

  it('formats cost correctly', async () => {
    renderWorkflowDetail();

    await waitFor(() => {
      // Cost should be formatted with $ symbol
      expect(screen.getByText(/\$1\.23/)).toBeInTheDocument();
    });
  });
});
