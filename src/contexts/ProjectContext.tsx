import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, ProjectSummary } from '../api/projects';

interface ProjectContextType {
  currentProject: ProjectSummary | null;
  projects: ProjectSummary[];
  isLoading: boolean;
  error: Error | null;
  selectProject: (projectId: string) => void;
  refreshProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  // Load projects with React Query
  const queryClient = useQueryClient();
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(100, 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Persist selected project in localStorage
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem('prela_current_project');
  });

  // Update currentProject when projects load or selection changes
  const currentProject =
    projects.find((p) => p.project_id === currentProjectId) || projects[0] || null;

  // Select project and persist
  const selectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    localStorage.setItem('prela_current_project', projectId);

    // Invalidate all queries that depend on projectId
    queryClient.invalidateQueries({ queryKey: ['n8n-workflows'] });
    queryClient.invalidateQueries({ queryKey: ['n8n-workflow-detail'] });
    queryClient.invalidateQueries({ queryKey: ['n8n-executions'] });
    queryClient.invalidateQueries({ queryKey: ['n8n-ai-nodes'] });
    queryClient.invalidateQueries({ queryKey: ['execution-timeline'] });
    queryClient.invalidateQueries({ queryKey: ['multi-agent-executions'] });
  };

  // Auto-select first project on mount if none selected
  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      selectProject(projects[0].project_id);
    }
  }, [projects, currentProjectId]);

  const refreshProjects = () => {
    refetch();
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        isLoading,
        error: error as Error | null,
        selectProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
