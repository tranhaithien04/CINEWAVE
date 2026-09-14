import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types';
import { STORAGE_KEYS } from '../constants/config';
import { getMeApi, loginApi, logoutApi, registerApi } from '../api/auth';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          const freshUser = await getMeApi();
          setUser(freshUser);
        }
      } catch {
        // Token expired or network error; keep offline cached user or fallback to null
      } finally {
        setLoading(false);
      }
    }
    void loadStoredAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const authUser = await loginApi(credentials);
    setUser(authUser);
    return authUser;
  };

  const register = async (data: { email: string; password: string; fullName: string }) => {
    const authUser = await registerApi(data);
    setUser(authUser);
    return authUser;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await getMeApi();
      setUser(freshUser);
    } catch {
      // Ignore error
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

