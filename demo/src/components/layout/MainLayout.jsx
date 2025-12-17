// src/layouts/MainLayout.jsx (hoặc file MainLayout của bạn)
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PlayerProvider } from '../../context/PlayerContext';
import Header from './Header';           // Header của user
import Sidebar from './Sidebar';         // Sidebar của user
import PlayerBar from './PlayerBar';     // PlayerBar của user

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra có đang ở route admin không
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Nếu đang ở admin → ẩn Header, Sidebar user, PlayerBar → để Dashboard full màn hình
  if (isAdminRoute) {
    return (
      <PlayerProvider>
        <div className="admin-full-layout">
          {/* Nội dung admin (DashboardPage) sẽ tự có header riêng bên trong */}
          <main className="admin-content-full">
            <Outlet />
          </main>
        </div>
      </PlayerProvider>
    );
  }

  // Nếu là trang user thường → hiển thị layout đầy đủ như cũ
  return (
    <PlayerProvider>
      <div className="main-layout">
        <Header />

        <div className="main-content">
          <Sidebar />
          <main className="content-area">
            <Outlet />
          </main>
        </div>

        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}

export default MainLayout;