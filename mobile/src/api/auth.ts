import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';
import { AuthUser } from '../types';
import { STORAGE_KEYS } from '../constants/config';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = {
  user: AuthUser;
  tokens?: AuthTokens;
};

type RegisterResponse =
  | AuthResponse
  | {
      pendingVerification: true;
      email: string;
      message?: string;
    };

async function persistAuthResponse(res: AuthResponse): Promise<AuthUser> {
  if (res.tokens) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.tokens.refreshToken);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
  return res.user;
}

export async function loginApi(input: { email: string; password: string }): Promise<AuthUser> {
  const res = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
  return persistAuthResponse(res);
}

export async function redeemGoogleMobileTicketApi(ticket: string): Promise<AuthUser> {
  const res = await api<AuthResponse>('/auth/google/mobile/ticket', {
    method: 'POST',
    body: { ticket },
  });
  return persistAuthResponse(res);
}

export async function registerApi(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ pendingVerification: true; email: string; message?: string } | AuthUser> {
  const res = await api<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });

  if ('pendingVerification' in res && res.pendingVerification) {
    return {
      pendingVerification: true,
      email: res.email,
      message: res.message,
    };
  }

  if ('user' in res) {
    if (res.tokens) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.tokens.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.tokens.refreshToken);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
    return res.user;
  }

  throw new Error('Phản hồi đăng ký không hợp lệ');
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

export async function verifyEmailApi(token: string): Promise<AuthUser> {
  const res = await api<AuthResponse & { verified?: boolean }>('/auth/verify-email', {
    method: 'POST',
    body: { token },
  });
  if ('tokens' in res && res.tokens) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.tokens.refreshToken);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
  return res.user;
}

export function resendVerificationEmail(email: string) {
  return api<{ ok: boolean; message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: { email },
  });
}
