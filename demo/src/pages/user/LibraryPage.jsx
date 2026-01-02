// FILE: demo/src/pages/LibraryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Heart, Plus, X, Loader2, Shuffle } from 'lucide-react';
import SongCard from '../../components/music/SongCard';
import { fetchLibraryData } from '../../services/libraryService'; // Import từ service mới
import './LibraryPage.css';

function LibraryPage() {
  const [playlists, setPlaylists] = useState([]);
  const [oftenSongs, setOftenSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      setError('');

      const { playlists: fetchedPlaylists, oftenSongs: fetchedOften } = await fetchLibraryData();
      setPlaylists(fetchedPlaylists);
      setOftenSongs(fetchedOften);
    } catch (error) {
      console.error('Error loading library data:', error);
      setError('Không thể tải dữ liệu thư viện. Vui lòng thử lại.');
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = () => {
    setNewPlaylistName('');
    setError('');
    setShowCreateModal(true);
  };

  const submitCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên playlist');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post(API_ENDPOINTS.PLAYLISTS, {
        nameplaylist: trimmedName,
      });

      const newPlaylist = response.data.result || response.data;

      alert('Tạo playlist thành công!');
      setShowCreateModal(false);

      // Reload and navigate to new playlist
      await loadLibraryData();
      navigate(`/playlist/${newPlaylist.idplaylist || newPlaylist.id}`);
    } catch (err) {
      console.error('Create playlist error:', err);
      const msg = err.response?.data?.message || 'Không thể tạo playlist';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="library-page loading">
        <div className="spinner"></div>
        <p>Đang tải thư viện...</p>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Thư viện của tôi</h1>
      </div>

      <div className="library-tabs">
        <button
          className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          <ListMusic size={20} />
          Playlists
          <span className="tab-count">{playlists.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'often' ? 'active' : ''}`}
          onClick={() => setActiveTab('often')}
        >
          <Heart size={20} />
          Bài hát của bạn
          <span className="tab-count">{oftenSongs.length}</span>
        </button>
      </div>

      <div className="library-content">
        {activeTab === 'playlists' ? (
          <div className="playlists-section">
            <div className="section-header">
              <h2>Tất cả Playlists</h2>
            </div>

            <div className="playlists-grid">
              {playlists.map(p => (
                <div
                  key={p.id}
                  className="playlist-card"
                  onClick={() => navigate(`/playlist/${p.id}`)}
                >
                  <div className="playlist-cover" style={{ backgroundColor: p.color }}>
                    <span className="playlist-icon">♫</span>
                  </div>
                  <div className="playlist-info">
                    <h3>{p.name}</h3>
                    <p>{p.songCount} bài hát</p>
                  </div>
                </div>
              ))}

              <div className="playlist-card create-new" onClick={handleCreatePlaylist}>
                <div className="playlist-cover new-playlist">
                  <Plus size={32} />
                </div>
                <div className="playlist-info">
                  <h3>Tạo playlist mới</h3>
                  <p>Bắt đầu từ trống</p>
                </div>
              </div>
            </div>

            {playlists.length === 0 && (
              <div className="empty-state">
                <ListMusic size={64} />
                <h2>Chưa có playlist nào</h2>
                <p>Nhấn nút "Tạo mới" để bắt đầu</p>
              </div>
            )}
          </div>
        ) : (
          <div className="often-section">
            <div className="section-header">
              <h2>🎵 Bài hát bạn thường nghe</h2>
            </div>
            {oftenSongs.length > 0 ? (
              <div className="songs-grid">
                {oftenSongs.map((song, index) => (
                  <SongCard 
                    key={song.id} 
                    song={song}
                    songs={oftenSongs}  // Full queue
                    index={index}  // Index for play
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Heart size={64} />
                <h2>Chưa có bài hát nào trong lịch sử</h2>
                <p>Bắt đầu nghe nhạc để xem gợi ý ở đây</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal tạo playlist */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal create-playlist-modal">
            <div className="modal-header">
              <h3>Tạo playlist mới</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)} disabled={creating}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Tên playlist *</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ví dụ: Chill buổi tối, Nhạc tập gym..."
                  autoFocus
                  disabled={creating}
                />
                {error && <div className="error-text">{error}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={submitCreatePlaylist}
                disabled={creating || !newPlaylistName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="spinner-small" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo playlist'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryPage;