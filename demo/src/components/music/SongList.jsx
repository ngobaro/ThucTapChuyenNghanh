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

  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);

  // ===== PLAY =====
  const handlePlaySong = (song, index) => {
    playQueue(songs, index);
  };

  // ===== FAVORITE =====
  const handleToggleFavorite = async (songId) => {
    if (!userId || favoriteLoading[songId]) return;
    setFavoriteLoading(prev => ({ ...prev, [songId]: true }));
    await toggleFavorite(songId);
    setFavoriteLoading(prev => ({ ...prev, [songId]: false }));
  };

  // ===== PLAYLIST MODAL =====
  const openPlaylistModal = (songId, e) => {
    e.stopPropagation();
    if (!userId) return alert('Vui lòng đăng nhập');
    setCurrentSongId(songId);
    setShowPlaylistModal(true);
  };

  const closePlaylistModal = () => {
    setShowPlaylistModal(false);
    setCurrentSongId(null);
  };

  const loadUserPlaylists = useCallback(async () => {
    if (!userId) return;
    const res = await api.get(API_ENDPOINTS.PLAYLISTS);
    setPlaylists(res.data?.result || res.data || []);
  }, [userId]);

  useEffect(() => {
    loadUserPlaylists();
  }, [loadUserPlaylists]);

  // ===== EMPTY =====
  if (!songs.length) {
    return <div className="song-list-empty">Chưa có bài hát</div>;
  }

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

        {songs.map((song, index) => (
          <SongItem
            key={song.id}                    // ✅ key chuẩn
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

      {/* ===== MODAL ===== */}
      {showPlaylistModal && (
        <div className="modal-overlay" onClick={closePlaylistModal}>
          <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm vào playlist</h3>
              <button onClick={closePlaylistModal}><X /></button>
            </div>

            <div className="playlists-grid">
              {playlists.map(p => (
                <div
                  key={p.id || p.idplaylist}
                  className="playlist-item"
                  onClick={async () => {
                    await api.post(
                      API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(p.id || p.idplaylist, currentSongId)
                    );
                    closePlaylistModal();
                  }}
                >
                  <ListMusic />
                  <span>{p.name || p.nameplaylist}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SongList;
