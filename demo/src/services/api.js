// FILE: demo/src/services/api.js
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Hàm kiểm tra token hợp lệ
const isValidToken = (token) => {
  if (!token) return false;
  if (token === 'null' || token === 'undefined') return false;
  if (typeof token !== 'string') return false;
  if (token.length < 10) return false; // Token thường dài
  return true;
};

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isValid = isValidToken(token);
    
    console.log(`🔑 [${config.method?.toUpperCase()}] ${config.url}`, {
      hasToken: !!token,
      isValid,
      tokenLength: token?.length
    });
    
    if (isValid) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Xóa header Authorization nếu token không hợp lệ
      delete config.headers.Authorization;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.status}] ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error [${error.response?.status}] ${error.config?.url}:`, {
      message: error.message,
      response: error.response?.data
    });
    
    // Xử lý 401 - Unauthorized
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized detected');
      
      // Nếu là request lấy user info, không retry
      if (originalRequest.url?.includes('/users/myInfo')) {
        console.log('⚠️ User info request failed, clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        return Promise.reject(error);
      }
      
      // Thử refresh token nếu có
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (isValidToken(refreshToken)) {
            console.log('🔄 Attempting token refresh...');
            
            const response = await axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
              { token: refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const { token } = response.data.result || response.data;
            if (token) {
              localStorage.setItem('token', token);
              originalRequest.headers.Authorization = `Bearer ${token}`;
              console.log('✅ Token refreshed successfully');
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
        }
      }
      
      // Clear auth data nếu refresh thất bại
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      
      // Chỉ redirect nếu đang ở page cần auth
      if (!window.location.pathname.includes('/login')) {
        console.log('⚠️ Redirecting to login page');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    // Xử lý 400 - Bad Request (thường do token không hợp lệ)
    if (error.response?.status === 400 && originalRequest.url?.includes('/users/myInfo')) {
      console.log('⚠️ Invalid token for myInfo, clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
    }
    
    return Promise.reject(error);
  }
);

export default api;