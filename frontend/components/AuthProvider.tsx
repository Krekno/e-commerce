"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[]; // backend usually sends roles
  profilePicture?: string;
  storeName?: string;
  storeDescription?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  mounted: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, mounted: false, refreshUser: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
  });
  const [mounted, setMounted] = useState(false);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      if (userData && !userData.error) {
        setUser(userData as User);
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        setUser(null);
        localStorage.removeItem('isAuthenticated');
      }
    } catch (e) {
      setUser(null);
      localStorage.removeItem('isAuthenticated');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuth) {
      refreshUser();
    } else {
      setLoading(false);
    }

    // Set up JWT refresh interval (every 13 minutes)
    const REFRESH_INTERVAL = 13 * 60 * 1000;
    const intervalId = setInterval(async () => {
      const currentlyAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (currentlyAuth) {
        try {
          const { refreshToken } = await import('@/lib/api');
          await refreshToken();
        } catch (e) {
          console.error('Failed to refresh token silently', e);
        }
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // To prevent hydration mismatch, we can just return the provider immediately
  // and the navbar will use the mounted state to render quickly.

  return (
    <AuthContext.Provider value={{ user, loading, mounted, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
