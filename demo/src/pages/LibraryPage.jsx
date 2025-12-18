// FILE: demo/src/pages/LibraryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Heart, Plus, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './LibraryPage.css';

function LibraryPage() {
  const [playlists, setPlaylists] = useState([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

      // Lấy userId để load favorites (nếu cần)
      let userId = localStorage.getItem('userId');
      if (!userId) {
        try {
          const userRes = await api.get(API_ENDPOINTS.MY_INFO);
          const user = userRes.data.result || userRes.data;
          userId = user.id || user.userId || user.iduser;
          if (userId) localStorage.setItem('userId', userId);
        } catch (err) {
          console.warn('Không lấy được myInfo, vẫn tiếp tục load playlist');
        }
      }

      // Load playlists của user hiện tại (backend tự xử lý từ token)
      const playlistRes = await api.get(API_ENDPOINTS.PLAYLISTS); // GET /playlists
      const playlistData = playlistRes.data.result || playlistRes.data || [];

      // Load số lượng favorites
      let favCount = 0;
      if (userId) {
        try {
          const favRes = await api.get(API_ENDPOINTS.USER_FAVORITES(userId));
          favCount = (favRes.data.result || favRes.data || []).length;
        } catch (err) {
          console.warn('Lỗi load favorites:', err);
        }
      }

      // Random màu cho playlist card
      const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'];
      const enrichedPlaylists = playlistData.map((p, i) => ({
        id: p.idplaylist || p.id,
        name: p.nameplaylist || p.name || 'Playlist không tên',
        songCount: p.songCount || 0, // Backend có thể trả thêm field này, nếu không thì 0
        color: colors[i % colors.length]
      }));

      setPlaylists(enrichedPlaylists);
      setFavoriteCount(favCount);
    } catch (error) {
      console.error('Error loading library data:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        alert('Không thể tải dữ liệu thư viện. Vui lòng thử lại.');
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
        // description: tùy chọn, backend có thể mặc định
      });

      const newPlaylist = response.data.result || response.data;

      alert('Tạo playlist thành công!');
      setShowCreateModal(false);

      // Reload và chuyển đến playlist mới
      await loadLibraryData();
      navigate(`/playlist/${newPlaylist.idplaylist || newPlaylist.id}`);
    } catch (err) {
      console.error('Create playlist error:', err);
      const msg = err.response?.data?.message || 'Không thể tạo playlist (có thể do quyền hoặc lỗi server)';
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
          className="tab active" // Chỉ có 1 tab chính, favorites chuyển hướng
          onClick={() => {}}
        >
          <ListMusic size={20} />
          Playlists
          <span className="tab-count">{playlists.length}</span>
        </button>
        <button
          className="tab"
          onClick={() => navigate('/favorites')}
        >
          <Heart size={20} />
          Yêu thích
          <span className="tab-count">{favoriteCount}</span>
        </button>
      </div>

      <div className="library-content">
        <div className="playlists-section">
          <div className="section-header">
            <h2>Tất cả Playlists</h2>
            <button className="btn-create" onClick={handleCreatePlaylist}>
              <Plus size={18} />
              Tạo mới
            </button>
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