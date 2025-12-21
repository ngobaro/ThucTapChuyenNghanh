// FILE: demo/src/components/layout/PlayerBar.jsx
import { Heart, MoreVertical, Loader2, Plus, X, ListMusic } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import PlayerControls from '../music/PlayerControls';
import ProgressBar from '../music/ProgressBar';
import VolumeControl from '../music/VolumeControl';
import './PlayerBar.css';

function PlayerBar() {
  const { currentSong, isPlaying } = usePlayer();
  const [favoriteStates, setFavoriteStates] = useState({}); // Cache favorites
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const favoritesLoadedRef = useRef(false);

  // Playlist modal states
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [modalError, setModalError] = useState('');

  // *** THÊM MỚI: Tìm kiếm playlist trong modal ***
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');

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
        console.error('Fetch user profile error in PlayerBar:', err);
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

  // Load favorites once khi có userId
  useEffect(() => {
    if (userId && !favoritesLoadedRef.current) {
      loadFavorites();
    }
  }, [userId]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(userId));
      const favSongs = res.data?.result || [];
      const favMap = {};
      favSongs.forEach(song => {
        favMap[song.songId || song.id] = true;
      });
      setFavoriteStates(favMap);
      favoritesLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading favorites in PlayerBar:', error);
      favoritesLoadedRef.current = true;
    }
  }, [userId]);

  // isFavorited từ cache
  const isFavorited = currentSong ? !!favoriteStates[currentSong.id] : false;

  const toggleFavorite = useCallback(async () => {
    if (!currentSong || !userId) {
      alert('Vui lòng đăng nhập để sử dụng chức năng này');
      return;
    }
   
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, currentSong.id));
      } else {
        await api.post(API_ENDPOINTS.ADD_FAVORITE(userId, currentSong.id), {});
      }
     
      // Update cache
      setFavoriteStates(prev => ({
        ...prev,
        [currentSong.id]: !isFavorited
      }));
    } catch (error) {
      console.error('Error toggling favorite in PlayerBar:', error);
      alert('Có lỗi xảy ra khi cập nhật danh sách yêu thích: ' + (error.response?.data?.message || error.message));
    } finally {
      setFavoriteLoading(false);
    }
  }, [currentSong, userId, isFavorited]);

  // Load playlists
  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;
   
    setLoadingPlaylists(true);
    try {
      const res = await api.get(API_ENDPOINTS.PLAYLISTS); // Backend filter theo token
      setPlaylists(res.data?.result || []);
    } catch (err) {
      console.error('Load playlists error in PlayerBar:', err);
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

  // Mở modal playlist cho currentSong
  const openPlaylistModal = useCallback((e) => {
    e.stopPropagation();
   
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm vào playlist!');
      return;
    }
    if (!currentSong) {
      alert('Không có bài hát nào đang phát!');
      return;
    }
    setShowPlaylistModal(true);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
    setPlaylistSearchQuery(''); // Reset search khi mở modal
    // Reload nếu empty
    if (playlists.length === 0 && !loadingPlaylists) {
      loadUserPlaylists();
    }
  }, [userId, currentSong, playlists.length, loadingPlaylists, loadUserPlaylists]);

  // Đóng modal
  const closePlaylistModal = useCallback(() => {
    setShowPlaylistModal(false);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
    setPlaylistSearchQuery('');
  }, []);

  // Thêm vào playlist
  const handleAddToPlaylist = useCallback(async (playlistId) => {
    if (!currentSong?.id) return;
   
    try {
      await api.post(API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, currentSong.id));
      alert('Đã thêm bài hát vào playlist!');
      closePlaylistModal();
      await loadUserPlaylists();
    } catch (err) {
      console.error('Add to playlist error in PlayerBar:', err);
      alert('Không thể thêm bài hát vào playlist');
    }
  }, [currentSong?.id, loadUserPlaylists, closePlaylistModal]);

  // Tạo playlist mới
  const handleCreatePlaylist = useCallback(async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      setModalError('Vui lòng nhập tên playlist');
      return;
    }
    setCreatingPlaylist(true);
    try {
      const createRes = await api.post(API_ENDPOINTS.PLAYLISTS, {
        name: trimmedName,
        description: ''
      });
     
      const newPlaylist = createRes.data?.result || createRes.data;
      if (newPlaylist?.id || newPlaylist?.idplaylist) {
        await loadUserPlaylists();
        setShowCreateForm(false);
        setNewPlaylistName('');
        setModalError('');
       
        // Auto add currentSong
        await handleAddToPlaylist(newPlaylist.id || newPlaylist.idplaylist);
      }
    } catch (err) {
      console.error('Create playlist error in PlayerBar:', err);
      setModalError(err.response?.data?.message || 'Không thể tạo playlist');
    } finally {
      setCreatingPlaylist(false);
    }
  }, [newPlaylistName, loadUserPlaylists, handleAddToPlaylist]);

  // Filter playlists theo search query
  const filteredPlaylists = playlists.filter(playlist =>
    (playlist.name || playlist.nameplaylist || '')
      .toLowerCase()
      .includes(playlistSearchQuery.toLowerCase())
  );

  // Helper màu
  const getPlaylistColor = (id) => {
    const colors = [
      '#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C',
      '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'
    ];
    const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
    return colors[index];
  };

  // Render modal playlist với ô tìm kiếm
  const renderPlaylistModal = () => {
    if (!showPlaylistModal || !currentSong?.id) return null;

    const modalContent = (
      <div className="modal-overlay" onClick={closePlaylistModal}>
        <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Thêm "{currentSong.title}" vào playlist</h3>
            <button className="modal-close" onClick={closePlaylistModal}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-content">
            {/* Ô tìm kiếm playlist */}
            <div className="playlist-search">
              <input
                type="text"
                placeholder="Tìm playlist..."
                value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                className="search-input"
                autoFocus={false}
              />
            </div>

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
              ) : filteredPlaylists.length > 0 ? (
                <div className="playlists-grid">
                  {filteredPlaylists.map(playlist => (
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
                        <p>{playlist.songCount || 0} bài hát</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-playlists">
                  <ListMusic size={48} />
                  <p>
                    {playlistSearchQuery
                      ? 'Không tìm thấy playlist nào phù hợp'
                      : 'Bạn chưa có playlist nào'}
                  </p>
                  {!playlistSearchQuery && (
                    <p className="subtext">Tạo playlist đầu tiên để lưu bài hát yêu thích</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  };

  if (!currentSong) {
    return (
      <div className="player-bar empty">
        <div className="player-bar-content">
          <p className="empty-message">Select a song to play</p>
        </div>
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="player-bar loading">
        <div className="player-bar-content">
          <Loader2 size={24} className="spinner" />
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
                  aria-label={isFavorited ? "Bỏ thích bài hát" : "Yêu thích bài hát"}
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
                  title="Thêm vào playlist"
                  aria-label="Thêm vào playlist"
                  onClick={openPlaylistModal}
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
      {/* Render modal qua Portal */}
      {renderPlaylistModal()}
    </>
  );
}

export default PlayerBar;