// src/components/admin/DashboardHeader.jsx
import { RefreshCw, Home, LogOut } from 'lucide-react';

function DashboardHeader({ onRefresh, onLogout }) {
    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="dashboard-header">
            <div className="header-left">
                <h1>Admin Dashboard</h1>
                <p>Quản lý toàn bộ dữ liệu hệ thống</p>
            </div>
            <div className="header-right">
                <button
                    className="header-btn header-btn-refresh"
                    onClick={onRefresh}
                    title="Tải lại dữ liệu"
                >
                    <RefreshCw size={16} />
                    <span>Tải lại</span>
                </button>

                <button
                    className="header-btn header-btn-home"
                    onClick={handleGoHome}
                    title="Về trang chủ"
                >
                    <Home size={16} />
                    <span>Trang chủ</span>
                </button>

                <button
                    className="header-btn header-btn-logout"
                    onClick={onLogout}
                    title="Đăng xuất"
                >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}

export default DashboardHeader;