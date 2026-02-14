import { useAuth } from '../contexts/AuthContext';

const TIER_HIERARCHY = ['free', 'lunch-money', 'pro', 'enterprise'];

interface UpgradeGateProps {
  requiredTier: 'lunch-money' | 'pro' | 'enterprise';
  featureName: string;
  children: React.ReactNode;
}

export function UpgradeGate({ requiredTier, featureName, children }: UpgradeGateProps) {
  const { user } = useAuth();
  const userTier = user?.tier || 'free';
  const userLevel = TIER_HIERARCHY.indexOf(userTier);
  const requiredLevel = TIER_HIERARCHY.indexOf(requiredTier);

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  const tierLabel = requiredTier === 'lunch-money' ? 'Lunch Money' : requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
  const price = requiredTier === 'lunch-money' ? '$14' : requiredTier === 'pro' ? '$79' : '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-5xl mb-4">
          {requiredTier === 'pro' ? '\u{1F512}' : '\u{2B50}'}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {featureName}
        </h2>
        <p className="text-gray-600 mb-6">
          This feature requires the {tierLabel} plan{price ? ` (${price}/month)` : ''} or higher.
        </p>
        <a
          href="/billing"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Upgrade to {tierLabel}
        </a>
        <p className="text-sm text-gray-400 mt-4">
          Current plan: {userTier === 'lunch-money' ? 'Lunch Money' : userTier.charAt(0).toUpperCase() + userTier.slice(1)}
        </p>
      </div>
    </div>
  );
}
