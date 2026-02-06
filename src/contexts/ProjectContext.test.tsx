import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectProvider, useProject } from './ProjectContext';

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
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>{children}</ProjectProvider>
    </QueryClientProvider>
  );
}

describe('ProjectContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('provides project context', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(result.current.projects).toBeDefined();
  });

  it('loads projects from API', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].project_id).toBe('default');
    expect(result.current.projects[0].name).toBe('Default Project');
  });

  it('auto-selects first project if none selected', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.currentProject).not.toBeNull();
    });

    expect(result.current.currentProject?.project_id).toBe('default');
  });

  it('persists selected project to localStorage', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.currentProject).not.toBeNull();
    });

    expect(localStorageMock.getItem('prela_current_project')).toBe('default');
  });

  it('allows selecting a different project', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.currentProject).not.toBeNull();
    });

    act(() => {
      result.current.selectProject('new-project-id');
    });

    expect(localStorageMock.getItem('prela_current_project')).toBe('new-project-id');
  });

  it('starts with isLoading true', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('throws error when useProject is used outside ProjectProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useProject());
    }).toThrow('useProject must be used within ProjectProvider');

    consoleError.mockRestore();
  });

  it('provides refreshProjects function', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refreshProjects).toBeDefined();
    expect(typeof result.current.refreshProjects).toBe('function');
  });
});
