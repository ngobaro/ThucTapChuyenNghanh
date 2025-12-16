// FILE: demo/src/components/layout/PlayerBar.jsx

import { Heart, MoreVertical } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import PlayerControls from '../music/PlayerControls';
import ProgressBar from '../music/ProgressBar';
import VolumeControl from '../music/VolumeControl';
import './PlayerBar.css';

function PlayerBar() {
  const { currentSong, isPlaying } = usePlayer();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    console.log('Stored userId in PlayerBar:', storedUserId); // Debug log
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  useEffect(() => {
    if (currentSong && userId) {
      checkIfFavorited(currentSong.id);
    } else {
      setIsFavorited(false);
    }
  }, [currentSong, userId]);

  const checkIfFavorited = useCallback(async (songId) => {
    console.log('Checking favorite for song:', songId, 'user:', userId); // Debug log
    try {
      const userResponse = await api.get(API_ENDPOINTS.USER_BY_ID(userId));
      console.log('User response in PlayerBar:', userResponse.data); // Debug log
      
      const userData = userResponse.data.result || userResponse.data;
      
      let favoriteSongIds = [];
      if (userData.favorites && Array.isArray(userData.favorites)) {
        favoriteSongIds = userData.favorites;
        console.log('Found favorites in PlayerBar:', favoriteSongIds); // Debug log
      } else if (userData.favoriteSongs && Array.isArray(userData.favoriteSongs)) {
        favoriteSongIds = userData.favoriteSongs;
      }
      
      const isCurrentlyFavorited = favoriteSongIds.includes(songId);
      console.log('Is favorited:', isCurrentlyFavorited); // Debug log
      setIsFavorited(isCurrentlyFavorited);
    } catch (error) {
      console.error('Error checking favorite status in PlayerBar:', error);
      setIsFavorited(false);
    }
  }, [userId]);

  const toggleFavorite = useCallback(async () => {
    if (!currentSong || !userId) {
      alert('Vui lòng đăng nhập để sử dụng chức năng này');
      return;
    }
    
    console.log('Toggling favorite in PlayerBar for song:', currentSong.id); // Debug log
    
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        console.log('Removing from favorites in PlayerBar...'); // Debug log
        await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, currentSong.id));
      } else {
        console.log('Adding to favorites in PlayerBar...'); // Debug log
        await api.post(API_ENDPOINTS.ADD_FAVORITE(userId, currentSong.id), {});
      }
      
      setIsFavorited(!isFavorited);
      console.log('Favorite toggled in PlayerBar'); // Debug log
    } catch (error) {
      console.error('Error toggling favorite in PlayerBar:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.data); // Debug log
      }
      alert('Có lỗi xảy ra khi cập nhật danh sách yêu thích: ' + (error.response?.data?.message || error.message));
    } finally {
      setFavoriteLoading(false);
    }
  }, [currentSong, userId, isFavorited]);

  if (!currentSong) {
    return (
      <div className="player-bar empty">
        <div className="player-bar-content">
          <p className="empty-message">Select a song to play</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`player-bar ${isPlaying ? 'playing' : ''}`}>
      <div className="player-bar-content">
        {/* Left side: Song info */}
        <div className="player-left">
          <div className="song-info">
            <div className="song-cover-container">
              <img 
                src={currentSong.coverUrl || '/default-cover.png'} 
                alt={currentSong.title}
                className="song-cover"
              />
            </div>
            <div className="song-details">
              <h4 className="song-title">{currentSong.title}</h4>
              <p className="song-artist">{currentSong.artist || 'Unknown Artist'}</p>
            </div>
            {/* Hai nút action */}
            <div className="song-actions">
              <button 
                className={`btn-action ${isFavorited ? 'active' : ''}`}
                title={isFavorited ? "Bỏ thích" : "Yêu thích"}
                onClick={toggleFavorite}
                disabled={favoriteLoading || !userId}
                style={{
                  opacity: (!userId || favoriteLoading) ? 0.5 : 1,
                  cursor: (!userId || favoriteLoading) ? 'not-allowed' : 'pointer'
                }}
              >
                {favoriteLoading ? (
                  <Loader2 size={18} className="spinner" />
                ) : (
                  <Heart 
                    size={18} 
                    fill={isFavorited ? "currentColor" : "none"} 
                    strokeWidth={isFavorited ? 0 : 2}
                  />
                )}
              </button>
              <button 
                className="btn-action"
                title="Tùy chọn"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Controls and progress */}
        <div className="player-center">
          <PlayerControls />
          <ProgressBar />
        </div>

        {/* Right side: Volume */}
        <div className="player-right">
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

export default PlayerBar;