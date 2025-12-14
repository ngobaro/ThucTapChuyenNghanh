import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const login = async (username, password) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      username,
      password
    });
    console.log('Login response full:', response.data); // Debug

    // Fix: Extract từ response.data (backend ApiResponse { code: 1000, result: { token } })
    const data = response.data.result || response.data;
    let token = data.token || data.access_token;
    let refreshToken = data.refreshToken || data.refresh_token;

    if (!token || !token.includes('.')) {
      throw new Error('Invalid token received from backend');
    }

    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({ username, role: data.role || 'USER' })); // Lưu user

    return { success: true, data, token };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || 'Unauthenticated - Username hoặc password không đúng!';
    return { success: false, error: errorMsg }; // String message cho FE
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    const data = response.data.result || response.data;
    if (data.code === 1000) {
      return { success: true, data };
    } else {
      throw new Error(data.message || 'Đăng ký thất bại');
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Đăng ký thất bại!';
    return { success: false, error: errorMsg };
  }
};

export const logout = async () => {
  try {
    await api.post(API_ENDPOINTS.LOGOUT, {});
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.clear(); // Clear all
  }
};