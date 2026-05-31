const API_BASE_URL = 'http://127.0.0.1:8222';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt');
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
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

// User API
export const updateProfile = (data: any) => fetchApi('/users/api/users/profile', { method: 'PUT', body: JSON.stringify(data) });
export const getUserAddresses = () => fetchApi('/users/api/users/addresses', { method: 'GET' });
export const addAddress = (data: any) => fetchApi('/users/api/users/addresses', { method: 'POST', body: JSON.stringify(data) });

// User & Auth
export const login = (data: any) => fetchApi('/users/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data: any) => fetchApi('/users/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const registerSeller = (data: any) => fetchApi('/users/api/auth/register-seller', { method: 'POST', body: JSON.stringify(data) });
export const getCurrentUser = () => fetchApi('/users/api/auth/me', { method: 'GET' });
export const updateUser = (data: any) => fetchApi('/users/api/auth/me', { method: 'PUT', body: JSON.stringify(data) });
export const logout = () => fetchApi('/users/api/auth/logout', { method: 'POST' });
export const refreshToken = () => fetchApi('/users/api/auth/refresh', { method: 'POST' });

// Products
export const getProducts = () => fetchApi('/product/api/products', { method: 'GET' });
export const getProductById = (id: string) => fetchApi(`/product/api/products/${id}`, { method: 'GET' });
export const createProduct = (data: any) => fetchApi('/product/api/products', { method: 'POST', body: JSON.stringify(data) });
export const searchProducts = (query: string) => fetchApi(`/product/api/products/search?q=${encodeURIComponent(query)}`, { method: 'GET' });

// Categories
export const getCategories = () => fetchApi('/product/api/categories', { method: 'GET' });
export const createCategory = (data: any) => fetchApi('/product/api/categories', { method: 'POST', body: JSON.stringify(data) });
export const deleteCategory = (id: number) => fetchApi(`/product/api/categories/${id}`, { method: 'DELETE' });

// Orders
export const createOrder = (data: any) => fetchApi('/order/api/orders', { method: 'POST', body: JSON.stringify(data) });
export const getOrders = () => fetchApi('/order/api/orders', { method: 'GET' });
export const getSellerOrders = () => fetchApi('/order/api/orders/seller', { method: 'GET' });
export const updateOrderItemStatus = (itemId: string, status: string) => fetchApi(`/order/api/orders/items/${itemId}/status?status=${status}`, { method: 'PUT' });
export const requestReturn = (itemId: string) => fetchApi(`/order/api/orders/items/${itemId}/return`, { method: 'PUT' });
export const requestOrderRefund = (orderId: string) => fetchApi(`/order/api/orders/${orderId}/refund-request`, { method: 'POST' });
export const approveOrderRefund = (orderId: string) => fetchApi(`/order/api/orders/${orderId}/refund-approve`, { method: 'POST' });

// Cart
export const getCart = (userId: string) => fetchApi(`/cart/api/cart/${userId}`, { method: 'GET' });
export const addCartItem = (userId: string, data: any) => fetchApi(`/cart/api/cart/${userId}/items`, { method: 'POST', body: JSON.stringify(data) });
export const updateCartItemQuantity = (userId: string, productId: string, quantity: number) => fetchApi(`/cart/api/cart/${userId}/items/${productId}?quantity=${quantity}`, { method: 'PUT' });
export const removeCartItem = (userId: string, productId: string) => fetchApi(`/cart/api/cart/${userId}/items/${productId}`, { method: 'DELETE' });
export const clearCart = (userId: string) => fetchApi(`/cart/api/cart/${userId}`, { method: 'DELETE' });

// Payment
export const processPayment = (orderId: string, data: any) => fetchApi(`/payment/api/payments/${orderId}/process`, { method: 'POST', body: JSON.stringify(data) });
