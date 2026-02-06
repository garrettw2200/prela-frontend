import { useState } from 'react';

interface QuickSetupCardProps {
  projectId: string;
  webhookUrl: string;
  onClose?: () => void;
  showAsModal?: boolean;
}

export function QuickSetupCard({
  projectId,
  webhookUrl,
  onClose,
  showAsModal = false,
}: QuickSetupCardProps) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = async (text: string, step: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(step);
      setTimeout(() => setCopiedStep(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const steps = [
    {
      title: '1. Start webhook receiver',
      description: 'Run this Python code to start receiving n8n webhook events',
      code: `import prela

prela.init(
    service_name="n8n-workflows",
    project_id="${projectId}",
    n8n_webhook_port=8787
)

# Keep the process alive
import time
while True:
    time.sleep(1)`,
      language: 'python',
    },
    {
      title: '2. Webhook URL for n8n',
      description: 'Add this URL to your n8n HTTP Request node',
      code: webhookUrl,
      language: 'text',
    },
    {
      title: '3. n8n HTTP Request node body',
      description: 'Use this JSON in the "Body" field of your n8n HTTP Request node',
      code: `{
  "workflow": "={{ $workflow }}",
  "execution": "={{ $execution }}",
  "node": "={{ $node }}",
  "data": "={{ $json }}"
}`,
      language: 'json',
    },
  ];

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">n8n Setup - 3 Steps</h2>
        <p className="mt-1 text-sm text-gray-600">
          Copy and paste the code snippets below to start tracing n8n workflows
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-gray-600">{step.description}</p>
              </div>
              <button
                onClick={() => copyToClipboard(step.code, index)}
                className="ml-4 inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {copiedStep === index ? (
                  <>
                    <svg
                      className="-ml-0.5 mr-1 h-3 w-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg
                      className="-ml-0.5 mr-1 h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-100">
              <code>{step.code}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <a
          href="https://docs.prela.dev/integrations/n8n"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          View Full Documentation →
        </a>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />
          <div className="relative inline-block w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow ring-1 ring-gray-200">
      {content}
    </div>
  );
}
