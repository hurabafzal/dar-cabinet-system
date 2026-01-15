// Use proxy in production to avoid CORS issues, direct URL in development
export const API_BASE = import.meta.env.PROD ? '/api' : 'https://darkw.ai/api';

export const API_GET_PRICE = `${API_BASE}/materials/calculate-price`;
export const CREATE_MODEL_PRICE = `${API_BASE}/models`;
export const UPDATE_MODEL_PRICE = `${API_BASE}/models/update`;
export const DELETE_MODEL_PRICE = `${API_BASE}/models`;
export const GET_MEASUREMENTS = `${API_BASE}/measurements`;
export const GET_ALL_DESIGN_MODELS = `${API_BASE}/design-models`;
export const GET_ALL_MATERIAL = `${API_BASE}/material-category`;

// Additional endpoints
export const GET_USER = (userId: string) => `${API_BASE}/users/${userId}`;
export const GET_USERS = `${API_BASE}/users`;
export const CONFIRM_PHONE = `${API_BASE}/users/confirmPhone`;
export const AUTH_LOGIN = `${API_BASE}/auth/login`;
export const CREATE_ORDER = `${API_BASE}/orders`;
export const GET_ORDER = (orderId: string) => `${API_BASE}/orders/${orderId}`;
export const GET_DISCOUNT_CODE = (name: string) => `${API_BASE}/discount-code/by-name/${name}`;
export const CREATE_INVOICE_CHARGE = `${API_BASE}/invoices/create-charge`;
export const GET_DESIGN = (designId: string) => `${API_BASE}/design/${designId}`;
export const CREATE_DESIGN = `${API_BASE}/design`;
export const GET_LATEST_DESIGN = (userId: string) => `${API_BASE}/design/latest/${userId}`;
export const GET_USER_DESIGNS = (userId: string) => `${API_BASE}/design/user/${userId}`;
//routes
