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

  // Legal Monitoring
  legalMonitoring: {
    dashboard: () => apiFetch<any>('/api/legal-monitoring/dashboard'),
    getProcesses: (params: Record<string, any> = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch<any>(`/api/legal-monitoring/processes?${query}`);
    },
    getProcess: (id: string) => apiFetch<any>(`/api/legal-monitoring/processes/${id}`),
    createProcess: (data: any) =>
      apiFetch<any>('/api/legal-monitoring/processes', { method: 'POST', body: JSON.stringify(data) }),
    updateProcess: (id: string, data: any) =>
      apiFetch<any>(`/api/legal-monitoring/processes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    importProcesses: (processos: any[]) =>
      apiFetch<any>('/api/legal-monitoring/processes/import', { method: 'POST', body: JSON.stringify({ processos }) }),
    pauseProcess: (id: string) =>
      apiFetch<any>(`/api/legal-monitoring/processes/${id}/pause`, { method: 'POST' }),
    resumeProcess: (id: string) =>
      apiFetch<any>(`/api/legal-monitoring/processes/${id}/resume`, { method: 'POST' }),
    archiveProcess: (id: string) =>
      apiFetch<any>(`/api/legal-monitoring/processes/${id}/archive`, { method: 'POST' }),
    deleteProcess: (id: string) =>
      apiFetch<any>(`/api/legal-monitoring/processes/${id}`, { method: 'DELETE' }),
    reprocessProcess: (id: string) =>
      apiFetch<any>(`/api/legal-monitoring/processes/${id}/reprocess`, { method: 'POST' }),
    getChecks: (id: string) => apiFetch<any>(`/api/legal-monitoring/processes/${id}/checks`),
    getMovements: (id: string) => apiFetch<any>(`/api/legal-monitoring/processes/${id}/movements`),
    getEvents: (id: string) => apiFetch<any>(`/api/legal-monitoring/processes/${id}/events`),
    getAlerts: (id: string) => apiFetch<any>(`/api/legal-monitoring/processes/${id}/alerts`),
    getLogs: (id: string) => apiFetch<any>(`/api/legal-monitoring/processes/${id}/logs`),
    getAllAlerts: (params: Record<string, any> = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch<any>(`/api/legal-monitoring/alerts?${query}`);
    },
    retryAlert: (id: string) =>
      apiFetch<any>(`/api/legal-monitoring/alerts/${id}/retry`, { method: 'POST' }),
    getSettings: () => apiFetch<any>('/api/legal-monitoring/settings'),
    updateSettings: (data: any) =>
      apiFetch<any>('/api/legal-monitoring/settings', { method: 'PUT', body: JSON.stringify(data) }),
    health: () => apiFetch<any>('/api/legal-monitoring/health'),
  },
};
