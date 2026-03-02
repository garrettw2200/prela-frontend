import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listApiKeys } from '../../api/apiKeys';
import { useToast } from '../Toast';

interface InsightsOnboardingProps {
  traceCount: number;
}

export function InsightsOnboarding({ traceCount }: InsightsOnboardingProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const prevTraceCountRef = useRef(traceCount);

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys-onboarding'],
    queryFn: () => listApiKeys(),
    staleTime: 30 * 1000,
  });

  const hasApiKey = (apiKeys?.length ?? 0) > 0;
  const hasTraces = traceCount > 0;

  // Dismiss with toast when first trace arrives
  useEffect(() => {
    if (prevTraceCountRef.current === 0 && traceCount > 0) {
      showToast('success', 'First trace received! Your insights are now populating.');
    }
    prevTraceCountRef.current = traceCount;
  }, [traceCount, showToast]);

  const apiKeyValue = hasApiKey ? apiKeys![0].key_prefix + '...' : 'YOUR_KEY';

  const codeSnippet = `pip install prela

import prela
prela.init("${apiKeyValue}")`;

  function handleCopy() {
    const installSnippet = `pip install prela\n\nimport prela\nprela.init("YOUR_KEY")`;
    navigator.clipboard.writeText(installSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    {
      number: 1,
      title: 'Get your API key',
      done: hasApiKey,
      action: !hasApiKey ? (
        <button
          onClick={() => navigate('/api-keys')}
          className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Go to API Keys →
        </button>
      ) : null,
    },
    {
      number: 2,
      title: 'Send your first trace',
      done: hasTraces,
      action: !hasTraces ? (
        <div className="mt-2">
          <pre className="rounded bg-gray-900 px-4 py-3 text-left text-xs text-green-400 whitespace-pre">
            {codeSnippet}
          </pre>
          <button
            onClick={handleCopy}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {copied ? 'Copied!' : 'Copy snippet'}
          </button>
        </div>
      ) : null,
    },
    {
      number: 3,
      title: 'Insights appear here automatically',
      done: hasTraces,
      action: null,
    },
  ];

  // Hide once traces exist (dashboard will render instead)
  if (hasTraces) return null;

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <div className="mx-auto max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">Welcome to Prela</h3>
        <p className="mt-1 text-sm text-gray-500">Get your first insights in 3 steps</p>

        <ol className="mt-6 space-y-6">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-4">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  step.done
                    ? 'bg-green-100 text-green-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {step.done ? '✓' : step.number}
              </div>
              <div className="flex-1 pt-0.5">
                <p className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {step.title}
                </p>
                {step.action}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500">
            Already using Langfuse?{' '}
            <button
              onClick={() => navigate('/data-sources')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Connect Langfuse →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
