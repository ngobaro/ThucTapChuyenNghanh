// FILE: demo/src/components/music/SongListRecent.jsx

import { Play, Heart, MoreVertical, Loader2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../utils/formatTime';
import { useAudioDuration } from '../../hooks/useAudioDuration';
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './SongList.css'; // Reuse CSS, add .col-listened if needed

function SongListRecent({ songs, title }) {
  const { playQueue, currentSong } = usePlayer();
  const [favoriteStates, setFavoriteStates] = useState({});
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [userId, setUserId] = useState(null);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Fetch userId từ localStorage HOẶC /users/myInfo nếu null
  useEffect(() => {
    const fetchUserProfile = async () => {
      const storedUserId = localStorage.getItem('userId');
      console.log('Stored userId in SongListRecent:', storedUserId); // Debug
      if (storedUserId) {
        const parsedId = Number(storedUserId);
        if (!isNaN(parsedId)) {
          setUserId(parsedId);
          return;
        }
      }
      // Fetch nếu null
      setIsLoadingUser(true);
      try {
        const res = await api.get(API_ENDPOINTS.MY_INFO); // GET /users/myInfo
        const userData = res.data?.result || res.data;
        console.log('Fetched user profile in SongListRecent:', userData);
        const fetchedId = userData?.id || userData?.userId;
        if (fetchedId) {
          setUserId(Number(fetchedId));
          localStorage.setItem('userId', fetchedId.toString()); // Cache
          console.log('Fetched userId in SongListRecent:', fetchedId);
          // Nếu myInfo có favoriteSongs ngay, load luôn (optional)
          if (userData.favoriteSongs) {
            const favIds = userData.favoriteSongs.map(s => s.songId);
            const map = {};
            favIds.forEach(id => map[id] = true);
            const result = {};
            songs?.forEach(song => result[song.id] = !!map[song.id]);
            setFavoriteStates(result);
            setFavoritesLoaded(true);
          }
        } else {
          console.warn('No userId in myInfo response');
        }
      } catch (err) {
        console.error('Fetch user profile error in SongListRecent:', err);
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserProfile();
  }, []); // Chạy 1 lần

  // Load favorites only when userId is set and songs are available
  useEffect(() => {
    if (userId && songs?.length > 0 && !favoritesLoaded) {
      loadFavorites();
    }
  }, [userId, songs?.length]);

  // Reset favoritesLoaded nếu songs thay đổi để load lại
  useEffect(() => {
    if (favoritesLoaded) {
      setFavoritesLoaded(false);
    }
  }, [songs]);

  const loadFavorites = useCallback(async () => {
    try {
      // Dùng USER_FAVORITES(userId) thay USER_BY_ID (trả list SongResponse)
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(userId)); // GET /users/{userId}/favorites
      const favSongs = res.data?.result || []; // List<SongResponse>
      const favIds = favSongs.map(song => song.songId); // Extract IDs từ response
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
      console.error('Load favorites error in SongListRecent:', err);
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
      // Thêm feedback cho user chưa login
      alert('Vui lòng đăng nhập để thêm yêu thích!');
      return;
    }
    if (favoriteLoading[songId]) return;
    setFavoriteLoading(prev => ({ ...prev, [songId]: true }));
    try {
      const isFavorited = favoriteStates[songId];
      if (isFavorited) {
        await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId)); // DELETE /users/{userId}/favorites/{songId}
      } else {
        await api.post(API_ENDPOINTS.ADD_FAVORITE(userId, songId)); // POST /users/{userId}/favorites/{songId}
      }
      setFavoriteStates(prev => ({
        ...prev,
        [songId]: !isFavorited
      }));
    } catch (err) {
      console.error('Toggle favorite error in SongListRecent:', err);
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

  // Show loading nếu đang fetch user
  if (isLoadingUser) {
    return (
      <div className="song-list-container">
        {title && <h2 className="song-list-title">{title}</h2>}
        <div className="song-list">
          <div className="song-list-loading">
            <Loader2 size={24} className="spinner" />
            <p>Đang tải thông tin user...</p>
          </div>
        </div>
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
          <span className="col-listened">Nghe lần cuối</span> {/* Fixed: Always show for Recent */}
          <span className="col-duration">Thời lượng</span>
          <span className="col-actions"></span>
        </div>
        {songs.map((song, index) => {
          const songId = song.id;
          const isCurrentSong = currentSong?.id === songId;
          const isFavorited = !!favoriteStates[songId];
          const isLoading = favoriteLoading[songId];
          const isDisabled = isLoading;
          const { duration, loading: durationLoading } = useAudioDuration(song.audioUrl);
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
              <span className="col-listened">{song.listenedAt}</span> {/* Fixed: Display listenedAt */}
              <span className="col-duration">
                {durationLoading ? <Loader2 size={14} className="spinner" /> : formatTime(displayDuration)}
              </span>
              <div
                className="col-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`btn-action ${isFavorited ? 'active' : ''} ${!userId ? 'disabled' : ''}`}
                  onClick={() => toggleFavorite(songId)}
                  disabled={isDisabled}
                  style={{
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : (!userId ? 'default' : 'pointer')
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

export default SongListRecent;