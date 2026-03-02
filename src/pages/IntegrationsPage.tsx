import { Link } from 'react-router-dom';

interface Integration {
  name: string;
  description: string;
  path: string;
  logo: string;
  category: string;
}

const integrations: Integration[] = [
  {
    name: 'n8n',
    description: 'Monitor n8n workflow executions, track costs, and observe AI node performance.',
    path: '/n8n',
    logo: 'n8n',
    category: 'Workflow Automation',
  },
  {
    name: 'Langfuse',
    description: 'Import traces and evals from Langfuse into Prela for drift detection and replay.',
    path: '/data-sources',
    logo: 'langfuse',
    category: 'Observability',
  },
];

function IntegrationLogo({ name }: { name: string }) {
  if (name === 'n8n') {
    return (
      <div className="w-12 h-12 rounded-lg bg-[#EA4B71] flex items-center justify-center text-white font-bold text-lg">
        n8n
      </div>
    );
  }
  if (name === 'langfuse') {
    return (
      <div className="w-12 h-12 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-white font-bold text-sm tracking-tight">LF</span>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
      ?
    </div>
  );
}

export function IntegrationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your tools to send traces and workflow data into Prela.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Link
            key={integration.name}
            to={integration.path}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start gap-4">
              <IntegrationLogo name={integration.logo} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {integration.name}
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {integration.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  {integration.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-500">
          More integrations coming soon — OpenAI, LangChain, LlamaIndex, Vertex AI, and more.
        </p>
      </div>
    </div>
  );
}
