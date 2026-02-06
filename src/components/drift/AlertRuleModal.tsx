import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAlertRule, updateAlertRule, AlertRule, AnomalySeverity } from '../../api/drift';
import { useAuth } from '../../contexts/AuthContext';

interface AlertRuleModalProps {
  projectId: string;
  rule?: AlertRule;
  onClose: () => void;
}

export default function AlertRuleModal({ projectId, rule, onClose }: AlertRuleModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!rule;

  // Form state
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [agentName, setAgentName] = useState(rule?.agent_name || '');
  const [metricName, setMetricName] = useState(rule?.metric_name || '');
  const [severityThreshold, setSeverityThreshold] = useState<AnomalySeverity>(
    rule?.severity_threshold || 'medium'
  );
  const [changePercentMin, setChangePercentMin] = useState(rule?.change_percent_min?.toString() || '');

  // Notification state
  const [notifyEmail, setNotifyEmail] = useState(rule?.notify_email || false);
  const [emailAddresses, setEmailAddresses] = useState(rule?.email_addresses?.join(', ') || '');
  const [notifySlack, setNotifySlack] = useState(rule?.notify_slack || false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(rule?.slack_webhook_url || '');
  const [slackChannel, setSlackChannel] = useState(rule?.slack_channel || '');

  const createMutation = useMutation({
    mutationFn: async () => {
      return createAlertRule(projectId, {
        name,
        description: description || undefined,
        enabled,
        agent_name: agentName || undefined,
        metric_name: metricName || undefined,
        severity_threshold: severityThreshold,
        change_percent_min: changePercentMin ? parseFloat(changePercentMin) : undefined,
        notify_email: notifyEmail,
        email_addresses: notifyEmail ? emailAddresses.split(',').map(e => e.trim()) : [],
        notify_slack: notifySlack,
        slack_webhook_url: notifySlack ? slackWebhookUrl : undefined,
        slack_channel: notifySlack ? slackChannel : undefined,
        user_id: user?.id || 'anonymous',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', projectId] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!rule) throw new Error('No rule to update');
      return updateAlertRule(projectId, rule.rule_id, {
        name,
        description: description || undefined,
        enabled,
        agent_name: agentName || undefined,
        metric_name: metricName || undefined,
        severity_threshold: severityThreshold,
        change_percent_min: changePercentMin ? parseFloat(changePercentMin) : undefined,
        notify_email: notifyEmail,
        email_addresses: notifyEmail ? emailAddresses.split(',').map(e => e.trim()) : [],
        notify_slack: notifySlack,
        slack_webhook_url: notifySlack ? slackWebhookUrl : undefined,
        slack_channel: notifySlack ? slackChannel : undefined,
        user_id: user?.id || 'anonymous',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', projectId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., High Token Usage Alert"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Rule enabled
                  </label>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Conditions</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Name (optional)
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave empty for all agents"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Specify a specific agent name or leave empty to match all agents
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metric Name (optional)
                  </label>
                  <input
                    type="text"
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., token_usage, duration"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Severity
                  </label>
                  <select
                    value={severityThreshold}
                    onChange={(e) => setSeverityThreshold(e.target.value as AnomalySeverity)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Change % (optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={changePercentMin}
                    onChange={(e) => setChangePercentMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 50"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Only trigger if change exceeds this percentage
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Notifications</h3>

              <div className="space-y-4">
                {/* Email */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Email Notifications
                    </label>
                  </div>

                  {notifyEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Addresses (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={emailAddresses}
                        onChange={(e) => setEmailAddresses(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="user1@example.com, user2@example.com"
                      />
                    </div>
                  )}
                </div>

                {/* Slack */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={notifySlack}
                      onChange={(e) => setNotifySlack(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Slack Notifications
                    </label>
                  </div>

                  {notifySlack && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slack Webhook URL
                        </label>
                        <input
                          type="url"
                          value={slackWebhookUrl}
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Channel (optional)
                        </label>
                        <input
                          type="text"
                          value={slackChannel}
                          onChange={(e) => setSlackChannel(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="#alerts"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEdit
                  ? 'Update Rule'
                  : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
