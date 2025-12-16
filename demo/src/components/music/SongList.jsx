// FILE: demo/src/components/music/SongList.jsx

import { Play, Heart, MoreVertical, Loader2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../utils/formatTime';
import { useAudioDuration } from '../../hooks/useAudioDuration';
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './SongList.css';

function SongList({ songs, title }) {
  const { playQueue, currentSong } = usePlayer();
  const [favoriteStates, setFavoriteStates] = useState({});
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [userId, setUserId] = useState(null);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    console.log('Stored userId:', storedUserId); // Debug log
    if (storedUserId) {
      const parsedId = Number(storedUserId);
      if (!isNaN(parsedId)) {
        setUserId(parsedId);
      }
    }
  }, []);

  // Load favorites only when userId is set and songs are available
  useEffect(() => {
    if (userId && songs?.length > 0 && !favoritesLoaded) {
      loadFavorites();
    }
  }, [userId, songs?.length]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.USER_BY_ID(userId));
      const userData = res.data?.result || res.data;
      const favIds =
        userData?.favorites ||
        userData?.favoriteSongs ||
        [];
      const map = {};
      favIds.forEach(id => {
        map[id] = true;
      });
      const result = {};
      songs.forEach(song => {
        result[song.id] = !!map[song.id];
      });
      setFavoriteStates(result);
      setFavoritesLoaded(true);
    } catch (err) {
      console.error('Load favorites error:', err);
      const reset = {};
      songs.forEach(song => {
        reset[song.id] = false;
      });
      setFavoriteStates(reset);
      setFavoritesLoaded(true);
    }
  }, [userId, songs]);

  /* =======================
     TOGGLE FAVORITE
  ======================== */
  const toggleFavorite = async (songId) => {
    if (!userId) {
      // Không alert nữa, chỉ disable button
      return;
    }
    if (favoriteLoading[songId]) return;
    setFavoriteLoading(prev => ({ ...prev, [songId]: true }));
    try {
      const isFavorited = favoriteStates[songId];
      if (isFavorited) {
        await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId));
      } else {
        await api.post(API_ENDPOINTS.ADD_FAVORITE(userId, songId));
      }
      setFavoriteStates(prev => ({
        ...prev,
        [songId]: !isFavorited
      }));
    } catch (err) {
      console.error('Toggle favorite error:', err);
      alert('Có lỗi khi cập nhật yêu thích');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [songId]: false }));
    }
  };

  /* =======================
     PLAY SONG
  ======================== */
  const handlePlaySong = (song, index) => {
    playQueue(songs, index);
  };

  if (!songs || songs.length === 0) {
    return (
      <div className="song-list-empty">
        <p>Chưa có bài hát nào</p>
      </div>
    );
  }

  return (
    <div className="song-list-container">
      {title && <h2 className="song-list-title">{title}</h2>}
      <div className="song-list">
        <div className="song-list-header">
          <span className="col-number">#</span>
          <span className="col-title">Tiêu đề</span>
          <span className="col-artist">Nghệ sĩ</span>
          <span className="col-album">Album</span>
          <span className="col-duration">Thời lượng</span>
          <span className="col-actions"></span>
        </div>
        {songs.map((song, index) => {
          const songId = song.id;
          const isCurrentSong = currentSong?.id === songId;
          const isFavorited = !!favoriteStates[songId];
          const isLoading = favoriteLoading[songId];
          const isDisabled = !userId || isLoading;
          const { duration, loading } = useAudioDuration(song.audioUrl);
          const displayDuration =
            duration > 0
              ? duration
              : parseDuration(song.duration);
          return (
            <div
              key={songId}
              className={`song-list-item ${isCurrentSong ? 'playing' : ''}`}
              onClick={() => handlePlaySong(song, index)}
            >
              <span className="col-number">
                {isCurrentSong ? '🎵' : index + 1}
              </span>
              <div className="col-title">
                <img
                  src={song.coverUrl || '/default-cover.png'}
                  alt={song.title}
                  onError={(e) => (e.target.src = '/default-cover.png')}
                />
                <div>
                  <h4>{song.title}</h4>
                  <p>{song.artist || 'Unknown Artist'}</p>
                </div>
              </div>
              <span className="col-artist">{song.artist}</span>
              <span className="col-album">{song.album || 'Single'}</span>
              <span className="col-duration">
                {loading ? <Loader2 size={14} className="spinner" /> : formatTime(displayDuration)}
              </span>
              <div
                className="col-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`btn-action ${isFavorited ? 'active' : ''}`}
                  onClick={() => toggleFavorite(songId)}
                  disabled={isDisabled}
                  style={{
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="spinner" />
                  ) : (
                    <Heart
                      size={18}
                      fill={isFavorited ? 'currentColor' : 'none'}
                    />
                  )}
                </button>
                <button className="btn-action">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* =======================
   PARSE DURATION
======================== */
const parseDuration = (duration) => {
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string' && duration.includes(':')) {
    const [m, s] = duration.split(':').map(Number);
    return m * 60 + s;
  }
  return Number(duration) || 0;
};
export default SongList;