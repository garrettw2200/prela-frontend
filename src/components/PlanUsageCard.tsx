import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Subscription {
  tier: string;
  status: string;
  trace_limit: number;
  monthly_usage: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  'lunch-money': 'Lunch Money',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800',
};

async function fetchSubscription(): Promise<Subscription> {
  const res = await apiClient.get<Subscription>('/billing/subscription');
  return res.data;
}

export function PlanUsageCard() {
  const { data: sub, isLoading, isError } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (isError || !sub) {
    return null;
  }

  const usagePct =
    sub.trace_limit > 0
      ? Math.min(100, Math.round((sub.monthly_usage / sub.trace_limit) * 100))
      : 0;

  const progressColor =
    usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-yellow-500' : 'bg-indigo-600';

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Plan & Usage</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {TIER_LABELS[sub.tier] ?? sub.tier}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_STYLES[sub.status] ?? STATUS_STYLES.canceled
            }`}
          >
            {sub.status}
          </span>
        </div>
      </div>

      <div className="mb-1 flex justify-between text-sm text-gray-600">
        <span>Traces this month</span>
        <span>
          {sub.monthly_usage.toLocaleString()} /{' '}
          {sub.trace_limit > 0 ? sub.trace_limit.toLocaleString() : 'Unlimited'}
        </span>
      </div>

      {sub.trace_limit > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${progressColor}`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      )}

      {usagePct >= 90 && (
        <p className="text-xs text-red-600 mb-3">You are near your monthly trace limit.</p>
      )}

      {sub.cancel_at_period_end && periodEnd && (
        <p className="text-xs text-yellow-700 mb-3">Subscription cancels on {periodEnd}.</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        {periodEnd && <p className="text-xs text-gray-400">Resets {periodEnd}</p>}
        <Link
          to="/billing"
          className="ml-auto text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Manage billing
        </Link>
      </div>
    </div>
  );
}
