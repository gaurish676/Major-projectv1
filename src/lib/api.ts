import { notifyLoadingListeners } from '../context/LoadingContext';

const BASE_URL = '';
let activeRequestsCount = 0;

// Promise singleton to serialize concurrent token refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function requestSilentTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('activity_portal_refresh_token');
      if (!refreshToken) {
        return null;
      }

      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh token expired or revoked in database
        localStorage.removeItem('activity_portal_token');
        localStorage.removeItem('activity_portal_refresh_token');
        return null;
      }

      const data = await res.json();
      if (data && data.token) {
        localStorage.setItem('activity_portal_token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('activity_portal_refresh_token', data.refreshToken);
        }
        return data.token as string;
      }
      return null;
    } catch (err) {
      console.warn('Silent token refresh failed:', err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('activity_portal_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  activeRequestsCount++;
  notifyLoadingListeners({
    activeRequests: activeRequestsCount,
    isLoading: true,
    lastEndpoint: endpoint,
  });

  const startTime = performance.now();

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Enterprise Silent Token Refresh: Intercept 401 and attempt automatic session recovery
    if (
      response.status === 401 &&
      endpoint !== '/api/auth/login' &&
      endpoint !== '/api/auth/refresh' &&
      endpoint !== '/api/auth/register'
    ) {
      const refreshedAccessToken = await requestSilentTokenRefresh();
      if (refreshedAccessToken) {
        // Re-execute original request with refreshed 15-minute access token
        headers['Authorization'] = `Bearer ${refreshedAccessToken}`;
        response = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errData = await response.json();
        errorMessage = errData.error || errData.message || errorMessage;
      } catch {
        errorMessage = `Server Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } finally {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    const latency = Math.round(performance.now() - startTime);
    notifyLoadingListeners({
      activeRequests: activeRequestsCount,
      isLoading: activeRequestsCount > 0,
      lastEndpoint: endpoint,
      lastLatencyMs: latency,
      lastSyncedAt: new Date(),
    });
  }
}

/**
 * Attaches the current session authentication token to a file URL (?token=...),
 * allowing native browser tags (<img>, <iframe>, <a>) to load protected evidence securely.
 */
export function getAuthenticatedFileUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const token = localStorage.getItem('activity_portal_token');
  if (!token) return fileUrl;
  const separator = fileUrl.includes('?') ? '&' : '?';
  return `${fileUrl}${separator}token=${encodeURIComponent(token)}`;
}
