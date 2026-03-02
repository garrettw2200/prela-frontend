import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';

/**
 * Syncs the :projectId URL param into ProjectContext whenever a user
 * navigates directly to a project-scoped URL (deep link or bookmark).
 */
export function ProjectRouteSync() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, selectProject } = useProject();

  useEffect(() => {
    if (projectId && projectId !== currentProject?.project_id) {
      selectProject(projectId);
    }
  }, [projectId, currentProject?.project_id, selectProject]);

  return <Outlet />;
}
