// FILE: src/services/authService.js
// Thay thế toàn bộ nội dung file này

import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const login = async (username, password) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      username,
      password
    });
    console.log('Login response full:', response.data);

    // Extract từ response.data (backend ApiResponse)
    const data = response.data.result || response.data;
    let token = data.token || data.access_token;
    let refreshToken = data.refreshToken || data.refresh_token;

    if (!token || !token.includes('.')) {
      throw new Error('Invalid token received from backend');
    }

    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({ username, role: data.role || 'USER' }));

    return { success: true, data, token };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || 'Unauthenticated - Username hoặc password không đúng!';
    return { success: false, error: errorMsg };
  }
};

export const register = async (userData) => {
  try {
    console.log('Calling register API with:', userData);
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    console.log('Register API response:', response);
    
    // ✅ FIX: Backend trả về { code: 1000, result: {...} }
    const data = response.data;
    
    // Kiểm tra code === 1000 (success) hoặc status 200/201
    if (data.code === 1000 || response.status === 200 || response.status === 201) {
      return { 
        success: true, 
        data: data.result || data,
        message: data.message || 'Đăng ký thành công!'
      };
    } else {
      // Backend trả về code khác 1000
      throw new Error(data.message || 'Đăng ký thất bại');
    }
  } catch (error) {
    console.error('Register error:', error.response?.data || error);
    
    // Extract error message từ backend
    const errorData = error.response?.data;
    let errorMsg = 'Đăng ký thất bại!';
    
    if (errorData) {
      if (errorData.message) {
        errorMsg = errorData.message;
      } else if (errorData.error) {
        errorMsg = errorData.error;
      } else if (errorData.code) {
        // Map error codes
        const errorMap = {
          1001: 'Username đã tồn tại',
          1002: 'Email đã được sử dụng',
          1003: 'Mật khẩu không hợp lệ',
          1004: 'Dữ liệu không hợp lệ'
        };
        errorMsg = errorMap[errorData.code] || `Lỗi: ${errorData.code}`;
      }
    }
    
    return { 
      success: false, 
      error: errorMsg,
      message: errorMsg
    };
  }
};

export const logout = async () => {
  try {
    await api.post(API_ENDPOINTS.LOGOUT, {});
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.clear();
  }
};