import { Navigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';

/**
 * Redirects flat routes (e.g. /insights) to project-scoped equivalents
 * (e.g. /projects/:projectId/insights) using the current project from context.
 */
export function ProjectRedirect({ to }: { to: string }) {
  const { currentProject, isLoading } = useProject();

  // Wait for projects to load before redirecting
  if (isLoading) return null;

  const projectId = currentProject?.project_id;
  if (!projectId) {
    // No projects yet — send to project management to create one
    return <Navigate to="/projects/manage" replace />;
  }

  return <Navigate to={`/projects/${projectId}/${to}`} replace />;
}
