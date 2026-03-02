import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  projectId: string;
  tier?: string;
  clerkId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();
  const { getToken } = useClerkAuth();
  const [subscriptionData, setSubscriptionData] = useState<{ tier: string; user_id: string } | null>(null);

  // Fetch real tier and user_id from the API when user is loaded
  useEffect(() => {
    if (!clerkUser || !isLoaded) return;

    getToken().then((token) => {
      if (!token) return;
      apiClient
        .get<{ tier: string; user_id: string }>('/billing/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setSubscriptionData(res.data))
        .catch(() => {
          // Fallback to Clerk metadata if billing endpoint fails
          setSubscriptionData({
            tier: (clerkUser.publicMetadata.tier as string) || 'free',
            user_id: (clerkUser.publicMetadata.projectId as string) || clerkUser.id,
          });
        });
    });
  }, [clerkUser?.id, isLoaded]);

  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        projectId: subscriptionData?.user_id || (clerkUser.publicMetadata.projectId as string) || 'default',
        tier: subscriptionData?.tier || (clerkUser.publicMetadata.tier as string) || 'free',
        clerkId: clerkUser.id,
      }
    : null;

  const login = () => {
    openSignIn();
  };

  const logout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!clerkUser,
        isLoading: !isLoaded,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
