import { TaskInfo, formatDuration } from '../../api/multi-agent';

interface TaskTimelineProps {
  tasks: TaskInfo[];
}

export default function TaskTimeline({ tasks }: TaskTimelineProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-gray-500">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flow-root">
        <ul className="-mb-8">
          {tasks.map((task, taskIdx) => (
            <li key={task.task_id}>
              <div className="relative pb-8">
                {/* Connector line */}
                {taskIdx !== tasks.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}

                <div className="relative flex space-x-3">
                  {/* Status Icon */}
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        task.status === 'completed'
                          ? 'bg-green-500'
                          : task.status === 'failed'
                            ? 'bg-red-500'
                            : task.status === 'running'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                      }`}
                    >
                      {task.status === 'completed' ? (
                        <svg
                          className="h-5 w-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : task.status === 'failed' ? (
                        <svg
                          className="h-5 w-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : task.status === 'running' ? (
                        <svg
                          className="h-5 w-5 text-white animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </div>

                  {/* Task Details */}
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.task_name || task.task_id}
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      {task.assigned_agent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Agent: {task.assigned_agent}
                        </span>
                      )}

                      {task.duration_ms !== undefined && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Duration: {formatDuration(task.duration_ms)}
                        </span>
                      )}

                      {task.started_at && (
                        <span className="text-xs text-gray-500">
                          Started: {new Date(task.started_at).toLocaleString()}
                        </span>
                      )}

                      {task.completed_at && (
                        <span className="text-xs text-gray-500">
                          Completed: {new Date(task.completed_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Task Output (if completed) */}
                    {task.output && task.status === 'completed' && (
                      <div className="mt-2">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                            View Output
                          </summary>
                          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {task.output}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
