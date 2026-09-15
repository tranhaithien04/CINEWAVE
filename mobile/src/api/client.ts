import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL, STORAGE_KEYS } from '../constants/config';

let currentApiUrl = DEFAULT_API_URL;

function isUnusableMobileApiHost(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '10.10.122.176';
  } catch {
    return true;
  }
}

// Load persisted API URL if any — never keep localhost on a physical phone
AsyncStorage.getItem(STORAGE_KEYS.API_URL).then((saved) => {
  const trimmed = saved?.trim();
  if (!trimmed || isUnusableMobileApiHost(trimmed)) {
    currentApiUrl = DEFAULT_API_URL;
    void AsyncStorage.setItem(STORAGE_KEYS.API_URL, DEFAULT_API_URL);
    return;
  }
  currentApiUrl = trimmed;
});

export function setApiUrl(url: string) {
  const next = url.trim();
  if (isUnusableMobileApiHost(next)) {
    currentApiUrl = DEFAULT_API_URL;
    void AsyncStorage.setItem(STORAGE_KEYS.API_URL, DEFAULT_API_URL);
    return;
  }
  currentApiUrl = next;
  void AsyncStorage.setItem(STORAGE_KEYS.API_URL, currentApiUrl);
}

/** Guarantee a phone-reachable API base before OAuth / network calls. */
export function ensureLanApiUrl(): string {
  if (isUnusableMobileApiHost(currentApiUrl)) {
    currentApiUrl = DEFAULT_API_URL;
    void AsyncStorage.setItem(STORAGE_KEYS.API_URL, DEFAULT_API_URL);
  }
  return currentApiUrl;
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
    public readonly status: number,
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
  mimeType?: string | null;
  fileName?: string | null;
}) {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  // RN New Architecture FormData+fetch throws "Unsupported FormDataPart implementation".
  // Use native multipart upload instead.
  const FileSystem = await import('expo-file-system/legacy');

  const rawName =
    input.fileName?.trim() ||
    input.imageUri.split('/').pop()?.split('?')[0] ||
    'cccd.jpg';
  const extMatch = /\.(\w+)$/.exec(rawName);
  let ext = (extMatch?.[1] || 'jpg').toLowerCase();
  if (ext === 'heic' || ext === 'heif') ext = 'jpg';

  const mimeFromExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const mimeType =
    input.mimeType && input.mimeType.startsWith('image/')
      ? input.mimeType === 'image/heic' || input.mimeType === 'image/heif'
        ? 'image/jpeg'
        : input.mimeType
      : mimeFromExt[ext] || 'image/jpeg';

  const filename = `cccd_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

  const parameters: Record<string, string> = {
    rating: input.rating,
  };
  if (input.movieSlug) parameters.movieSlug = input.movieSlug;
  if (input.bookingId) parameters.bookingId = input.bookingId;
  if (input.showtimeId) parameters.showtimeId = input.showtimeId;

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const upload = await FileSystem.uploadAsync(apiUrl('/age-verification'), input.imageUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    parameters,
    headers,
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
  });

  let data: any = {};
  try {
    data = upload.body ? JSON.parse(upload.body) : {};
  } catch {
    data = { message: upload.body || 'Phản hồi không hợp lệ từ máy chủ' };
  }

  if (upload.status < 200 || upload.status >= 300) {
    throw new ApiError(
      data.code ?? 'ERROR',
      data.message ?? `Xác minh thất bại (${upload.status})`,
      upload.status,
    );
  }

  return data;
}
