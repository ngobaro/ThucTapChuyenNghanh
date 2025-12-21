// FILE: demo/src/components/music/SongList.jsx
import { Play, Heart, MoreVertical, Loader2, Trash2, X, ListMusic, Plus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../utils/formatTime';
import { useAudioDuration } from '../../hooks/useAudioDuration';
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './SongList.css';

function SongList({ songs, title, showGenre = false, playlistId = null }) {
  const {
    playQueue,
    currentSong,
    userId,
    toggleFavorite: contextToggleFavorite,
    isFavorite: contextIsFavorite
  } = usePlayer();

  // Loading riêng cho từng nút yêu thích (để hiển thị spinner)
  const [favoriteLoading, setFavoriteLoading] = useState({});

  // Playlist modal states
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete song from playlist
  const [deletingSong, setDeletingSong] = useState(null);

  // Load user playlists với songCount (parallel fetch)
  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;
    setLoadingPlaylists(true);
    try {
      const res = await api.get(API_ENDPOINTS.PLAYLISTS);
      let loadedPlaylists = res.data?.result || res.data || [];

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
      console.error('Load playlists error in SongList:', err);
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

  const openPlaylistModal = (songId, e) => {
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
  };

  const closePlaylistModal = () => {
    setShowPlaylistModal(false);
    setCurrentSongId(null);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!currentSongId || !playlistId) {
      alert('Lỗi: ID bài hát hoặc playlist không hợp lệ.');
      closePlaylistModal();
      return;
    }

    try {
      await api.post(API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, currentSongId));
      alert('Đã thêm bài hát vào playlist!');
      closePlaylistModal();
      await loadUserPlaylists();
    } catch (err) {
      console.error('Add to playlist error:', err);
      let msg = err.response?.data?.message || 'Không thể thêm bài hát vào playlist';
      const status = err.response?.status;
      if (status === 400 && msg.includes('already exists')) {
        msg = 'Bài hát đã có trong playlist này!';
      }
      alert(msg);
    }
  };

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
      await loadUserPlaylists();
      setShowCreateForm(false);
      setNewPlaylistName('');
      setModalError('');
      if (currentSongId && (newPlaylist.id || newPlaylist.idplaylist)) {
        await handleAddToPlaylist(newPlaylist.id || newPlaylist.idplaylist);
      }
    } catch (err) {
      console.error('Create playlist error:', err);
      setModalError(err.response?.data?.message || 'Không thể tạo playlist');
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // Toggle favorite - dùng context (đồng bộ toàn app)
  const toggleFavorite = async (songId) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm yêu thích!');
      return;
    }
    if (favoriteLoading[songId]) return;

    setFavoriteLoading(prev => ({ ...prev, [songId]: true }));
    await contextToggleFavorite(songId);
    setFavoriteLoading(prev => ({ ...prev, [songId]: false }));
  };

  const handleDeleteSong = async (songId) => {
    if (!userId || !playlistId) return;
    if (!confirm('Bạn có chắc muốn xóa bài hát này khỏi playlist?')) return;

    setDeletingSong(songId);
    try {
      await api.delete(API_ENDPOINTS.REMOVE_SONG_FROM_PLAYLIST(playlistId, songId));
      alert('Đã xóa bài hát khỏi playlist!');
      window.location.reload(); // Có thể cải thiện bằng cách refetch songs từ parent
    } catch (err) {
      console.error('Delete song error:', err);
      alert('Có lỗi khi xóa bài hát');
    } finally {
      setDeletingSong(null);
    }
  };

  const handlePlaySong = (song, index) => {
    playQueue(songs, index);
  };

  const getPlaylistColor = (id) => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'];
    const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
    return colors[index];
  };

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

            <div className="playlists-section">
              <h4>Playlist của bạn</h4>
              {loadingPlaylists ? (
                <div className="loading-playlists">
                  <Loader2 size={24} className="spinner" />
                  <p>Đang tải playlists...</p>
                </div>
              ) : playlists.length > 0 ? (
                <div className="playlists-grid">
                  {playlists.map((playlist) => (
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
          {showGenre && <span className="col-genre">Thể loại</span>}
          <span className="col-actions"></span>
        </div>

        {songs.map((song, index) => {
          const songId = song.id;
          const isCurrentSong = currentSong?.id === songId;
          const isFavorited = contextIsFavorite(songId);
          const isFavLoading = favoriteLoading[songId];
          const isDeleting = deletingSong === songId;

          const { duration, loading: durationLoading } = useAudioDuration(song.audioUrl);
          const displayDuration = duration > 0 ? duration : parseDuration(song.duration);

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
                {durationLoading ? <Loader2 size={14} className="spinner" /> : formatTime(displayDuration)}
              </span>

              {showGenre && (
                <span className="col-genre" style={{ color: song.genreColor }}>
                  {song.genreName}
                </span>
              )}

              <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                {/* Nút yêu thích - dùng context */}
                <button
                  className={`btn-action ${isFavorited ? 'active' : ''}`}
                  onClick={() => toggleFavorite(songId)}
                  disabled={isFavLoading || !userId}
                >
                  {isFavLoading ? (
                    <Loader2 size={18} className="spinner" />
                  ) : (
                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                  )}
                </button>

                {/* Nút thêm vào playlist */}
                <button
                  className="btn-action"
                  onClick={(e) => openPlaylistModal(songId, e)}
                  disabled={!userId}
                >
                  <MoreVertical size={18} />
                </button>

                {/* Nút xóa khỏi playlist (nếu đang trong playlist detail) */}
                {playlistId && userId && (
                  <button
                    className="btn-action delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSong(songId);
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 size={18} className="spinner" /> : <Trash2 size={18} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal thêm vào playlist */}
      {renderPlaylistModal()}
    </div>
  );
}

const parseDuration = (duration) => {
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string' && duration.includes(':')) {
    const [m, s] = duration.split(':').map(Number);
    return m * 60 + (isNaN(s) ? 0 : s);
  }
  return Number(duration) || 0;
};

export default SongList;