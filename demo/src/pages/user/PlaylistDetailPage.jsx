// FILE: demo/src/pages/PlaylistDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User, Loader2, Trash2 } from 'lucide-react';
import SongList from '../../components/music/SongList';
import { usePlayer } from '../../context/PlayerContext';

import {
  fetchPlaylistDetails,
  removeSongFromPlaylist,
  deletePlaylist,
  calculateTotalDuration   // ✅ FIX: thêm import này
} from '../../services/playlistService';

import './PlaylistDetailPage.css';

function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentSong,
    queue,
    queueIndex,
    playSong,
    clearQueue,
    setQueue,
    setQueueIndex
  } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetchPlaylistDetails(id)
      .then(({ playlist, songs }) => {
        setPlaylist(playlist);
        setSongs(songs);
      })
      .catch(() => {
        setError('Không thể tải playlist.');
        setTimeout(() => navigate('/library'), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleRemoveSongFromPlaylist = async (songId) => {
    await removeSongFromPlaylist(id, songId);

    const newSongs = songs.filter(s => s.id !== songId);
    setSongs(newSongs);

    setPlaylist(prev => ({
      ...prev,
      songCount: newSongs.length,
      duration: calculateTotalDuration(newSongs)
    }));

    if (currentSong?.id === songId) {
      if (newSongs.length === 0) {
        clearQueue();
        return;
      }

      const newQueue = queue.filter(s => s.id !== songId);
      const newIndex = Math.min(queueIndex, newQueue.length - 1);
      setQueue(newQueue);
      setQueueIndex(newIndex);
      playSong(newQueue[newIndex], newQueue, newIndex);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Bạn có chắc muốn xóa playlist này?')) return;

    setDeletingPlaylist(true);
    await deletePlaylist(playlist.id);
    navigate('/library');
  };

  if (loading) {
    return (
      <div className="playlist-detail-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải playlist...</p>
      </div>
    );
  }

  if (!playlist || error) {
    return (
      <div className="playlist-detail-page not-found">
        <h2>Playlist không tồn tại</h2>
        <button onClick={() => navigate('/library')}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page">
      <div className="playlist-header">
        <div className="playlist-cover-large" style={{ backgroundColor: playlist.color }}>
          ♫
        </div>
        <div className="playlist-info">
          <div className="playlist-badge">PLAYLIST</div>
          <h1>{playlist.name}</h1>
          <div className="playlist-meta">
            <span><User size={16} /> {playlist.creator}</span>
            <span>{playlist.songCount} bài hát</span>
            <span>{playlist.createdDate}</span>
          </div>
        </div>
      </div>

      <button
        className="btn-delete-playlist"
        onClick={handleDeletePlaylist}
        disabled={deletingPlaylist}
      >
        {deletingPlaylist ? <Loader2 size={18} /> : <Trash2 size={18} />}
        Xóa playlist
      </button>

      <SongList
        songs={songs}
        playlistId={playlist.id}
        onRemoveSong={handleRemoveSongFromPlaylist}
        showGenre
      />
    </div>
  );
}

export default PlaylistDetailPage;
