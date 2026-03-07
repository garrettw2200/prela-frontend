import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import {
  listGuardrailConfigs,
  createGuardrailConfig,
  deleteGuardrailConfig,
  listViolations,
  getViolationSummary,
  type GuardrailConfig,
  type GuardrailConfigRequest,
  type GuardrailViolation,
  type ViolationSummaryEntry,
} from '../api/guardrails';

const GUARD_TYPES = ['pii', 'injection', 'content_filter', 'max_tokens', 'custom'];
const ACTIONS = ['block', 'redact', 'log'];

export function GuardrailsPage() {
  return <GuardrailsPageContent />;
}

function GuardrailsPageContent() {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const projectId = routeProjectId ?? currentProject?.project_id ?? 'default';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'configs' | 'violations'>('configs');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch configs
  const { data: configsData, isLoading: configsLoading } = useQuery({
    queryKey: ['guardrail-configs', projectId],
    queryFn: () => listGuardrailConfigs(projectId),
    staleTime: 60 * 1000,
  });

  // Fetch violations
  const { data: violationsData, isLoading: violationsLoading } = useQuery({
    queryKey: ['guardrail-violations', projectId],
    queryFn: () => listViolations(projectId, { hours: 24, limit: 100 }),
    staleTime: 30 * 1000,
    enabled: activeTab === 'violations',
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['guardrail-summary', projectId],
    queryFn: () => getViolationSummary(projectId, 24),
    staleTime: 30 * 1000,
    enabled: activeTab === 'violations',
  });

  const createMutation = useMutation({
    mutationFn: (req: GuardrailConfigRequest) => createGuardrailConfig(projectId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrail-configs', projectId] });
      setShowCreateModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (configId: string) => deleteGuardrailConfig(projectId, configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrail-configs', projectId] });
    },
  });

  const configs = configsData?.configs ?? [];
  const violations = violationsData?.violations ?? [];
  const summary = summaryData?.summary ?? [];
  const totalViolations = summaryData?.total_violations ?? 0;

  const tabStyle = (tab: string) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
    backgroundColor: 'transparent',
    color: activeTab === tab ? '#4f46e5' : '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activeTab === tab ? 600 : 400,
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Guardrails</h1>
        {activeTab === 'configs' && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
            }}
          >
            Add Guard
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        <button style={tabStyle('configs')} onClick={() => setActiveTab('configs')}>
          Configurations
        </button>
        <button style={tabStyle('violations')} onClick={() => setActiveTab('violations')}>
          Violations {totalViolations > 0 && `(${totalViolations})`}
        </button>
      </div>

      {activeTab === 'configs' && (
        <ConfigsTab
          configs={configs}
          isLoading={configsLoading}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}

      {activeTab === 'violations' && (
        <ViolationsTab
          violations={violations}
          summary={summary}
          totalViolations={totalViolations}
          isLoading={violationsLoading}
        />
      )}

      {showCreateModal && (
        <CreateGuardModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(req) => createMutation.mutate(req)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function ConfigsTab({
  configs, isLoading, onDelete,
}: {
  configs: GuardrailConfig[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}) {
  if (isLoading) return <p style={{ color: '#6b7280' }}>Loading configurations...</p>;
  if (configs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
      <p>No guardrail configurations yet. Add a guard to get started.</p>
      <p style={{ fontSize: '13px', marginTop: '8px' }}>
        Guardrails intercept LLM calls to block PII, injection attacks, and custom policy violations.
      </p>
    </div>
  );

  const typeColors: Record<string, string> = {
    pii: '#fef3c7',
    injection: '#fee2e2',
    content_filter: '#e0e7ff',
    max_tokens: '#dbeafe',
    custom: '#f3f4f6',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {configs.map((c: GuardrailConfig) => (
        <div key={c.config_id} style={{
          padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{c.name}</h3>
              <span style={{
                padding: '2px 8px', backgroundColor: typeColors[c.guard_type] || '#f3f4f6',
                borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
              }}>
                {c.guard_type}
              </span>
              <span style={{
                padding: '2px 8px',
                backgroundColor: c.action === 'block' ? '#fee2e2' : c.action === 'redact' ? '#fef3c7' : '#dbeafe',
                borderRadius: '9999px', fontSize: '11px',
              }}>
                {c.action}
              </span>
              {!c.enabled && (
                <span style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '9999px', fontSize: '11px', color: '#9ca3af' }}>
                  disabled
                </span>
              )}
            </div>
            {c.description && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{c.description}</p>
            )}
          </div>
          <button
            onClick={() => { if (confirm('Delete this guard?')) onDelete(c.config_id); }}
            style={{
              padding: '4px 12px', backgroundColor: '#fee2e2', color: '#dc2626',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function ViolationsTab({
  violations, summary, totalViolations, isLoading,
}: {
  violations: GuardrailViolation[];
  summary: ViolationSummaryEntry[];
  totalViolations: number;
  isLoading: boolean;
}) {
  if (isLoading) return <p style={{ color: '#6b7280' }}>Loading violations...</p>;

  return (
    <div>
      {/* Summary Cards */}
      {summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{totalViolations}</div>
            <div style={{ fontSize: '13px', color: '#991b1b' }}>Total Violations (24h)</div>
          </div>
          {summary.slice(0, 3).map((s, i) => (
            <div key={i} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>{s.count}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {s.guard_name} ({s.action_taken})
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Violations List */}
      {violations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>No violations in the last 24 hours.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {violations.map((v: GuardrailViolation) => (
            <div key={v.violation_id} style={{
              padding: '12px 16px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: v.action_taken === 'block' ? '#fee2e2' : '#fef3c7',
                    borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
                    color: v.action_taken === 'block' ? '#dc2626' : '#92400e',
                  }}>
                    {v.action_taken}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{v.guard_name}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{v.phase}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {v.created_at ? new Date(v.created_at).toLocaleString() : ''}
                </span>
              </div>
              {v.message && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4b5563' }}>{v.message}</p>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: '#9ca3af' }}>
                {v.agent_name && <span>Agent: {v.agent_name}</span>}
                {v.model && <span>Model: {v.model}</span>}
                {v.trace_id && <span>Trace: {v.trace_id.slice(0, 8)}...</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGuardModal({
  onClose, onSubmit, isLoading,
}: {
  onClose: () => void;
  onSubmit: (req: GuardrailConfigRequest) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [guardType, setGuardType] = useState('pii');
  const [action, setAction] = useState('block');
  const [description, setDescription] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '450px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Add Guardrail</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
              placeholder="e.g., Block PII in responses" />
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Guard Type
            <select value={guardType} onChange={(e) => setGuardType(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
              {GUARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Action
            <select value={action} onChange={(e) => setAction(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
              placeholder="Optional description" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}>
            Cancel
          </button>
          <button
            disabled={!name || isLoading}
            onClick={() => onSubmit({ name, guard_type: guardType, action, description })}
            style={{
              padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: !name ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
