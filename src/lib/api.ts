import { notifyLoadingListeners } from '../context/LoadingContext';

const BASE_URL = '';
let activeRequestsCount = 0;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('activity_portal_token');

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
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

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
