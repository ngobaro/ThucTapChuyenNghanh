// FILE: demo/src/pages/FavoritesPage.jsx
import { useState, useEffect } from 'react';
import { Heart, Play, MoreVertical } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './FavoritesPage.css';

function FavoritesPage() {
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchFavoriteSongs();
  }, []);

  const fetchFavoriteSongs = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin user hiện tại
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No user ID found');
        return;
      }
      
      // Lấy user info với danh sách favorites
      const userResponse = await api.get(API_ENDPOINTS.USER_BY_ID(userId));
      console.log('User response for favorites:', userResponse.data);
      
      const userData = userResponse.data.result || userResponse.data;
      setUser(userData);
      
      // Nếu user có danh sách favorite song IDs
      let favoriteSongIds = [];
      if (userData.favorites && Array.isArray(userData.favorites)) {
        favoriteSongIds = userData.favorites;
      } else if (userData.favoriteSongs) {
        favoriteSongIds = userData.favoriteSongs;
      }
      
      console.log('Favorite song IDs:', favoriteSongIds);
      
      if (favoriteSongIds.length === 0) {
        setFavoriteSongs([]);
        return;
      }
      
      // Lấy thông tin chi tiết của từng bài hát yêu thích
      const favoriteSongsPromises = favoriteSongIds.map(async (songId) => {
        try {
          const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          const song = songResponse.data.result || songResponse.data;
          
          // Lấy artist name
          let artistName = 'Unknown Artist';
          if (song.idartist) {
            try {
              const artistResponse = await api.get(API_ENDPOINTS.ARTIST_BY_ID(song.idartist));
              const artist = artistResponse.data.result || artistResponse.data;
              artistName = artist.artistname || artist.name || 'Unknown Artist';
            } catch (artistError) {
              console.warn(`Could not fetch artist for song ${songId}:`, artistError);
            }
          }
          
          return {
            id: song.songId || song.id,
            title: song.title || 'Unknown Title',
            artist: artistName,
            album: song.idalbum || 'Single',
            duration: formatDuration(song.duration),
            coverColor: getRandomColor(),
            addedDate: new Date().toLocaleDateString('vi-VN')
          };
        } catch (error) {
          console.error(`Error fetching song ${songId}:`, error);
          return null;
        }
      });
      
      const songs = (await Promise.all(favoriteSongsPromises)).filter(Boolean);
      console.log('Favorite songs details:', songs);
      setFavoriteSongs(songs);
      
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
      
      // Fallback data
      setFavoriteSongs([
        { 
          id: 101, 
          title: 'Blinding Lights', 
          artist: 'The Weeknd', 
          album: 'After Hours',
          duration: '3:22',
          addedDate: '2024-01-15',
          coverColor: '#8B0000'
        },
        { 
          id: 102, 
          title: 'Flowers', 
          artist: 'Miley Cyrus', 
          album: 'Endless Summer Vacation',
          duration: '3:20',
          addedDate: '2024-02-10',
          coverColor: '#FF69B4'
        },
      ]);
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

  const getRandomColor = () => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePlay = (songId) => {
    console.log('Play song:', songId);
  };

  const handleRemoveFavorite = async (songId) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      // Gọi API để xóa khỏi favorites
      await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId));
      
      // Cập nhật UI
      setFavoriteSongs(prev => prev.filter(song => song.id !== songId));
      
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="favorites-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="page-header">
        <div className="header-icon">
          <Heart size={48} />
        </div>
        <div className="header-info">
          <span className="page-type">COLLECTION</span>
          <h1>Bài hát yêu thích</h1>
          <p>{favoriteSongs.length} bài hát đã thích</p>
        </div>
      </div>

      {favoriteSongs.length > 0 ? (
        <div className="favorites-content">
          <div className="favorites-controls">
            <button className="btn-play-all" onClick={() => handlePlay('all')}>
              <Play size={20} />
              Phát tất cả
            </button>
          </div>

          <div className="favorites-grid">
            {favoriteSongs.map(song => (
              <div key={song.id} className="song-card">
                <div 
                  className="song-cover"
                  style={{ backgroundColor: song.coverColor }}
                >
                  <span className="song-icon">♪</span>
                  <button 
                    className="btn-play-overlay"
                    onClick={() => handlePlay(song.id)}
                  >
                    <Play size={24} />
                  </button>
                </div>
                <div className="song-info">
                  <h3 className="song-title">{song.title}</h3>
                  <p className="song-artist">{song.artist}</p>
                  <div className="song-meta">
                    <span className="song-album">{song.album}</span>
                    <span className="song-duration">{song.duration}</span>
                  </div>
                  <div className="song-actions">
                    <button 
                      className="btn-favorite active"
                      onClick={() => handleRemoveFavorite(song.id)}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                    <button className="btn-more">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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