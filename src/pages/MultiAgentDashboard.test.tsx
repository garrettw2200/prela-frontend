import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MultiAgentDashboard } from './MultiAgentDashboard';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';

// Use MSW handlers for API mocking

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ProjectProvider>
            <MultiAgentDashboard />
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('MultiAgentDashboard', () => {
  beforeEach(() => {
    localStorage.setItem('prela_auth_token', 'mock-token');
  });

  it('renders dashboard heading', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/multi-agent dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays stat cards', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/total executions/i)).toBeInTheDocument();
      expect(screen.getByText(/success rate/i)).toBeInTheDocument();
      expect(screen.getByText(/avg duration/i)).toBeInTheDocument();
      expect(screen.getByText(/active frameworks/i)).toBeInTheDocument();
    });
  });

  it('displays executions after loading', async () => {
    renderDashboard();

    await waitFor(
      () => {
        // Wait for execution list to render
        expect(screen.getByText(/recent executions/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays filters', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByLabelText(/framework/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });
  });

  it('renders without project context error', async () => {
    renderDashboard();

    // Should not show project selection error
    await waitFor(() => {
      expect(screen.queryByText(/select a project/i)).not.toBeInTheDocument();
    });
  });
});
