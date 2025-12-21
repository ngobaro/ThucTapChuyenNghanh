// FILE: demo/src/components/layout/PlayerBar.jsx
import { Heart, MoreVertical, Loader2, Plus, X, ListMusic } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import PlayerControls from '../music/PlayerControls';
import ProgressBar from '../music/ProgressBar';
import VolumeControl from '../music/VolumeControl';
import './PlayerBar.css';

function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    userId,
    toggleFavorite: contextToggleFavorite,
    isFavorite: contextIsFavorite,
  } = usePlayer();

  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Playlist modal states - giống hệt SongList
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [modalError, setModalError] = useState('');
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');

  const isFavorited = currentSong ? contextIsFavorite(currentSong.id) : false;

  const toggleFavorite = async () => {
    if (!currentSong || !userId) {
      alert('Vui lòng đăng nhập để sử dụng chức năng này');
      return;
    }
    setFavoriteLoading(true);
    await contextToggleFavorite(currentSong.id);
    setFavoriteLoading(false);
  };

  // Load playlists + songCount (giống hệt SongList)
  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;
    setLoadingPlaylists(true);
    try {
      const res = await api.get(API_ENDPOINTS.PLAYLISTS);
      let loadedPlaylists = res.data?.result || res.data || [];

      // Parallel fetch songCount cho từng playlist
      const playlistsWithCount = await Promise.all(
        loadedPlaylists.map(async (p) => {
          try {
            const songsRes = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(p.idplaylist || p.id));
            const songCount = (songsRes.data?.result || songsRes.data || []).length;
            return { ...p, songCount };
          } catch (err) {
            console.warn(`Failed to fetch song count for playlist ${p.idplaylist || p.id}:`, err);
            return { ...p, songCount: 0 };
          }
        })
      );

      setPlaylists(playlistsWithCount);
    } catch (err) {
      console.error('Load playlists error in PlayerBar:', err);
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserPlaylists();
    }
  }, [userId, loadUserPlaylists]);

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
    setPlaylistSearchQuery('');
    if (playlists.length === 0 && !loadingPlaylists) {
      loadUserPlaylists();
    }
  }, [userId, currentSong, playlists.length, loadingPlaylists, loadUserPlaylists]);

  const closePlaylistModal = useCallback(() => {
    setShowPlaylistModal(false);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
    setPlaylistSearchQuery('');
  }, []);

  const handleAddToPlaylist = useCallback(async (playlistId) => {
    if (!currentSong?.id || !playlistId) {
      alert('Lỗi: ID bài hát hoặc playlist không hợp lệ.');
      return;
    }

    try {
      await api.post(API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, currentSong.id));
      alert('Đã thêm bài hát vào playlist!');
      closePlaylistModal();
      await loadUserPlaylists(); // Refresh để cập nhật songCount
    } catch (err) {
      console.error('Add to playlist error:', err);
      let msg = err.response?.data?.message || 'Không thể thêm bài hát vào playlist';
      if (err.response?.status === 400 && msg.includes('already exists')) {
        msg = 'Bài hát đã có trong playlist này!';
      }
      alert(msg);
    }
  }, [currentSong?.id, closePlaylistModal, loadUserPlaylists]);

  const handleCreatePlaylist = useCallback(async () => {
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
      await loadUserPlaylists();
      setShowCreateForm(false);
      setNewPlaylistName('');
      setModalError('');
      if (currentSong?.id && (newPlaylist.id || newPlaylist.idplaylist)) {
        await handleAddToPlaylist(newPlaylist.id || newPlaylist.idplaylist);
      }
    } catch (err) {
      console.error('Create playlist error:', err);
      setModalError(err.response?.data?.message || 'Không thể tạo playlist');
    } finally {
      setCreatingPlaylist(false);
    }
  }, [newPlaylistName, currentSong?.id, loadUserPlaylists, handleAddToPlaylist]);

  // Tìm kiếm playlist
  const filteredPlaylists = playlists.filter(p =>
    (p.name || p.nameplaylist || '')
      .toLowerCase()
      .includes(playlistSearchQuery.toLowerCase())
  );

  const getPlaylistColor = (id) => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'];
    const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
    return colors[index];
  };

  const renderPlaylistModal = () => {
    if (!showPlaylistModal || !currentSong) return null;

    return createPortal(
      <div className="modal-overlay" onClick={closePlaylistModal}>
        <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Thêm vào playlist</h3>
            <button className="modal-close" onClick={closePlaylistModal}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-content">
                       <div className="create-playlist-section">
              <button
                className={`btn-create-playlist ${showCreateForm ? 'active' : ''}`}
                onClick={() => {
                  setShowCreateForm(true);
                  setModalError('');
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
                      {creatingPlaylist ? <Loader2 size={16} className="spinner" /> : 'Tạo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Danh sách playlist - có songCount */}
            <div className="playlists-section">
              <h4>Playlist của bạn</h4>
              {loadingPlaylists ? (
                <div className="loading-playlists">
                  <Loader2 size={24} className="spinner" />
                  <p>Đang tải playlists...</p>
                </div>
              ) : filteredPlaylists.length > 0 ? (
                <div className="playlists-grid">
                  {filteredPlaylists.map((playlist) => (
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
                  <p className="subtext">Tạo playlist đầu tiên để lưu bài hát yêu thích</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (!currentSong) {
    return (
      <div className="player-bar empty">
        <div className="player-bar-content">
          <p className="empty-message">Chọn một bài hát để phát</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`player-bar ${isPlaying ? 'playing' : ''}`}>
        <div className="player-bar-content">
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
              <div className="song-actions">
                <button
                  className={`btn-action ${isFavorited ? 'active' : ''}`}
                  onClick={toggleFavorite}
                  disabled={favoriteLoading || !userId}
                >
                  {favoriteLoading ? (
                    <Loader2 size={18} className="spinner" />
                  ) : (
                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                  )}
                </button>
                <button
                  className="btn-action"
                  onClick={openPlaylistModal}
                  disabled={!userId}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="player-center">
            <PlayerControls />
            <ProgressBar />
          </div>

          <div className="player-right">
            <VolumeControl />
          </div>
        </div>
      </div>

      {renderPlaylistModal()}
    </>
  );
}

export default PlayerBar;