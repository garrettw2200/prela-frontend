import React, { useEffect, useState } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { apiClient } from '../api/client';

interface Subscription {
  tier: 'free' | 'lunch-money' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  trace_limit: number;
  monthly_usage: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  features: string[];
  cta: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: [
      '50k traces/month',
      '30-day retention',
      'OpenAI & Anthropic',
      'LangChain & LlamaIndex (basic)',
      'Console & File exporters',
      'Community support',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'lunch-money',
    name: 'Lunch Money',
    price: '$14',
    features: [
      'All Free features',
      '100k traces/month',
      'CrewAI, AutoGen, LangGraph, Swarm, n8n',
      'All 17+ assertion types',
      'Replay engine (100/month)',
      'Cost optimization insights',
      'HTTP exporter (cloud sync)',
      'Email support (48h)',
    ],
    cta: 'Upgrade to Lunch Money',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    features: [
      'All Lunch Money features',
      '1M traces/month',
      '90-day retention',
      'Security scanning (full)',
      'Drift detection & alerting',
      'Hallucination detection',
      'Debug Agent (AI root cause)',
      'Eval generation from traces',
      'Priority support (12h)',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'All Pro features',
      'Unlimited traces',
      'Custom retention',
      'EU AI Act compliance',
      'Data lineage tracking',
      'SSO/SAML',
      'Dedicated support (4h)',
    ],
    cta: 'Contact Sales',
  },
];

export const BillingPage: React.FC = () => {
  const { currentTeam } = useTeam();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/billing/subscription');
      setSubscription(response.data);
    } catch (err: any) {
      console.error('Failed to fetch subscription:', err);
      setError(err.response?.data?.detail || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (tier === 'enterprise') {
      window.location.href = 'mailto:sales@prela.dev?subject=Prela Enterprise Inquiry';
      return;
    }

    if (tier === 'free') {
      // Open customer portal for downgrade
      await openCustomerPortal();
      return;
    }

    try {
      setUpgrading(true);
      const response = await apiClient.post('/billing/create-checkout-session', {
        tier,
        team_id: currentTeam?.id,
        success_url: `${window.location.origin}/api-keys?from=checkout`,
        cancel_url: `${window.location.origin}/billing`,
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const response = await apiClient.post('/billing/create-portal-session', {
        return_url: `${window.location.origin}/billing`,
      });

      // Redirect to Stripe Customer Portal
      window.location.href = response.data.portal_url;
    } catch (err: any) {
      console.error('Failed to open customer portal:', err);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  const formatUsage = (usage: number, limit: number): string => {
    const percentage = (usage / limit) * 100;
    return `${usage.toLocaleString()} / ${limit.toLocaleString()} (${percentage.toFixed(1)}%)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Billing & Subscription
        </h1>
        <p className="text-xl text-gray-600">
          Choose the plan that works best for you
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Current Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tier</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {subscription.tier}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {subscription.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Usage</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatUsage(subscription.monthly_usage, subscription.trace_limit)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (subscription.monthly_usage / subscription.trace_limit) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {subscription.tier !== 'free' && (
            <div className="mt-6">
              <button
                onClick={openCustomerPortal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRICING_TIERS.map((tier) => {
          const isCurrentTier = subscription?.tier === tier.id;
          const isAvailable = tier.id === 'free' || tier.id === 'lunch-money' || tier.id === 'pro';

          return (
            <div
              key={tier.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                isCurrentTier ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {isCurrentTier && (
                <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Current Plan
                </span>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {tier.name}
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                {tier.price}
                {tier.price !== 'Custom' && (
                  <span className="text-base font-normal text-gray-600">/month</span>
                )}
              </p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={isCurrentTier || !isAvailable || upgrading}
                className={`mt-6 w-full px-4 py-2 rounded-md font-semibold transition-colors ${
                  isCurrentTier
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isAvailable
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {upgrading ? 'Processing...' : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <details className="bg-white rounded-lg shadow-md p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              How does the trace limit work?
            </summary>
            <p className="mt-2 text-gray-600">
              Each trace you send to Prela counts towards your monthly limit. The limit
              resets at the beginning of each billing period.
            </p>
          </details>
          <details className="bg-white rounded-lg shadow-md p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              Can I upgrade or downgrade at any time?
            </summary>
            <p className="mt-2 text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take
              effect immediately, and billing is prorated.
            </p>
          </details>
          <details className="bg-white rounded-lg shadow-md p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              What happens if I exceed my trace limit?
            </summary>
            <p className="mt-2 text-gray-600">
              If you exceed your monthly trace limit, new traces will be rejected with a
              429 error. You can upgrade your plan to increase your limit.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};
