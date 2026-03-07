import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import {
  listAlertRules,
  listAlertHistory,
  createAlertRule,
  deleteAlertRule,
  updateAlertRule,
  METRIC_TYPE_LABELS,
  CONDITION_LABELS,
  SEVERITY_COLORS,
  type AlertRule,
  type AlertHistoryEntry,
  type CreateAlertRuleRequest,
  type MetricType,
  type AlertCondition,
  type AlertSeverity,
} from '../api/alerts';

export function AlertsPage() {
  return <AlertsPageContent />;
}

function AlertsPageContent() {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const projectId = routeProjectId ?? currentProject?.project_id ?? 'default';
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  // Fetch alert rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['alert-rules', projectId],
    queryFn: () => listAlertRules(projectId),
    staleTime: 60 * 1000,
  });

  // Fetch alert history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['alert-history', projectId],
    queryFn: () => listAlertHistory(projectId, undefined, 100),
    staleTime: 30 * 1000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (rule: CreateAlertRuleRequest) => createAlertRule(projectId, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', projectId] });
      setShowCreateModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(projectId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', projectId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      updateAlertRule(projectId, ruleId, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', projectId] });
    },
  });

  const rules = rulesData?.rules ?? [];
  const history = historyData?.alerts ?? [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Alerts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + Create Alert Rule
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        {(['rules', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
              color: activeTab === tab ? '#4f46e5' : '#6b7280',
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {tab} ({tab === 'rules' ? rules.length : history.length})
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          {rulesLoading ? (
            <p style={{ color: '#6b7280' }}>Loading alert rules...</p>
          ) : rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No alert rules configured</p>
              <p style={{ fontSize: '14px' }}>Create a rule to monitor metrics like error rate, latency, or cost.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rules.map((rule) => (
                <AlertRuleCard
                  key={rule.rule_id}
                  rule={rule}
                  onDelete={() => deleteMutation.mutate(rule.rule_id)}
                  onToggle={(enabled) => toggleMutation.mutate({ ruleId: rule.rule_id, enabled })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {historyLoading ? (
            <p style={{ color: '#6b7280' }}>Loading alert history...</p>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <p>No alerts triggered yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Rule</th>
                  <th style={thStyle}>Metric</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Threshold</th>
                  <th style={thStyle}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.alert_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{new Date(entry.triggered_at).toLocaleString()}</td>
                    <td style={tdStyle}>{entry.rule_name}</td>
                    <td style={tdStyle}>{METRIC_TYPE_LABELS[entry.metric_type]}</td>
                    <td style={tdStyle}>{entry.current_value.toFixed(4)}</td>
                    <td style={tdStyle}>{CONDITION_LABELS[entry.condition]} {entry.threshold.toFixed(4)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        color: SEVERITY_COLORS[entry.severity],
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '12px',
                      }}>
                        {entry.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAlertRuleModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(rule) => createMutation.mutate(rule)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

// Styles
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '14px',
};

// Sub-components

function AlertRuleCard({
  rule,
  onDelete,
  onToggle,
}: {
  rule: AlertRule;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const channels = [
    rule.notify_email && 'Email',
    rule.notify_slack && 'Slack',
    rule.notify_pagerduty && 'PagerDuty',
  ].filter(Boolean);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: rule.enabled ? '#fff' : '#f9fafb',
        opacity: rule.enabled ? 1 : 0.7,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>{rule.name}</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: SEVERITY_COLORS[rule.severity] + '20',
                color: SEVERITY_COLORS[rule.severity],
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {rule.severity}
            </span>
          </div>
          <p style={{ margin: '4px 0 8px', color: '#6b7280', fontSize: '14px' }}>
            {METRIC_TYPE_LABELS[rule.metric_type]} {CONDITION_LABELS[rule.condition]} {rule.threshold}
            {rule.agent_name && ` (agent: ${rule.agent_name})`}
            {' | '}Window: {rule.evaluation_window_minutes}min
            {' | '}Cooldown: {rule.cooldown_minutes}min
          </p>
          {channels.length > 0 && (
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Notify via: {channels.join(', ')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => onToggle(!rule.enabled)}
            style={{
              padding: '4px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {rule.enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '4px 10px',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              background: 'white',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAlertRuleModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (rule: CreateAlertRuleRequest) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [metricType, setMetricType] = useState<MetricType>('error_rate');
  const [condition, setCondition] = useState<AlertCondition>('gt');
  const [threshold, setThreshold] = useState('0.05');
  const [window, setWindow] = useState('60');
  const [severity, setSeverity] = useState<AlertSeverity>('medium');
  const [cooldown, setCooldown] = useState('30');
  const [agentName, setAgentName] = useState('');
  const [notifySlack, setNotifySlack] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState('');
  const [notifyPagerduty, setNotifyPagerduty] = useState(false);
  const [pagerdutyKey, setPagerdutyKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      metric_type: metricType,
      condition,
      threshold: parseFloat(threshold),
      evaluation_window_minutes: parseInt(window),
      severity,
      cooldown_minutes: parseInt(cooldown),
      agent_name: agentName || undefined,
      notify_slack: notifySlack,
      slack_webhook_url: notifySlack ? slackWebhookUrl : undefined,
      notify_email: notifyEmail,
      email_addresses: notifyEmail ? emailAddresses.split(',').map((e) => e.trim()).filter(Boolean) : undefined,
      notify_pagerduty: notifyPagerduty,
      pagerduty_routing_key: notifyPagerduty ? pagerdutyKey : undefined,
    });
  };

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>Create Alert Rule</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Rule Name</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., High error rate alert" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Metric</label>
                <select style={selectStyle} value={metricType} onChange={(e) => setMetricType(e.target.value as MetricType)}>
                  {Object.entries(METRIC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Condition</label>
                <select style={selectStyle} value={condition} onChange={(e) => setCondition(e.target.value as AlertCondition)}>
                  {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Threshold</label>
                <input style={inputStyle} type="number" step="any" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Window (min)</label>
                <input style={inputStyle} type="number" min="5" max="1440" value={window} onChange={(e) => setWindow(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Cooldown (min)</label>
                <input style={inputStyle} type="number" min="5" max="1440" value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Severity</label>
                <select style={selectStyle} value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Agent Name (optional)</label>
                <input style={inputStyle} value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Filter by agent" />
              </div>
            </div>

            {/* Notification channels */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#374151' }}>Notification Channels</p>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <input type="checkbox" checked={notifySlack} onChange={(e) => setNotifySlack(e.target.checked)} />
                Slack
              </label>
              {notifySlack && (
                <input style={{ ...inputStyle, marginBottom: '10px' }} value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} placeholder="Slack webhook URL" />
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
                Email
              </label>
              {notifyEmail && (
                <input style={{ ...inputStyle, marginBottom: '10px' }} value={emailAddresses} onChange={(e) => setEmailAddresses(e.target.value)} placeholder="Comma-separated email addresses" />
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <input type="checkbox" checked={notifyPagerduty} onChange={(e) => setNotifyPagerduty(e.target.checked)} />
                PagerDuty
              </label>
              {notifyPagerduty && (
                <input style={{ ...inputStyle, marginBottom: '10px' }} value={pagerdutyKey} onChange={(e) => setPagerdutyKey(e.target.value)} placeholder="PagerDuty routing key" />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
