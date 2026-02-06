import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import { MemoryRouter } from 'react-router-dom';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Layout', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Set auth token for authenticated tests
    localStorageMock.setItem('prela_auth_token', 'test-token');
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  function renderWithRouter(initialRoute = '/') {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return rtlRender(
      <MemoryRouter initialEntries={[initialRoute]}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProjectProvider>
              <Layout>
                <div>Page Content</div>
              </Layout>
            </ProjectProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  it('renders logo', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Prela')).toBeInTheDocument();
    });
  });

  it('renders navigation items', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('n8n Workflows')).toBeInTheDocument();
      expect(screen.getByText('Multi-Agent')).toBeInTheDocument();
    });
  });

  it('renders user email', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('renders logout button', async () => {
    renderWithRouter();

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  it('calls logout when logout button clicked', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    logoutButton.click();

    // Auth token should be removed
    expect(localStorageMock.getItem('prela_auth_token')).toBeNull();
    // Should redirect to login
    expect(window.location.href).toBe('/login');
  });

  it('renders children content', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });
  });

  it('highlights active navigation item', async () => {
    renderWithRouter('/n8n');

    await waitFor(() => {
      expect(screen.getByText('n8n Workflows')).toBeInTheDocument();
    });

    const n8nLink = screen.getByText('n8n Workflows').closest('a');
    expect(n8nLink).toHaveClass('border-indigo-500');
    expect(n8nLink).toHaveClass('text-gray-900');
  });

  it('does not highlight inactive navigation item', async () => {
    renderWithRouter('/n8n');

    await waitFor(() => {
      expect(screen.getByText('Multi-Agent')).toBeInTheDocument();
    });

    const multiAgentLink = screen.getByText('Multi-Agent').closest('a');
    expect(multiAgentLink).toHaveClass('border-transparent');
    expect(multiAgentLink).toHaveClass('text-gray-500');
  });

  it('renders ProjectSelector component', async () => {
    renderWithRouter();

    await waitFor(() => {
      // ProjectSelector renders the default project name
      expect(screen.getByText('Default Project')).toBeInTheDocument();
    });
  });

  it('has correct navigation structure', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Prela')).toBeInTheDocument();
    });

    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('bg-white');
    expect(nav).toHaveClass('shadow-sm');
  });

  it('renders main content area', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
