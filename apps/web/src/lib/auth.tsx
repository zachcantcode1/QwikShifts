import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@qwikshifts/core';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true, isOnboarded: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { onboarded } = await api.checkOnboardingStatus();
        setIsOnboarded(onboarded);

        if (onboarded) {
          try {
            const u = await api.getMe();
            setUser(u);
          } catch (e) {
            // Not logged in, but onboarded
            console.log('Not logged in');
          }
        }
      } catch (err) {
        console.error('Failed to check status', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
