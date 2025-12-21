// FILE: demo/src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Các pages chức năng
import HomePage from '../pages/HomePage';
import LibraryPage from '../pages/LibraryPage';
import RankPage from '../pages/RankPage';
import FavoritesPage from '../pages/FavoritesPage';
import RecentPage from '../pages/RecentPage';
import OftenListenedPage from '../pages/OftenListenedPage'; 
import AlbumsPage from '../pages/AlbumsPage';
import GenresPage from '../pages/GenresPage';
import GenrePage from '../pages/GenrePage';
import ProfilePage from '../pages/ProfilePage';
import AlbumDetailPage from '../pages/AlbumDetailPage';
import PlaylistDetailPage from '../pages/PlaylistDetailPage';

// Các pages đặc biệt (Thanh toán & Admin)
import CheckoutPage from '../pages/CheckoutPage'; // ĐÃ THÊM IMPORT NÀY
import DashboardPage from '../pages/admin/DashboardPage';

// Auth pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

function AppRoutes() {
  return (
    <Routes>
      {/* 1. Các trang nằm trong giao diện chính (có Sidebar, Player) */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="rank" element={<RankPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="often-listened" element={<OftenListenedPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="album/:id" element={<AlbumDetailPage />} />
        <Route path="playlists" element={<LibraryPage />} />
        <Route path="playlist/:id" element={<PlaylistDetailPage />} />
        <Route path="genres" element={<GenresPage />} />
        <Route path="genre/:id" element={<GenrePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/dashboard" element={<DashboardPage />} />
      </Route>

      {/* 2. Các trang độc lập (Full màn hình, không có Sidebar) */}
      <Route path="checkout" element={<CheckoutPage />} /> 
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />

      {/* 3. Trang lỗi */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;