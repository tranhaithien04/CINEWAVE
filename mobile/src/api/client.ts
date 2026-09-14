import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL, STORAGE_KEYS } from '../constants/config';

let currentApiUrl = DEFAULT_API_URL;

// Load persisted API URL if any
AsyncStorage.getItem(STORAGE_KEYS.API_URL).then((saved) => {
  if (saved && saved.trim()) {
    currentApiUrl = saved.trim();
  }
});

export function setApiUrl(url: string) {
  currentApiUrl = url.trim();
  void AsyncStorage.setItem(STORAGE_KEYS.API_URL, currentApiUrl);
}

export function getApiUrl() {
  return currentApiUrl;
}

export function apiUrl(path: string): string {
  const base = currentApiUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function api<T>(path: string, options: ApiOptions = {}, retried = false): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...rest,
      headers: reqHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err: any) {
    throw new ApiError('NETWORK_ERROR', err?.message || 'Không thể kết nối máy chủ', 0);
  }

  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(apiUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.tokens?.accessToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, refreshData.tokens.accessToken);
            if (refreshData.tokens?.refreshToken) {
              await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshData.tokens.refreshToken);
            }
            return api<T>(path, options, true);
          }
        }
      } catch {
        // Refresh failed, continue to throw 401
      }
    }
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(data.code ?? 'ERROR', data.message ?? 'Có lỗi xảy ra', res.status);
  }

  return data as T;
}

export async function uploadCccd(input: {
  imageUri: string;
  rating: string;
  movieSlug?: string;
  bookingId?: string;
  showtimeId?: string;
}) {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const formData = new FormData();

  const filename = input.imageUri.split('/').pop() || 'cccd_card.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // React Native FormData file format
  formData.append('file', {
    uri: input.imageUri,
    name: filename,
    type,
  } as any);

  formData.append('rating', input.rating);
  if (input.movieSlug) formData.append('movieSlug', input.movieSlug);
  if (input.bookingId) formData.append('bookingId', input.bookingId);
  if (input.showtimeId) formData.append('showtimeId', input.showtimeId);

  const headers: Record<string, string> = {
    // Note: don't set Content-Type header manually for FormData in React Native
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl('/age-verification'), {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.code ?? 'ERROR', data.message ?? 'Xác minh thất bại', res.status);
  }

  return data;
}

