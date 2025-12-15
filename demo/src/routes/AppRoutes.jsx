// FILE: demo/src/routes/AppRoutes.jsx

import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Các pages
import HomePage from '../pages/HomePage';
import LibraryPage from '../pages/LibraryPage';
import RankPage from '../pages/RankPage'; // Import RankPage mới
import FavoritesPage from '../pages/FavoritesPage';
import RecentPage from '../pages/RecentPage';
import AlbumsPage from '../pages/AlbumsPage';
import GenresPage from '../pages/GenresPage';
import GenrePage from '../pages/GenrePage';
import ProfilePage from '../pages/ProfilePage';
import DashboardPage from '../pages/admin/DashboardPage'; // Import DashboardPage cho admin

// Auth pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="rank" element={<RankPage />} /> {/* Sử dụng RankPage */}
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="album/:id" element={<GenrePage />} />
        <Route path="playlists" element={<LibraryPage />} />
        <Route path="playlist/:id" element={<GenrePage />} />
        <Route path="genres" element={<GenresPage />} />
        <Route path="genre/:id" element={<GenrePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/dashboard" element={<DashboardPage />} /> {/* Route cho Admin Dashboard */}
      </Route>

      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;