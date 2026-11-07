import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch (e) {}
  return (
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  );
};

export const DEFAULT_SERVER_URL = 'https://features-generating-prize-life.trycloudflare.com';

export function getServerBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('campussplit_server_url');
    if (custom) return custom.trim().replace(/\/+$/, '');
    if (isNativeApp()) return DEFAULT_SERVER_URL;
  }
  return '';
}

export function setServerBaseUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('campussplit_server_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('campussplit_server_url');
    }
  }
}

function getAuthToken() {
  return localStorage.getItem('campussplit_admin_token') || localStorage.getItem('campussplit_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('campussplit_token', token);
  } else {
    localStorage.removeItem('campussplit_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = `${getServerBaseUrl()}/api`;
  let response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    const currentServer = getServerBaseUrl() || window.location.origin;
    const msg = `Unable to reach server at ${currentServer}. Please verify your phone is on the same Wi-Fi/Hotspot, or update the Server Address below.`;
    const netErr = new Error(msg);
    netErr.isNetworkError = true;
    netErr.serverUrl = currentServer;
    throw netErr;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Session expired
      localStorage.removeItem('campussplit_token');
      localStorage.removeItem('campussplit_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    const error = new Error(data.error || 'Network request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

// Auth API
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
};

// Groups API
export const groupsApi = {
  getAll: () => request('/groups'),
  getById: (groupId) => request(`/groups/${groupId}`),
  create: (groupData) => request('/groups', { method: 'POST', body: JSON.stringify(groupData) }),
  update: (groupId, groupData) => request(`/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(groupData) }),
  delete: (groupId) => request(`/groups/${groupId}`, { method: 'DELETE' }),
  joinByCode: (inviteCode) => request('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  getGroupPreview: (inviteCode) => request(`/groups/preview/${inviteCode}`),
  joinWithAuth: (data) => request('/groups/join-with-auth', { method: 'POST', body: JSON.stringify(data) }),
  getNetworkInfo: () => request('/network-info'),
  addMember: (groupId, email) => request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ email }) }),
};

// Expenses API
export const expensesApi = {
  create: (groupId, expenseData) => request(`/expenses/group/${groupId}`, { method: 'POST', body: JSON.stringify(expenseData) }),
  update: (expenseId, expenseData) => request(`/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(expenseData) }),
  delete: (expenseId) => request(`/expenses/${expenseId}`, { method: 'DELETE' }),
  getGroupExpenses: (groupId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses/group/${groupId}${query ? '?' + query : ''}`);
  },
};

// Settlements API
export const settlementsApi = {
  create: (groupId, settlementData) => request(`/settlements/group/${groupId}`, { method: 'POST', body: JSON.stringify(settlementData) }),
  delete: (settlementId) => request(`/settlements/${settlementId}`, { method: 'DELETE' }),
  getGroupSettlements: (groupId) => request(`/settlements/group/${groupId}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => request('/analytics/dashboard'),
  getReports: (groupId = 'all') => request(`/analytics/reports?groupId=${groupId}`),
};

// Admin API
export const adminApi = {
  login: (credentials) => request('/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  toggleAdminRole: (userId, isAdmin) => request(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ isAdmin }) }),
  updateUserPassword: (userId, newPassword) => request(`/admin/users/${userId}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  updateUserDetails: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
  getGroups: () => request('/admin/groups'),
  deleteGroup: (groupId) => request(`/admin/groups/${groupId}`, { method: 'DELETE' }),
  getActivity: () => request('/admin/activity'),
  clearAllTransactions: () => request('/admin/clear-transactions', { method: 'POST' }),
};

