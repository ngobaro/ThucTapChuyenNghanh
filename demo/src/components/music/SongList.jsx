// FILE: demo/src/components/music/SongList.jsx

import { Loader2, X, ListMusic, Plus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import SongItem from './SongItem';
import './SongList.css';

function SongList({
  songs = [],
  title,
  showGenre = false,
  playlistId = null,
  onRemoveSong
}) {
  const {
    playQueue,
    currentSong,
    userId,
    toggleFavorite,
    isFavorite
  } = usePlayer();

  /* =======================
     FAVORITE
  ======================== */
  const [favoriteLoading, setFavoriteLoading] = useState({});

  /* =======================
     PLAYLIST MODAL (GIỮ NGUYÊN CSS)
  ======================== */
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [modalError, setModalError] = useState('');

  /* =======================
     PROCESS SONG (FALLBACK)
  ======================== */
  const [processedSongs, setProcessedSongs] = useState([]);

  useEffect(() => {
    setProcessedSongs(
      songs.map(song => ({
        ...song,
        album: song.album || song.artist || song.singer || 'Single'
      }))
    );
  }, [songs]);

  /* =======================
     PLAY
  ======================== */
  const handlePlaySong = (song, index) => {
    playQueue(processedSongs, index);
  };

  /* =======================
     FAVORITE
  ======================== */
  const handleToggleFavorite = async (songId) => {
    if (!userId || favoriteLoading[songId]) return;
    setFavoriteLoading(prev => ({ ...prev, [songId]: true }));
    await toggleFavorite(songId);
    setFavoriteLoading(prev => ({ ...prev, [songId]: false }));
  };

  /* =======================
     LOAD USER PLAYLISTS
     (COPY Y HỆT SongListRecent)
  ======================== */
  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;

    setLoadingPlaylists(true);
    try {
      const res = await api.get(API_ENDPOINTS.PLAYLISTS);
      setPlaylists(res.data?.result || res.data || []);
    } catch {
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadUserPlaylists();
  }, [userId, loadUserPlaylists]);

  /* =======================
     PLAYLIST MODAL HANDLERS
  ======================== */
  const openPlaylistModal = async (songId, e) => {
    e.stopPropagation();
    if (!userId) return alert('Vui lòng đăng nhập');

    setCurrentSongId(songId);
    setShowPlaylistModal(true);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setModalError('');

    if (!playlists.length && !loadingPlaylists) {
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

  /* =======================
     ADD SONG TO PLAYLIST
  ======================== */
  const handleAddToPlaylist = async (playlistId) => {
    if (!currentSongId) return;

    try {
      await api.post(
        API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, currentSongId)
      );
      alert('Đã thêm bài hát vào playlist!');
      closePlaylistModal();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      alert(msg.includes('existed')
        ? 'Bài hát đã có trong playlist!'
        : 'Không thể thêm bài hát');
    }
  };

  /* =======================
     CREATE PLAYLIST
  ======================== */
  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) {
      setModalError('Vui lòng nhập tên playlist');
      return;
    }

    setCreatingPlaylist(true);
    try {
      const res = await api.post(API_ENDPOINTS.PLAYLISTS, {
        nameplaylist: name,
        description: ''
      });

      const newPlaylist = res.data?.result || res.data;

      await loadUserPlaylists();
      await handleAddToPlaylist(newPlaylist.id || newPlaylist.idplaylist);
    } catch {
      setModalError('Không thể tạo playlist');
    } finally {
      setCreatingPlaylist(false);
    }
  };

  /* =======================
     EMPTY
  ======================== */
  if (!processedSongs.length) {
    return <div className="song-list-empty">Chưa có bài hát</div>;
  }

  /* =======================
     RENDER
  ======================== */
  return (
    <div className="song-list-container">
      {title && <h2 className="song-list-title">{title}</h2>}

      <div className="song-list">
        <div className="song-list-header">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Nghệ sĩ</span>
          <span>Album</span>
          <span>Thời lượng</span>
          {showGenre && <span>Thể loại</span>}
          <span></span>
        </div>

        {processedSongs.map((song, index) => (
          <SongItem
            key={song.id}
            song={song}
            index={index}
            isCurrent={currentSong?.id === song.id}
            isFavorited={isFavorite(song.id)}
            isFavLoading={favoriteLoading[song.id]}
            showGenre={showGenre}
            userId={userId}
            playlistId={playlistId}
            onPlay={() => handlePlaySong(song, index)}
            onToggleFavorite={handleToggleFavorite}
            onOpenPlaylistModal={openPlaylistModal}
            onRemoveSong={onRemoveSong}
          />
        ))}
      </div>

      {/* ===== MODAL (GIỮ NGUYÊN CLASS CSS) ===== */}
      {showPlaylistModal && (
        <div className="modal-overlay" onClick={closePlaylistModal}>
          <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm vào playlist</h3>
              <button className="modal-close" onClick={closePlaylistModal}>
                <X />
              </button>
            </div>

            <div className="modal-content">
              <div className="create-playlist-section">
                <button
                  className={`btn-create-playlist ${showCreateForm ? 'active' : ''}`}
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus />
                  <span>Tạo playlist mới</span>
                </button>

                {showCreateForm && (
                  <div className="create-playlist-form">
                    <input
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Nhập tên playlist"
                      disabled={creatingPlaylist}
                    />
                    {modalError && <div className="error-message">{modalError}</div>}
                    <div className="form-actions">
                      <button
                        className="btn-cancel"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Hủy
                      </button>
                      <button
                        className="btn-create"
                        onClick={handleCreatePlaylist}
                        disabled={creatingPlaylist}
                      >
                        {creatingPlaylist ? <Loader2 className="spinner" /> : 'Tạo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="playlists-section">
                <h4>Playlist của bạn</h4>

                {loadingPlaylists ? (
                  <Loader2 className="spinner" />
                ) : (
                  <div className="playlists-grid">
                    {playlists.map(p => (
                      <div
                        key={p.id || p.idplaylist}
                        className="playlist-item"
                        onClick={() =>
                          handleAddToPlaylist(p.id || p.idplaylist)
                        }
                      >
                        <div className="playlist-avatar">
                          <ListMusic />
                        </div>
                        <div className="playlist-info">
                          <h5>{p.name || p.nameplaylist}</h5>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SongList;
