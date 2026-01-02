// FILE: demo/src/routes/AppRoutes.jsx (hoặc src/AppRoutes.jsx)
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

/* ===== USER PAGES ===== */
import HomePage from '../pages/user/HomePage';
import LibraryPage from '../pages/user/LibraryPage';
import RankPage from '../pages/user/RankPage';
import FavoritesPage from '../pages/user/FavoritesPage';
import RecentPage from '../pages/user/RecentPage';
import OftenListenedPage from '../pages/user/OftenListenedPage';
import AlbumsPage from '../pages/user/AlbumsPage';
import AlbumDetailPage from '../pages/user/AlbumDetailPage';
import PlaylistDetailPage from '../pages/user/PlaylistDetailPage';
import GenresPage from '../pages/user/GenresPage'; // ✅ ĐÚNG IMPORT
import GenrePage from '../pages/user/GenrePage';
import ProfilePage from '../pages/user/ProfilePage';
import CheckoutPage from '../pages/user/CheckoutPage';
import NotFoundPage from '../pages/user/NotFoundPage';

/* ===== AUTH PAGES ===== */
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

/* ===== ADMIN ===== */
import DashboardPage from '../pages/admin/DashboardPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Layout chính */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="rank" element={<RankPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="often-listened" element={<OftenListenedPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="album/:id" element={<AlbumDetailPage />} />
        <Route path="playlist/:id" element={<PlaylistDetailPage />} />
        <Route path="genres" element={<GenresPage />} /> {/* ✅ ROUTE ĐÚNG */}
        <Route path="genre/:id" element={<GenrePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Pages không layout */}
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;