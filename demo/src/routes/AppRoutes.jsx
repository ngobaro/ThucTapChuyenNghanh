import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import SearchPage from '../pages/SearchPage';
import LibraryPage from '../pages/LibraryPage';
import PlaylistPage from '../pages/PlaylistPage';
import FavoritesPage from '../pages/FavoritesPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/admin/DashboardPage'; // Uncomment sau khi tạo

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="playlist/:id" element={<PlaylistPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="dashboard" element={<DashboardPage />} /> {/* Admin route */}
      </Route>
      
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;