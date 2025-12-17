// FILE: demo/src/services/authService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const login = async (username, password) => {
  try {
    console.log('🔐 Attempting login with:', { username });
    
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      username,
      password
    });
    
    console.log('✅ Login API Response FULL:', response);
    console.log('✅ Login response.data:', response.data);
    
    const data = response.data.result || response.data;
    console.log('✅ Extracted data:', data);
    
    let token = data.token || data.access_token || data.accessToken;
    let refreshToken = data.refreshToken || data.refresh_token;
    
    console.log('✅ Token found:', token ? 'YES' : 'NO');
    console.log('✅ Token value:', token);
    console.log('✅ Refresh token:', refreshToken);
    
    if (!token || !token.includes('.')) {
      console.error('❌ Invalid token format');
      throw new Error('Invalid token received from backend');
    }
    
    // DEBUG: Check all possible role fields
    console.log('🔍 Checking role fields in data:');
    console.log('  - data.role:', data.role);
    console.log('  - data.user?.role:', data.user?.role);
    console.log('  - data.result?.role:', data.result?.role);
    console.log('  - data.authorities:', data.authorities);
    console.log('  - data.scope:', data.scope);
    console.log('  - All keys in data:', Object.keys(data));
    
    // Try to find role from various possible locations
    let userRole = 'USER';
    
    // Method 1: Direct role field
    if (data.role) {
      userRole = data.role;
    }
    // Method 2: Nested in user object
    else if (data.user && data.user.role) {
      userRole = data.user.role;
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
    // Method 4: Check if username is admin (for testing)
    else if (username.toLowerCase().includes('admin')) {
      userRole = 'ADMIN';
      console.log('⚠️  Assuming ADMIN role based on username');
    }
    
    console.log(`✅ Determined user role: ${userRole}`);
    
    // ✅ LƯU TOKEN VÀO LOCALSTORAGE
    localStorage.setItem('token', token);
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    // Lưu user info với role đã xác định
    const userInfo = {
      username,
      role: userRole,
      // Thêm các field khác nếu có
      id: data.userId || data.id || data.user?.id,
      email: data.email || data.user?.email
    };
    
    console.log('✅ Saving user info to localStorage:', userInfo);
    
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
    console.error('❌ Login error details:');
    console.error('  - Error message:', error.message);
    console.error('  - Error response:', error.response?.data);
    console.error('  - Error status:', error.response?.status);
    
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
    console.log('Calling register API with:', userData);
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    console.log('Register API response:', response);
    
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
  return user?.role?.toUpperCase() || 'USER';
};

export const isAdmin = () => {
  return getUserRole() === 'ADMIN';
};