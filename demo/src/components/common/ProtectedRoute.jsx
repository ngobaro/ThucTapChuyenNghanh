// FILE: demo/src/components/common/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const user = getCurrentUser();
  
  if (!user) {
    // Chưa đăng nhập
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'ADMIN') {
    // Không phải admin
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute;