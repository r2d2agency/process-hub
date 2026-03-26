// API base URL - configure this for your EasyPanel backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('jurismonitor_token');
  const method = (options.method || 'GET').toUpperCase();
  const needsBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const body = options.body ?? (needsBody ? '{}' : undefined);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    body,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    if (response.status === 401) {
      localStorage.removeItem('jurismonitor_token');
      localStorage.removeItem('jurismonitor_user');
    }
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  
  register: (email: string, password: string, name: string) =>
    apiFetch<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  // Dashboard
  getDashboard: () => apiFetch<any>('/admin/dashboard'),

  // Clients
  getClients: (page = 1, limit = 20, search?: string) =>
    apiFetch<any>(`/clients?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`),

  // Rules
  getRules: (clientId?: string) =>
    apiFetch<any[]>(`/monitor-rules${clientId ? `?clientId=${clientId}` : ''}`),
  
  createRule: (data: any) =>
    apiFetch<any>('/monitor-rules', { method: 'POST', body: JSON.stringify(data) }),

  deleteRule: (id: string) =>
    apiFetch<void>(`/monitor-rules/${id}`, { method: 'DELETE' }),

  // Publications
  getPublications: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch<any>(`/publications?${query}`);
  },

  // Matches
  getMatches: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch<any>(`/matches?${query}`);
  },

  // Notifications
  getNotifications: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch<any>(`/notifications?${query}`);
  },
  
  resendNotification: (id: string) =>
    apiFetch<any>(`/notifications/${id}/resend`, { method: 'POST' }),

  // Sources
  getSources: () => apiFetch<any[]>('/admin/sources'),
  createSource: (data: any) =>
    apiFetch<any>('/admin/sources', { method: 'POST', body: JSON.stringify(data) }),
  runSource: (id: string) =>
    apiFetch<any>(`/admin/sources/${id}/run`, { method: 'POST' }),
  validateSource: (id: string) =>
    apiFetch<any>(`/admin/sources/${id}/validate`, { method: 'POST' }),
  validateAllSources: () =>
    apiFetch<any>('/admin/sources/validate-all', { method: 'POST' }),

  // Integrations
  getIntegrations: (clientId?: string) =>
    apiFetch<any[]>(`/integrations${clientId ? `?clientId=${clientId}` : ''}`),
  
  saveWhatsApp: (data: any) =>
    apiFetch<any>('/integrations/whatsapp', { method: 'POST', body: JSON.stringify(data) }),
  
  testWhatsApp: (clientId: string) =>
    apiFetch<any>('/integrations/test-send', { method: 'POST', body: JSON.stringify({ clientId }) }),
};
