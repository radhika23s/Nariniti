'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/lib/api';
import { auth } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      // getCurrentUser() now returns AuthUser | null directly
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const userData = await auth.login(identifier, password);
    setUser(userData);
  };

  const register = async (data: Record<string, unknown>) => {
    await auth.register(data);
  };

  const logout = async () => {
    try {
      await auth.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    const success = await auth.refreshToken();
    if (success) {
      await fetchUser();
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
