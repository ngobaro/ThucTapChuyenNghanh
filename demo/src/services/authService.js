// FILE: demo/src/services/authService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Utility to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Decode token error:', err);
    return null;
  }
};

export const login = async (username, password) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      username,
      password
    });
    
    const data = response.data.result || response.data;
    
    let token = data.token || data.access_token || data.accessToken;
    let refreshToken = data.refreshToken || data.refresh_token;
    
    if (!token || !token.includes('.')) {
      throw new Error('Invalid token received from backend');
    }
    
    // Decode token to extract role
    const decodedToken = decodeToken(token);
    console.log('Decoded token payload:', decodedToken); // Debug: Check payload in console
    
    // Extract role from token payload (supports scope, role, userRole, authorities)
    let userRole = 'USER';
    if (decodedToken) {
      if (decodedToken.scope && decodedToken.scope.includes('ADMIN')) {
        userRole = 'ADMIN';
      } else if (decodedToken.role && decodedToken.role.toUpperCase().includes('ADMIN')) {
        userRole = 'ADMIN';
      } else if (decodedToken.userRole && decodedToken.userRole.toUpperCase().includes('ADMIN')) {
        userRole = 'ADMIN';
      } else if (decodedToken.authorities && Array.isArray(decodedToken.authorities)) {
        const adminAuthority = decodedToken.authorities.find(auth => 
          auth.includes('ADMIN') || auth.includes('ROLE_ADMIN')
        );
        if (adminAuthority) {
          userRole = 'ADMIN';
        }
      }
    }
    
    // Fallback to response data if not in token
    if (userRole === 'USER') {
      // Method 1: Direct role field
      if (data.role && data.role.toUpperCase().includes('ADMIN')) {
        userRole = 'ADMIN';
      }
      // Method 2: Nested in user object
      else if (data.user && data.user.role && data.user.role.toUpperCase().includes('ADMIN')) {
        userRole = 'ADMIN';
      }
      // Method 3: From authorities array
      else if (data.authorities && Array.isArray(data.authorities)) {
        const adminAuthority = data.authorities.find(auth => 
          auth.includes('ADMIN') || auth.includes('ROLE_ADMIN')
        );
        if (adminAuthority) {
          userRole = 'ADMIN';
        }
      }
    }
    
    console.log('Extracted role from login:', userRole); // Debug: Confirm role extraction
    
    // LƯU TOKEN VÀO LOCALSTORAGE
    localStorage.setItem('token', token);
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    // Lưu user info với role đã xác định (uppercase for consistency)
    const userInfo = {
      username,
      role: userRole.toUpperCase(), // Ensure uppercase
      // Thêm các field khác nếu có
      id: data.userId || data.id || data.user?.id || decodedToken?.sub,
      email: data.email || data.user?.email || decodedToken?.email
    };
    
    localStorage.setItem('user', JSON.stringify(userInfo));
    
    // Nếu có userId, lưu riêng
    if (userInfo.id) {
      localStorage.setItem('userId', userInfo.id);
    }

    return { 
      success: true, 
      data, 
      token,
      user: userInfo
    };
    
  } catch (error) {
    console.error('Login error details:', error);
    
    const errorMsg = error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message || 
                    'Username hoặc password không đúng!';
    
    return { 
      success: false, 
      error: errorMsg,
      details: error.response?.data
    };
  }
};

// Hàm lấy thông tin user hiện tại
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    
    const data = response.data;
    
    if (data.code === 1000 || response.status === 200 || response.status === 201) {
      return { 
        success: true, 
        data: data.result || data,
        message: data.message || 'Đăng ký thành công!'
      };
    } else {
      throw new Error(data.message || 'Đăng ký thất bại');
    }
  } catch (error) {
    console.error('Register error:', error.response?.data || error);
    
    const errorData = error.response?.data;
    let errorMsg = 'Đăng ký thất bại!';
    
    if (errorData) {
      if (errorData.message) {
        errorMsg = errorData.message;
      } else if (errorData.error) {
        errorMsg = errorData.error;
      } else if (errorData.code) {
        // Mapping cho các error code phổ biến
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

// Hàm kiểm tra token hợp lệ
const isValidToken = (token) => {
  if (!token) return false;
  if (token === 'null' || token === 'undefined') return false;
  if (typeof token !== 'string') return false;
  if (token.length < 10) return false;
  return true;
};

export const isAuthenticated = () => {
  return !!getCurrentUser();
};

export const getUserId = () => {
  const user = getCurrentUser();
  return user?.id ? Number(user.id) : null;
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || 'USER'; // Already uppercase from login
};

export const isAdmin = () => {
  return getUserRole() === 'ADMIN';
};