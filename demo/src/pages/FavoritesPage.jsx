// FILE: demo/src/pages/FavoritesPage.jsx

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import SongCard from '../components/music/SongCard'; // Import SongCard cho grid
import './FavoritesPage.css';

function FavoritesPage() {
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null); // Handle userId fetch

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  const fetchUserAndFavorites = async () => {
    try {
      setLoading(true);
      
      // Fetch userId nếu chưa có (từ /users/myInfo)
      let currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        try {
          const userRes = await api.get(API_ENDPOINTS.MY_INFO);
          const userData = userRes.data?.result || userRes.data;
          currentUserId = userData?.id || userData?.userId;
          if (currentUserId) {
            localStorage.setItem('userId', currentUserId.toString());
            setUserId(Number(currentUserId));
          } else {
            console.warn('No userId in myInfo');
            return;
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
          if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
          }
          return;
        }
      } else {
        setUserId(Number(currentUserId));
      }

      // Dùng USER_FAVORITES(userId) để lấy trực tiếp list SongResponse
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(currentUserId)); // GET /users/{userId}/favorites
      const favSongs = res.data?.result || []; // List<SongResponse> từ backend
      
      console.log('Favorite songs from API:', favSongs);
      
      // Map sang format cho SongCard (dùng dữ liệu từ response)
      const songs = favSongs.map(song => ({
        id: song.songId || song.id,
        title: song.title || 'Unknown Title',
        artist: song.artist || 'Unknown Artist', // Giả sử backend trả artist
        album: song.idalbum ? `Album ${song.idalbum}` : 'Single',
        duration: formatDuration(song.duration),
        coverUrl: song.avatar || '/default-cover.png', // Real cover
        addedDate: new Date().toLocaleDateString('vi-VN')
      }));

      setFavoriteSongs(songs);
      
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
      
      // Fallback data (chỉ nếu error không phải auth)
      if (error.response?.status !== 401) {
        setFavoriteSongs([
          { 
            id: 101, 
            title: 'Blinding Lights', 
            artist: 'The Weeknd', 
            album: 'After Hours',
            duration: '3:22',
            coverUrl: '/default-cover.png',
            addedDate: '2024-01-15'
          },
          { 
            id: 102, 
            title: 'Flowers', 
            artist: 'Miley Cyrus', 
            album: 'Endless Summer Vacation',
            duration: '3:20',
            coverUrl: '/default-cover.png',
            addedDate: '2024-02-10'
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    
    if (typeof duration === 'string') {
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          return `${parts[0]}:${parts[1]}`;
        }
        return duration;
      }
      return duration;
    }
    
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    return '00:00';
  };

  const handleRemoveFavorite = async (songId) => {
    try {
      if (!userId) {
        alert('Vui lòng đăng nhập lại!');
        return;
      }
      
      // Gọi API để xóa khỏi favorites
      await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId));
      
      // Cập nhật UI (filter local)
      setFavoriteSongs(prev => prev.filter(song => song.id !== songId));
      
      console.log('Removed favorite:', songId);
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
      <section className="hero-section"> {/* Match HomePage hero style */}
        <h1>❤️ Bài hát yêu thích</h1>
        <p>Những bài hát bạn đã lưu</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{favoriteSongs.length}</strong> bài hát
          </span>
        </div>
      </section>

      {favoriteSongs.length > 0 ? (
        <section className="trending-section"> {/* Match HomePage trending style */}
          <h2>🔥 Danh sách yêu thích của bạn</h2>
          <div className="song-grid"> {/* Grid như Trending Now */}
            {favoriteSongs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                onRemoveFavorite={handleRemoveFavorite} // Pass callback cho remove
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