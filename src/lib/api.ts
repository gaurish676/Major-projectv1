const BASE_URL = '';

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

  return response.json();
}
