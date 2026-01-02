// FILE: demo/src/pages/FavoritesPage.jsx
import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import SongCard from '../../components/music/SongCard';
import { getUserId, fetchFavoriteSongs, removeFavorite } from '../../services/favoriteService'; // Import từ service mới
import './FavoritesPage.css';

function FavoritesPage() {
  const { userId: contextUserId, toggleFavorite, forceRefreshFavorites } = usePlayer();

  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const uid = await getUserId();
      if (!uid) {
        throw new Error('No user ID');
      }
      setUserId(uid);

      const songs = await fetchFavoriteSongs(uid);
      setFavoriteSongs(songs);

      // Refresh context
      forceRefreshFavorites();
    } catch (error) {
      console.error('Error loading favorites:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        setFavoriteSongs([]); // Empty on error, no mock
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (songId) => {
    try {
      const uid = userId || contextUserId;
      if (!uid) {
        alert('Vui lòng đăng nhập lại!');
        return;
      }

      await removeFavorite(uid, songId);

      // Update local state
      setFavoriteSongs(prev => prev.filter(song => song.id !== songId));

      // Sync context
      toggleFavorite(songId);
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Lỗi khi xóa bài hát yêu thích');
    }
  };

  if (loading) {
    return (
      <div className="favorites-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <section className="hero-section">
        <h1>Bài hát yêu thích</h1>
        <p>Những bài hát bạn đã lưu</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{favoriteSongs.length}</strong> bài hát
          </span>
        </div>
      </section>

      {favoriteSongs.length > 0 ? (
        <section className="trending-section">
          <h2>Danh sách yêu thích của bạn</h2>
          <div className="song-grid">
            {favoriteSongs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                songs={favoriteSongs}
                index={index}
                onRemoveFavorite={handleRemoveFavorite}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-state">
          <Heart size={64} />
          <h2>Chưa có bài hát yêu thích</h2>
          <p>Nhấn vào biểu tượng trái tim để lưu bài hát vào đây</p>
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;