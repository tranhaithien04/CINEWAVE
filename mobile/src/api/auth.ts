import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';
import { AuthUser } from '../types';
import { STORAGE_KEYS } from '../constants/config';

type AuthResponse = {
  user: AuthUser;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
};

export async function loginApi(input: { email: string; password: string }): Promise<AuthUser> {
  const res = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
  if (res.tokens) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.tokens.refreshToken);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
  return res.user;
}

export async function registerApi(input: { email: string; password: string; fullName: string }): Promise<AuthUser> {
  const res = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
  if (res.tokens) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.tokens.refreshToken);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
  return res.user;
}

export async function logoutApi(): Promise<void> {
  try {
    await api<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network error on logout
  }
  await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
}

export async function getMeApi(): Promise<AuthUser> {
  const res = await api<AuthResponse>('/auth/me');
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
  return res.user;
}

