export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Matches Django's /api/auth/me and /api/auth/login response shape (camelCase)
export interface AuthUser {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface MeResponse {
  authenticated: boolean;
  user?: AuthUser;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: call Next.js proxy routes (same origin)
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  // Server-side (route handlers): call Django directly
  return process.env.BACKEND_API_URL || 'http://localhost:8000';
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, config);

  // Attempt token refresh on 401 (client-side only, non-auth routes)
  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !path.includes('/api/auth/')
  ) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        response = await fetch(url, config);
      } else {
        throw new Error('Session expired. Please sign in again.');
      }
    } catch {
      throw new Error('Authentication required');
    }
  }

  if (!response.ok) {
    const error: ApiError = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      // not JSON
    }
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
