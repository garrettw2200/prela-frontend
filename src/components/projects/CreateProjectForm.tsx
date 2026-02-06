import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../../contexts/ProjectContext';
import { createProject, Project, ProjectCreate } from '../../api/projects';

interface CreateProjectFormProps {
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export function CreateProjectForm({ onClose, onSuccess }: CreateProjectFormProps) {
  const queryClient = useQueryClient();
  const { refreshProjects } = useProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [autoGenerateId, setAutoGenerateId] = useState(true);

  // Auto-generate project ID from name
  const generateProjectId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Update project ID when name changes (if auto-generate is on)
  const handleNameChange = (value: string) => {
    setName(value);
    if (autoGenerateId) {
      setProjectId(generateProjectId(value));
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => createProject(data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refreshProjects();
      onSuccess(project);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: ProjectCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
      project_id: projectId.trim() || undefined,
    };

    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Create New Project
              </h3>

              {/* Name Field */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Production n8n"
                  autoFocus
                />
              </div>

              {/* Description Field */}
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Main production workflows"
                />
              </div>

              {/* Project ID Field */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                    Project ID
                  </label>
                  <label className="flex items-center text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={autoGenerateId}
                      onChange={(e) => {
                        setAutoGenerateId(e.target.checked);
                        if (e.target.checked) {
                          setProjectId(generateProjectId(name));
                        }
                      }}
                      className="mr-1 rounded"
                    />
                    Auto-generate
                  </label>
                </div>
                <input
                  type="text"
                  id="projectId"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setAutoGenerateId(false);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="production-n8n"
                  disabled={autoGenerateId}
                />
                <p className="mt-1 text-xs text-gray-500">Used in webhook URLs and API calls</p>
              </div>

              {/* Error Message */}
              {createMutation.isError && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">
                    {createMutation.error?.message || 'Failed to create project'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={createMutation.isPending}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
