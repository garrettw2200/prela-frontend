import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listApiKeys, createApiKey, revokeApiKey, ApiKey, CreateApiKeyResponse } from '../api/apiKeys';

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResponse, setNewKeyResponse] = useState<CreateApiKeyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if we're coming from a successful checkout
  const fromCheckout = searchParams.get('from') === 'checkout';

  useEffect(() => {
    loadApiKeys();
  }, []);

  useEffect(() => {
    // If coming from checkout and no keys exist, auto-open create form
    if (fromCheckout && !loading && apiKeys.length === 0) {
      setShowCreateForm(true);
    }
  }, [fromCheckout, loading, apiKeys.length]);

  async function loadApiKeys() {
    try {
      setLoading(true);
      setError(null);
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
      setError('Failed to load API keys. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await createApiKey({ name: newKeyName.trim() });
      setNewKeyResponse(response);
      setNewKeyName('');
      setShowCreateForm(false);
      await loadApiKeys();
    } catch (err) {
      console.error('Failed to create API key:', err);
      setError('Failed to create API key. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey(keyId: string, keyName: string) {
    if (!confirm(`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await revokeApiKey(keyId);
      await loadApiKeys();

      // Clear the new key response if we're revoking the key we just created
      if (newKeyResponse?.id === keyId) {
        setNewKeyResponse(null);
      }
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      setError('Failed to revoke API key. Please try again.');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
        <p className="mt-2 text-gray-600">
          Manage your API keys for accessing Prela from your SDK.
        </p>
      </div>

      {/* Success message from checkout */}
      {fromCheckout && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Subscription activated!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your subscription is now active. Create an API key below to start using Prela.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* New key display (shown once after creation) */}
      {newKeyResponse && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-yellow-900">
                API Key Created Successfully
              </h3>
              <div className="mt-2 text-sm text-yellow-800">
                <p className="font-semibold">⚠️ Copy your API key now. It will not be shown again.</p>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 text-green-400 px-4 py-3 rounded font-mono text-sm break-all">
                    {newKeyResponse.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKeyResponse.key)}
                    className="px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setNewKeyResponse(null)}
                  className="text-sm text-yellow-800 underline hover:text-yellow-900"
                >
                  I've saved my API key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create key button */}
      <div className="mb-6">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create New API Key
          </button>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Server, Local Development"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateKey}
                  disabled={creating || !newKeyName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Key'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName('');
                    setError(null);
                  }}
                  disabled={creating}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API keys list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Your API Keys</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new API key.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <div key={key.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded">
                        {key.key_prefix}...
                      </code>
                      <span className="text-sm font-medium text-gray-900">{key.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {formatDate(key.created_at)}</span>
                      <span>Last used: {formatDate(key.last_used_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id, key.name)}
                    className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Using Your API Key</h3>
        <p className="text-sm text-blue-800 mb-4">
          Set your API key as an environment variable in your application:
        </p>
        <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded font-mono text-sm">
          export PRELA_API_KEY="your_api_key_here"
        </code>
        <p className="mt-4 text-sm text-blue-800">
          Then initialize Prela in your code:
        </p>
        <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded font-mono text-sm mt-2">
          import prela{'\n'}
          prela.init()
        </code>
      </div>
    </div>
  );
}
