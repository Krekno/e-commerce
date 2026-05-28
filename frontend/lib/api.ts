const API_BASE_URL = 'http://localhost:8222';

function getAuthHeader() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt');
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle specific backend structures where headers contain JWT
  const jwtCookie = response.headers.get('jwt-access') || response.headers.get('authorization');
  if (jwtCookie && typeof window !== 'undefined') {
    // Basic extraction if it's sent in header, though usually it's set as cookie
    // If backend returns it in body, caller handles it.
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'API request failed');
  }

  // Some endpoints return 200 OK without body
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}

// User & Auth
export const login = (data: any) => fetchApi('/user/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data: any) => fetchApi('/user/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const registerSeller = (data: any) => fetchApi('/user/api/auth/register-seller', { method: 'POST', body: JSON.stringify(data) });
export const getCurrentUser = () => fetchApi('/user/api/auth/me', { method: 'GET' });
export const logout = () => fetchApi('/user/api/auth/logout', { method: 'POST' });

// Products
export const getProducts = () => fetchApi('/product/api/products', { method: 'GET' });
export const getProductById = (id: string) => fetchApi(`/product/api/products/${id}`, { method: 'GET' });
export const createProduct = (data: any) => fetchApi('/product/api/products', { method: 'POST', body: JSON.stringify(data) });

// Orders
export const createOrder = (data: any) => fetchApi('/order/api/orders', { method: 'POST', body: JSON.stringify(data) });
