"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';

type User = {
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
