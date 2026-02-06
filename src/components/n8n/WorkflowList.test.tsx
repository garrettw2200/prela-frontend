import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkflowList } from './WorkflowList';
import { ProjectProvider } from '../../contexts/ProjectContext';

// Mock the QuickSetupCard component
vi.mock('../onboarding', () => ({
  QuickSetupCard: ({ projectId, webhookUrl }: { projectId: string; webhookUrl: string }) => (
    <div data-testid="quick-setup-card">
      Quick Setup Card (Project: {projectId}, Webhook: {webhookUrl})
    </div>
  ),
}));

function renderWorkflowList(projectId: string = 'test-project') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProjectProvider>
          <WorkflowList projectId={projectId} />
        </ProjectProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('WorkflowList', () => {
  it('renders loading skeleton initially', async () => {
    renderWorkflowList();

    // LoadingSkeleton should appear immediately (check by animate-pulse class)
    const skeletonElement = document.querySelector('.animate-pulse');
    expect(skeletonElement).toBeInTheDocument();
  });

  it('renders workflow table with data', async () => {
    renderWorkflowList();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('n8n Workflows')).toBeInTheDocument();
    });

    // Check for workflow names
    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
    expect(screen.getByText('Test Workflow 2')).toBeInTheDocument();
  });

  it('displays workflow count correctly', async () => {
    renderWorkflowList();

    await waitFor(() => {
      expect(screen.getByText(/2 workflows tracked/i)).toBeInTheDocument();
    });
  });

  it('displays workflow count correctly for single workflow', async () => {
    renderWorkflowList('single-workflow-project');

    await waitFor(() => {
      expect(screen.getByText(/1 workflow tracked/i)).toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', async () => {
    renderWorkflowList();

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  it('renders table headers correctly', async () => {
    renderWorkflowList();

    await waitFor(() => {
      expect(screen.getByText('Workflow')).toBeInTheDocument();
      expect(screen.getByText('Executions (24h)')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
      expect(screen.getByText('AI Calls')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(screen.getByText('Last Run')).toBeInTheDocument();
    });
  });

  it('displays workflow metrics correctly', async () => {
    renderWorkflowList();

    await waitFor(() => {
      // Check execution count
      expect(screen.getByText('100')).toBeInTheDocument();

      // Check success rate badges
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('98.0%')).toBeInTheDocument();

      // Check duration formatting
      expect(screen.getByText('2.0s')).toBeInTheDocument();
      expect(screen.getByText('1.5s')).toBeInTheDocument();

      // Check AI calls (there are multiple "50" on page, so check for at least one)
      expect(screen.getAllByText('50').length).toBeGreaterThan(0);
      expect(screen.getByText('25')).toBeInTheDocument();

      // Check cost
      expect(screen.getByText('$1.23')).toBeInTheDocument();
      expect(screen.getByText('$0.67')).toBeInTheDocument();
    });
  });

  it('displays token counts in compact format', async () => {
    renderWorkflowList();

    await waitFor(() => {
      // Token counts displayed in parentheses
      expect(screen.getByText(/\(10\.0k\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(5\.0k\)/)).toBeInTheDocument();
    });
  });

  it('renders workflow links correctly', async () => {
    renderWorkflowList();

    await waitFor(() => {
      const link1 = screen.getByRole('link', { name: 'Test Workflow 1' });
      const link2 = screen.getByRole('link', { name: 'Test Workflow 2' });

      expect(link1).toHaveAttribute('href', '/n8n/workflows/wf1');
      expect(link2).toHaveAttribute('href', '/n8n/workflows/wf2');
    });
  });

  it('applies correct success rate badge colors', async () => {
    renderWorkflowList();

    await waitFor(() => {
      const badge95 = screen.getByText('95.0%');
      const badge98 = screen.getByText('98.0%');

      // 95% should be green (>= 95)
      expect(badge95).toHaveClass('bg-green-100', 'text-green-800');

      // 98% should be green (>= 95)
      expect(badge98).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('renders empty state when no workflows', async () => {
    renderWorkflowList('empty-project');

    await waitFor(() => {
      expect(screen.getByText(/Get Started with n8n Tracing/i)).toBeInTheDocument();
      expect(screen.getByText(/No workflows found yet/i)).toBeInTheDocument();
    });

    // QuickSetupCard should be rendered
    expect(screen.getByTestId('quick-setup-card')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    renderWorkflowList('error-project');

    await waitFor(() => {
      expect(screen.getByText(/Failed to load workflows/i)).toBeInTheDocument();
    });
  });
});
