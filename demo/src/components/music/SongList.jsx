// FILE: demo/src/components/music/SongList.jsx
// Fixed: In loadUserPlaylists, after fetching playlists, parallel fetch songCount for each playlist (similar to LibraryPage).
// Assume API_ENDPOINTS.PLAYLIST_SONGS(id) returns songs array, length = songCount. Set playlist.songCount.
// If backend already returns songCount, this enhances/overrides. Handles error per playlist.

import { Play, Heart, MoreVertical, Loader2, Trash2, X, ListMusic, Plus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../utils/formatTime';
import { useAudioDuration } from '../../hooks/useAudioDuration';
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './SongList.css';

function SongList({ songs, title, showGenre = false, playlistId = null }) {
  const { playQueue, currentSong } = usePlayer();
  const [favoriteStates, setFavoriteStates] = useState({});
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [userId, setUserId] = useState(null);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Playlist modal states (for add song)
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete states
  const [deletingSong, setDeletingSong] = useState(null); // { songId, playlistId }

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
        console.error('Fetch user profile error in SongList:', err);
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
      console.error('Load favorites error in SongList:', err);
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
      console.error('Toggle favorite error in SongList:', err);
      alert('Có lỗi khi cập nhật yêu thích');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [songId]: false }));
    }
  };

  // Delete song from playlist
  const handleDeleteSong = async (songId) => {
    if (!userId || !playlistId) {
      alert('Vui lòng đăng nhập và chọn playlist hợp lệ!');
      return;
    }
    if (deletingSong?.songId === songId) return;
    if (!confirm('Bạn có chắc muốn xóa bài hát này khỏi playlist?')) return;

    setDeletingSong({ songId, playlistId });
    try {
      await api.delete(API_ENDPOINTS.REMOVE_SONG_FROM_PLAYLIST(playlistId, songId));
      alert('Đã xóa bài hát khỏi playlist!');
      // Refresh songs (re-fetch or filter local if possible)
      window.location.reload(); // Simple refresh, or refetch in parent
    } catch (err) {
      console.error('Delete song error:', err);
      alert('Có lỗi khi xóa bài hát: ' + (err.response?.data?.message || 'Thử lại'));
    } finally {
      setDeletingSong(null);
    }
  };

  // Load playlists for add modal with songCount
  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;
    setLoadingPlaylists(true);
    try {
      const res = await api.get(API_ENDPOINTS.PLAYLISTS);
      let loadedPlaylists = res.data?.result || res.data || [];
      console.log('Loaded playlists:', loadedPlaylists); // Debug: Check if songCount in response

      // Fetch songCount for each playlist (parallel)
      const playlistsWithCount = await Promise.all(
        loadedPlaylists.map(async (p) => {
          try {
            const songsRes = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(p.idplaylist || p.id));
            const songCount = (songsRes.data.result || songsRes.data || []).length;
            return { ...p, songCount }; // Add/override songCount
          } catch (err) {
            console.warn(`Failed to fetch song count for playlist ${p.id}:`, err);
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

  const openPlaylistModal = async (songId, e) => {
    e.stopPropagation();
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm vào playlist!');
      return;
    }
    console.log('Opening modal for songId:', songId); // Debug setCurrentSongId
    setCurrentSongId(songId);
    setShowPlaylistModal(true);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
    if (playlists.length === 0 && !loadingPlaylists) {
      await loadUserPlaylists();
    }
  };

  const closePlaylistModal = () => {
    setShowPlaylistModal(false);
    setCurrentSongId(null);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!currentSongId || currentSongId === 'undefined' || !playlistId) {
      console.error('Invalid songId or playlistId:', { currentSongId, playlistId });
      alert('Lỗi: ID bài hát hoặc playlist không hợp lệ. Thử lại.');
      closePlaylistModal();
      return;
    }
    console.log(`Adding song ${currentSongId} to playlist ${playlistId}`); // Debug
    try {
      // Matches backend: POST /playlists/{playlistId}/songs/{songId} (path-based, no body)
      await api.post(API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, currentSongId));
      alert('Đã thêm bài hát vào playlist!');
      closePlaylistModal();
      await loadUserPlaylists();
      // Optional: Refresh current page if in playlist detail
      if (playlistId) {
        window.location.reload(); // Refresh to show updated songs
      }
    } catch (err) {
      console.error('Add to playlist error in SongList:', err); // Debug
      console.error('Full error response:', err.response?.data); // Enhanced log for 400/403 details
      let msg = err.response?.data?.message || 'Không thể thêm bài hát vào playlist';
      const status = err.response?.status;
      if (status === 400) {
        if (msg.includes('not found') || msg.includes('không tồn tại')) {
          msg = 'Playlist hoặc bài hát không tồn tại.';
        } else if (msg.includes('already exists') || msg.includes('đã có')) {
          msg = 'Bài hát đã có trong playlist này!';
        } else if (msg.includes('authorized') || msg.includes('quyền')) {
          msg = 'Bạn không có quyền thêm vào playlist này.';
        }
      } else if (status === 403) {
        msg = 'Không có quyền truy cập playlist này.';
      } else if (status === 404) {
        msg = 'Playlist không tồn tại.';
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
      console.log('Created playlist:', newPlaylist); // Debug
      if (newPlaylist?.id || newPlaylist?.idplaylist) {
        await loadUserPlaylists();
        setShowCreateForm(false);
        setNewPlaylistName('');
        setModalError('');
        // Ensure currentSongId still set before adding
        const tempSongId = currentSongId;
        if (tempSongId) {
          await handleAddToPlaylist(newPlaylist.id || newPlaylist.idplaylist);
        } else {
          console.error('currentSongId lost after create:', currentSongId);
          alert('Lỗi khi thêm vào playlist mới. Thử lại.');
        }
      }
    } catch (err) {
      console.error('Create playlist error in SongList:', err);
      setModalError(err.response?.data?.message || 'Không thể tạo playlist');
    } finally {
      setCreatingPlaylist(false);
    }
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
          <span className="col-duration">Thời lượng</span>
          {showGenre && <span className="col-genre">Thể loại</span>}
          <span className="col-actions"></span>
        </div>
        {songs.map((song, index) => {
          const songId = song.id;
          const isCurrentSong = currentSong?.id === songId;
          const isFavorited = !!favoriteStates[songId];
          const isLoading = favoriteLoading[songId];
          const isDeleting = deletingSong?.songId === songId;
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
              <span className="col-duration">
                {durationLoading ? <Loader2 size={14} className="spinner" /> : formatTime(displayDuration)}
              </span>
              {showGenre && (
                <span className="col-genre" style={{ color: song.genreColor }}>
                  {song.genreName}
                </span>
              )}
              <div
                className="col-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`btn-action ${isFavorited ? 'active' : ''} ${!userId ? 'disabled' : ''}`}
                  onClick={() => toggleFavorite(songId)}
                  disabled={isLoading}
                  style={{
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : (!userId ? 'default' : 'pointer')
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
                {playlistId && userId && (
                  <button 
                    className="btn-action delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSong(songId);
                    }}
                    disabled={isDeleting}
                    style={{
                      opacity: isDeleting ? 0.5 : 1,
                      cursor: isDeleting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isDeleting ? (
                      <Loader2 size={18} className="spinner" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal playlist - add song */}
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

export default SongList;  