import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import { useQuery } from '@tanstack/react-query';
import { fetchWebhookStatus } from '../../api/projects';

export function ProjectSelector() {
  const { currentProject, projects, selectProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch webhook status for current project
  const { data: webhookStatus } = useQuery({
    queryKey: ['webhook-status', currentProject?.project_id],
    queryFn: () => fetchWebhookStatus(currentProject!.project_id),
    enabled: !!currentProject,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Filter projects by search query
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (projectId: string) => {
    selectProject(projectId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Status indicator emoji
  const statusIndicator = webhookStatus?.status === 'active' ? '🟢' : '🔴';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{statusIndicator}</span>
        <span className="truncate max-w-[200px]">
          {currentProject?.name || 'Select Project'}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-2">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Project List */}
          <div className="max-h-60 overflow-auto py-1" role="listbox">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No projects found</div>
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.project_id}
                  onClick={() => handleSelect(project.project_id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 ${
                    currentProject?.project_id === project.project_id ? 'bg-indigo-50' : ''
                  }`}
                  role="option"
                  aria-selected={currentProject?.project_id === project.project_id}
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{project.name}</div>
                    <div className="text-xs text-gray-500">
                      {project.workflow_count} workflows · {project.trace_count_24h} traces (24h)
                    </div>
                  </div>
                  {currentProject?.project_id === project.project_id && (
                    <svg
                      className="h-5 w-5 text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Manage Projects Link */}
          <div className="border-t border-gray-200 p-2">
            <Link
              to="/projects/manage"
              className="block w-full rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsOpen(false)}
            >
              Manage Projects →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
