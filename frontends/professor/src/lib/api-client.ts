export function getBaseApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    // If running in local standalone dev mode on port 3000
    if (window.location.port === '3000') {
      return 'http://localhost:4000/api';
    }
    // In production / Docker / reverse proxy (Traefik on port 80/443)
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('quiz_access_token');
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('quiz_access_token', token);
      } else {
        localStorage.removeItem('quiz_access_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('quiz_access_token');
    }
    return this.token;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getBaseApiUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const data = await res.json();
        errMsg = data.message || errMsg;
      } catch {
        // use default
      }
      throw new Error(errMsg);
    }

    return res.json() as Promise<T>;
  }

  public async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const baseUrl = getBaseApiUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
    const headers: Record<string, string> = {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      let errMsg = `Upload failed with status ${res.status}`;
      try {
        const data = await res.json();
        errMsg = data.message || errMsg;
      } catch {
        // use default
      }
      throw new Error(errMsg);
    }

    return res.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();

