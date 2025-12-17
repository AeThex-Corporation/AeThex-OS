import { platformConfig } from './platform';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown> | FormData;
};

export async function apiRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { body, headers, ...rest } = options;
  
  const url = `${platformConfig.apiBaseUrl}${endpoint}`;
  
  const requestHeaders: Record<string, string> = {};
  
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        requestHeaders[key] = value;
      });
    } else {
      Object.assign(requestHeaders, headers);
    }
  }
  
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  
  return response;
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'GET' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function apiPost<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: data,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function apiPut<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: data,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}
