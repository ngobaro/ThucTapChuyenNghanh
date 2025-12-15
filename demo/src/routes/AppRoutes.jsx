// FILE: demo/src/routes/AppRoutes.jsx

import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Các pages CẦN GIỮ
import HomePage from '../pages/HomePage';
import LibraryPage from '../pages/LibraryPage';
import FavoritesPage from '../pages/FavoritesPage';
import DiscoverPage from '../pages/DiscoverPage';
import RecentPage from '../pages/RecentPage';
import AlbumsPage from '../pages/AlbumsPage';
import GenresPage from '../pages/GenresPage';
import GenrePage from '../pages/GenrePage';
import ProfilePage from '../pages/ProfilePage';

// Auth pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Routes sử dụng MainLayout */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="genres" element={<GenresPage />} />
        <Route path="genre/:id" element={<GenrePage />} /> {/* Route cho thể loại */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Route cho Bảng xếp hạng */}
        <Route path="charts" element={<DiscoverPage />} /> {/* Tạm dùng DiscoverPage */}
        
        {/* Route cho Playlist */}
        <Route path="playlists" element={<LibraryPage />} /> {/* Tạm dùng LibraryPage */}
      </Route>
      
      {/* Routes không sử dụng MainLayout (Auth pages) */}
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      
      {/* 404 page */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}

export default AppRoutes;