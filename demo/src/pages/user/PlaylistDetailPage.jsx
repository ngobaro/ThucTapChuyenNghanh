// FILE: demo/src/pages/PlaylistDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User, Loader2, Trash2 } from 'lucide-react';
import SongList from '../../components/music/SongList';
import { usePlayer } from '../../context/PlayerContext';
import { fetchPlaylistDetails, removeSongFromPlaylist, deletePlaylist } from '../../services/playlistService'; // Import từ service
import './PlaylistDetailPage.css';

function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentSong,
    queue,
    queueIndex,
    nextSong,
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
    if (id) {
      fetchPlaylistDetails(id)
        .then(({ playlist: fetchedPlaylist, songs: fetchedSongs }) => {
          setPlaylist(fetchedPlaylist);
          setSongs(fetchedSongs);
        })
        .catch((err) => {
          console.error('Playlist fetch error:', err);
          setError('Không thể tải playlist. Vui lòng thử lại.');
          setTimeout(() => navigate('/library'), 2000);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, navigate]);

  // Xử lý xóa bài hát khỏi playlist (giữ nguyên logic player)
  const handleRemoveSongFromPlaylist = async (songId) => {
    try {
      await removeSongFromPlaylist(id, songId);
      // Cập nhật local state
      const newSongs = songs.filter(s => s.id !== songId);
      setSongs(newSongs);
      setPlaylist(prev => ({
        ...prev,
        songCount: newSongs.length,
        duration: calculateTotalDuration(newSongs) // Utility từ service nếu cần
      }));

      // Xử lý player queue
      if (currentSong?.id === songId) {
        if (newSongs.length === 0) {
          clearQueue();
        } else {
          const newQueue = queue.filter(s => s.id !== songId);
          const newIndex = queueIndex >= newQueue.length ? 0 : queueIndex;
          setQueue(newQueue);
          setQueueIndex(newIndex);
          if (newQueue.length > 0) {
            playSong(newQueue[newIndex], newQueue, newIndex);
          }
        }
      } else if (queue.some(s => s.id === songId)) {
        const newQueue = queue.filter(s => s.id !== songId);
        const newIndex = queue.findIndex(s => s.id === currentSong?.id);
        setQueue(newQueue);
        if (newIndex >= 0) setQueueIndex(newIndex);
      }
    } catch (err) {
      console.error('Remove song error:', err);
      alert('Có lỗi khi xóa bài hát khỏi playlist');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Bạn có chắc muốn xóa playlist này? Hành động không thể hoàn tác!')) return;

    setDeletingPlaylist(true);
    try {
      await deletePlaylist(playlist.id);
      alert('Đã xóa playlist!');
      navigate('/library');
    } catch (err) {
      console.error('Delete playlist error:', err);
      alert('Có lỗi khi xóa playlist: ' + (err.response?.data?.message || 'Thử lại'));
    } finally {
      setDeletingPlaylist(false);
    }
  };

  if (loading) {
    return (
      <div className="playlist-detail-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải playlist...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="playlist-detail-page not-found">
        <h2>Playlist không tồn tại</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/library')}>Quay lại thư viện</button>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page">
      <div className="playlist-header">
        <div className="playlist-cover-large" style={{ backgroundColor: playlist.color }}>
          <span className="playlist-icon">♫</span>
        </div>
        <div className="playlist-info">
          <div className="playlist-badge">PLAYLIST</div>
          <h1 className="playlist-title">{playlist.name}</h1>
          <div className="playlist-meta">
            <span className="meta-item"><User size={16} />{playlist.creator}</span>
            <span className="meta-item">{playlist.songCount} bài hát</span>
            <span className="meta-item">Tạo ngày {playlist.createdDate}</span>
          </div>
        </div>
      </div>

      <div className="playlist-controls">
        <button
          className="btn-delete-playlist"
          onClick={handleDeletePlaylist}
          disabled={deletingPlaylist}
        >
          {deletingPlaylist ? <Loader2 size={20} className="spinner" /> : <Trash2 size={20} />}
          Xóa playlist
        </button>
      </div>

      <div className="playlist-content">
        <div className="section-header">
          <h2>Danh sách bài hát</h2>
          <span className="song-count">{songs.length} bài</span>
        </div>

        <SongList
          songs={songs}
          title=""
          showGenre={true}
          playlistId={playlist.id}
          onRemoveSong={handleRemoveSongFromPlaylist}
        />
      </div>
    </div>
  );
}

export default PlaylistDetailPage;