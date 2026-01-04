import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { ROUTES } from '../../utils/constants';
import './AuthPages.css';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);

  // Validate từng field khi người dùng nhập
  const validateField = (name, value) => {
    let error = '';
    
    if (name === 'username') {
      if (!value.trim()) {
        error = 'Username không được để trống';
      } else if (value.length < 3) {
        error = 'Username phải có ít nhất 3 ký tự';
      } else if (value.length > 12) {
        error = 'Username không được vượt quá 12 ký tự';
      }
    }
    
    if (name === 'password') {
      if (!value) {
        error = 'Password không được để trống';
      } else if (value.length < 8) {
        error = 'Password phải có ít nhất 8 ký tự';
      } else if (value.length > 20) {
        error = 'Password không được vượt quá 20 ký tự';
      }
    }
    
    setErrors(prev => ({ ...prev, [name]: error, general: '' }));
    return error;
  };

  // Validate toàn bộ form trước khi submit
  const validateForm = () => {
    const usernameError = validateField('username', formData.username);
    const passwordError = validateField('password', formData.password);
    
    return !usernameError && !passwordError;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset lỗi general
    setErrors(prev => ({ ...prev, general: '' }));
    
    // Kiểm tra validation trước khi gửi request
    if (!validateForm()) {
      return; // Dừng lại nếu validation không pass
    }
    
    setLoading(true);
    
    try {
      const response = await login(formData.username, formData.password);
      
      if (response.success && response.token) {
        alert('Đăng nhập thành công!');
        navigate(ROUTES.HOME);
      } else {
        // Lỗi từ backend (sai username/password)
        setErrors(prev => ({ 
          ...prev, 
          general: 'Username hoặc password không chính xác' 
        }));
      }
    } catch (err) {
      // Xử lý các lỗi khác
      if (err.message?.includes('Uncategorized Exception')) {
        setErrors(prev => ({ 
          ...prev, 
          general: 'Username hoặc password không chính xác' 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          general: err.message || 'Có lỗi xảy ra, vui lòng thử lại!' 
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Spoti-five</h1>
        <h2>Đăng nhập</h2>
        
        {errors.general && <div className="error-message">{errors.general}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="user"
              disabled={loading}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && (
              <span className="field-error1">{errors.username}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="password"
              disabled={loading}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && (
              <span className="field-error1">{errors.password}</span>
            )}
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        
        <p className="auth-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;