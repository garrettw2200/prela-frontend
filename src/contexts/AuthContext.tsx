import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

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

  // Transform Clerk user to our User type
  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        projectId: clerkUser.publicMetadata.projectId as string || 'default',
        tier: clerkUser.publicMetadata.tier as string || 'free',
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
