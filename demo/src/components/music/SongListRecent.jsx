// FILE: demo/src/components/music/SongListRecent.jsx

import { Play, Heart, MoreVertical, Loader2, Plus, X, ListMusic } from 'lucide-react';
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

  // Playlist modal states (copy from SongList for 3 dots functionality)
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const parsedId = Number(storedUserId);
        if (!isNaN(parsedId)) {
          setUserId(parsedId);
          return;
        }
      }
      setIsLoadingUser(true);
      try {
        const res = await api.get(API_ENDPOINTS.MY_INFO);
        const userData = res.data?.result || res.data;
        const fetchedId = userData?.id || userData?.userId;
        if (fetchedId) {
          setUserId(Number(fetchedId));
          localStorage.setItem('userId', fetchedId.toString());
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
  }, []);

  // Load favorites
  useEffect(() => {
    if (userId && songs?.length > 0 && !favoritesLoaded) {
      loadFavorites();
    }
  }, [userId, songs?.length, favoritesLoaded]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(userId));
      const favSongs = res.data?.result || [];
      const favIds = favSongs.map(song => song.songId || song.id);
      const map = {};
      favIds.forEach(id => map[id] = true);
      const result = {};
      songs.forEach(song => result[song.id] = !!map[song.id]);
      setFavoriteStates(result);
      setFavoritesLoaded(true);
    } catch (err) {
      console.error('Load favorites error in SongListRecent:', err);
      const reset = {};
      songs.forEach(song => reset[song.id] = false);
      setFavoriteStates(reset);
      setFavoritesLoaded(true);
    }
  }, [userId, songs]);

  // Toggle favorite
  const toggleFavorite = async (songId) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm yêu thích!');
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
      setFavoriteStates(prev => ({ ...prev, [songId]: !isFavorited }));
    } catch (err) {
      console.error('Toggle favorite error in SongListRecent:', err);
      alert('Có lỗi khi cập nhật yêu thích');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [songId]: false }));
    }
  };

  // Load playlists (copy from SongList)
  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;
    
    setLoadingPlaylists(true);
    try {
      const res = await api.get(API_ENDPOINTS.PLAYLISTS); // Backend filter theo token
      const loadedPlaylists = res.data?.result || res.data || [];
      console.log('Loaded playlists in SongListRecent:', loadedPlaylists); // Debug
      setPlaylists(loadedPlaylists);
    } catch (err) {
      console.error('Load playlists error in SongListRecent:', err);
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [userId]);

  // Auto load playlists khi có userId
  useEffect(() => {
    if (userId) {
      loadUserPlaylists();
    }
  }, [userId, loadUserPlaylists]);

  // Mở modal playlist (copy from SongList)
  const openPlaylistModal = async (songId, e) => {
    e.stopPropagation();
    
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm vào playlist!');
      return;
    }

    setCurrentSongId(songId);
    setShowPlaylistModal(true);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');

    if (playlists.length === 0 && !loadingPlaylists) {
      await loadUserPlaylists();
    }
  };

  // Đóng modal
  const closePlaylistModal = () => {
    setShowPlaylistModal(false);
    setCurrentSongId(null);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
  };

  // Thêm vào playlist
  const handleAddToPlaylist = async (playlistId) => {
    if (!currentSongId) return;
    
    try {
      await api.post(API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, currentSongId));
      alert('Đã thêm bài hát vào playlist!');
      closePlaylistModal();
      await loadUserPlaylists();
    } catch (err) {
      console.error('Add to playlist error in SongListRecent:', err);
      const msg = err.response?.data?.message || 'Không thể thêm bài hát vào playlist';
      if (msg.includes('existed')) {
        alert('Bài hát đã có trong playlist này!');
      } else {
        alert(msg);
      }
    }
  };

  // Tạo playlist mới
  const handleCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      setModalError('Vui lòng nhập tên playlist');
      return;
    }

    setCreatingPlaylist(true);
    try {
      const createRes = await api.post(API_ENDPOINTS.PLAYLISTS, {
        nameplaylist: trimmedName,
        description: ''
      });
      
      const newPlaylist = createRes.data?.result || createRes.data;
      if (newPlaylist?.id || newPlaylist?.idplaylist) {
        await loadUserPlaylists();
        setShowCreateForm(false);
        setNewPlaylistName('');
        setModalError('');
        
        await handleAddToPlaylist(newPlaylist.id || newPlaylist.idplaylist);
      }
    } catch (err) {
      console.error('Create playlist error in SongListRecent:', err);
      setModalError(err.response?.data?.message || 'Không thể tạo playlist');
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // Render modal playlist (copy from SongList)
  const renderPlaylistModal = () => {
    if (!showPlaylistModal || !currentSongId) return null;

    return (
      <div className="modal-overlay" onClick={closePlaylistModal}>
        <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Thêm vào playlist</h3>
            <button className="modal-close" onClick={closePlaylistModal}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-content">
            {/* Form tạo playlist mới */}
            <div className="create-playlist-section">
              <button
                className={`btn-create-playlist ${showCreateForm ? 'active' : ''}`}
                onClick={() => {
                  if (!showCreateForm) {
                    setShowCreateForm(true);
                    setModalError('');
                  }
                }}
              >
                <Plus size={20} />
                <span>Tạo playlist mới</span>
              </button>

              {showCreateForm && (
                <div className="create-playlist-form">
                  <input
                    type="text"
                    placeholder="Nhập tên playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoFocus
                    disabled={creatingPlaylist}
                  />
                  {modalError && <div className="error-message">{modalError}</div>}
                  <div className="form-actions">
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewPlaylistName('');
                        setModalError('');
                      }}
                      disabled={creatingPlaylist}
                    >
                      Hủy
                    </button>
                    <button
                      className="btn-create"
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim() || creatingPlaylist}
                    >
                      {creatingPlaylist ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        'Tạo'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Danh sách playlist */}
            <div className="playlists-section">
              <h4>Playlist của bạn</h4>
              {loadingPlaylists ? (
                <div className="loading-playlists">
                  <Loader2 size={24} className="spinner" />
                  <p>Đang tải playlists...</p>
                </div>
              ) : playlists.length > 0 ? (
                <div className="playlists-grid">
                  {playlists.map(playlist => (
                    <div
                      key={playlist.id || playlist.idplaylist}
                      className="playlist-item"
                      onClick={() => handleAddToPlaylist(playlist.id || playlist.idplaylist)}
                    >
                      <div className="playlist-avatar" style={{ backgroundColor: getPlaylistColor(playlist.id || playlist.idplaylist) }}>
                        <ListMusic size={24} />
                      </div>
                      <div className="playlist-info">
                        <h5>{playlist.name || playlist.nameplaylist || 'Playlist không tên'}</h5>
                        <p>{(playlist.songCount || 0)} bài hát</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-playlists">
                  <ListMusic size={48} />
                  <p>Bạn chưa có playlist nào</p>
                  <p className="subtext">Tạo playlist đầu tiên để lưu bài hát yêu thích</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper màu
  const getPlaylistColor = (id) => {
    const colors = [
      '#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', 
      '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'
    ];
    const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
    return colors[index];
  };

  // Play song
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
          <span className="col-listened">Nghe lần cuối</span> {/* Cột listenedAt */}
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
              <span className="col-listened">{song.listenedAt || 'Không có dữ liệu'}</span> {/* Hiển thị listenedAt */}
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
                {/* Nút 3 chấm - thêm onClick để mở modal playlist */}
                <button 
                  className="btn-action"
                  onClick={(e) => openPlaylistModal(songId, e)}
                  disabled={!userId}
                  style={{
                    opacity: !userId ? 0.5 : 1,
                    cursor: !userId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal playlist - copy từ SongList */}
      {renderPlaylistModal()}
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