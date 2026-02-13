import { useEffect, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import {
  listDataSources,
  createDataSource,
  deleteDataSource,
  triggerSync,
  testConnection,
  DataSource,
} from '../api/dataSources';

export function DataSourcesPage() {
  const { currentProject } = useProject();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formHost, setFormHost] = useState('https://cloud.langfuse.com');
  const [formPublicKey, setFormPublicKey] = useState('');
  const [formSecretKey, setFormSecretKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDataSources();
  }, []);

  async function loadDataSources() {
    try {
      setLoading(true);
      setError(null);
      const sources = await listDataSources();
      setDataSources(sources);
    } catch (err) {
      console.error('Failed to load data sources:', err);
      setError('Failed to load data sources. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);
      const result = await testConnection({
        type: 'langfuse',
        config: {
          host: formHost,
          public_key: formPublicKey,
          secret_key: formSecretKey,
        },
      });
      setTestResult(result);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Connection failed';
      setTestResult({ success: false, message: String(detail) });
    } finally {
      setTesting(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formPublicKey.trim() || !formSecretKey.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await createDataSource({
        type: 'langfuse',
        name: formName.trim(),
        project_id: currentProject.project_id,
        config: {
          host: formHost,
          public_key: formPublicKey,
          secret_key: formSecretKey,
        },
      });
      setSuccessMessage('Langfuse connection created successfully!');
      resetForm();
      await loadDataSources();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to create data source';
      setError(String(detail));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(sourceId: string, sourceName: string) {
    if (!confirm(`Are you sure you want to remove "${sourceName}"? This will stop syncing traces from this source.`)) {
      return;
    }

    try {
      setError(null);
      await deleteDataSource(sourceId);
      setSuccessMessage(`Removed "${sourceName}"`);
      await loadDataSources();
    } catch (err) {
      console.error('Failed to delete data source:', err);
      setError('Failed to remove data source. Please try again.');
    }
  }

  async function handleSync(sourceId: string) {
    try {
      setError(null);
      setSyncing((prev) => new Set(prev).add(sourceId));
      const result = await triggerSync(sourceId);
      setSuccessMessage(
        `Synced ${result.traces_imported} traces and ${result.spans_imported} spans`
      );
      await loadDataSources();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Sync failed';
      setError(String(detail));
    } finally {
      setSyncing((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
  }

  function resetForm() {
    setShowCreateForm(false);
    setFormName('');
    setFormHost('https://cloud.langfuse.com');
    setFormPublicKey('');
    setFormSecretKey('');
    setTestResult(null);
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      paused: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.paused}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-2 text-gray-600">
          Connect external observability platforms to import traces into Prela.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add Data Source button / form */}
      <div className="mb-6">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Connect Langfuse
          </button>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connect Langfuse</h3>
            <p className="text-sm text-gray-600 mb-4">
              Import traces from a Langfuse project. Get your API keys from your{' '}
              <a
                href="https://cloud.langfuse.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 underline"
              >
                Langfuse project settings
              </a>.
            </p>

            {currentProject && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-600">
                  Traces will be imported into project: <span className="font-medium text-gray-900">{currentProject.name || currentProject.project_id}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Production Langfuse"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>

              <div>
                <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
                  Langfuse Host URL
                </label>
                <input
                  type="url"
                  id="host"
                  value={formHost}
                  onChange={(e) => setFormHost(e.target.value)}
                  placeholder="https://cloud.langfuse.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>

              <div>
                <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <input
                  type="text"
                  id="publicKey"
                  value={formPublicKey}
                  onChange={(e) => setFormPublicKey(e.target.value)}
                  placeholder="pk-lf-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>

              <div>
                <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  id="secretKey"
                  value={formSecretKey}
                  onChange={(e) => setFormSecretKey(e.target.value)}
                  placeholder="sk-lf-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>

              {/* Test connection result */}
              {testResult && (
                <div className={`rounded-lg p-3 text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {testResult.success ? 'Connection successful!' : `Connection failed: ${testResult.message}`}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || creating || !formPublicKey.trim() || !formSecretKey.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  type="submit"
                  disabled={creating || !formName.trim() || !formPublicKey.trim() || !formSecretKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {creating ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={creating}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Connected data sources */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Connected Sources</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading data sources...</p>
          </div>
        ) : dataSources.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources connected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Connect Langfuse to start importing traces.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dataSources.map((source) => (
              <div key={source.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{source.name}</span>
                      {statusBadge(source.status)}
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {source.type}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      <span>Host: {source.config.host}</span>
                      <span>Key: {source.config.public_key}</span>
                      <span>Last sync: {formatDate(source.last_sync_at)}</span>
                      <span>Project: {source.project_id}</span>
                    </div>
                    {source.error_message && (
                      <p className="mt-1 text-xs text-red-600">{source.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSync(source.id)}
                      disabled={syncing.has(source.id)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {syncing.has(source.id) ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDelete(source.id, source.name)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTLP Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">OpenTelemetry (OTLP)</h3>
        <p className="text-sm text-blue-800 mb-4">
          You can also send traces directly from any OpenTelemetry-compatible application. Point your OTLP exporter to:
        </p>
        <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded font-mono text-sm">
          POST https://ingest.prela.dev/v1/otlp/v1/traces
        </code>
        <p className="mt-3 text-sm text-blue-800">
          Include your Prela API key in the <code className="bg-blue-100 px-1 rounded">Authorization</code> header as a Bearer token.
        </p>
      </div>
    </div>
  );
}
