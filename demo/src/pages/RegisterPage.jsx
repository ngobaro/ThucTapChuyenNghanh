import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { ROUTES } from '../utils/constants';
import './AuthPages.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '', // Sửa name → username để match backend
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp!');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự!');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      const response = await register(userData);
      
      console.log('Register response:', response);
      
      if (response.success) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate(ROUTES.LOGIN);
      } else {
        const errorMsg = response.error?.message || 'Đăng ký thất bại!';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Register catch error:', err);
      setError('Có lỗi kết nối. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>🎵 Music Web</h1>
        <h2>Đăng ký</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Nhập username"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Nhập email"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Nhập lại mật khẩu"
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        
        <p className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;