// FILE: demo/src/pages/ProfilePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfileData } from '../../services/profileService'; // Import từ service mới
import SongCard from '../../components/music/SongCard';
import './ProfilePage.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { user: fetchedUser, mySongs: fetchedSongs } = await fetchProfileData();
      setUser(fetchedUser);
      setMySongs(fetchedSongs);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Không thể tải thông tin cá nhân. Vui lòng thử lại.');
      setMySongs([]); // Clear songs on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleUpgradeClick = () => {
    navigate('/checkout');
  };

  if (loading) return <div className="profile-status">Đang tải dữ liệu...</div>;
  if (error) return (
    <div className="profile-status">
      <p>{error}</p>
      <button className="retry-btn" onClick={loadProfileData}>Thử lại</button>
    </div>
  );

  return (
    <div className="profile-container">
      {/* Header Profile */}
      <header className="profile-header">
        <div className="avatar-container">
          <img
            src={user?.avatar || 'https://as2.ftcdn.net/v2/jpg/03/31/69/91/1000_F_331699188_lRpvqxO5QRtwOM05gR50ImaaJgBx68vi.jpg'}
            alt="Avatar"
            className="profile-avatar"
            onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
          />
        </div>
        <div className="profile-user-info">
          <span className="user-type-tag">TÀI KHOẢN MIỄN PHÍ</span>
          <h1>{user?.username || 'Người dùng'}</h1>
          <p className="user-email">{user?.email}</p>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="pricing-section">
        <h2 className="section-title">Gói dịch vụ âm nhạc</h2>
        <div className="pricing-cards">
          <div className="plan-card current-plan">
            <div className="plan-header">
              <h3>Gói Miễn Phí</h3>
              <div className="price">0đ<span>/tháng</span></div>
            </div>
            <ul className="features">
              <li>✓ Nghe nhạc chất lượng 128kbps</li>
              <li>✕ Có quảng cáo âm thanh</li>
              <li>✕ Không thể tải nhạc</li>
            </ul>
            <button className="btn-plan disabled" disabled>Đang sử dụng</button>
          </div>

          <div className="plan-card pro-plan">
            <div className="best-value">PHỔ BIẾN NHẤT</div>
            <div className="plan-header">
              <h3>Gói Premium Pro</h3>
              <div className="price">79.000đ<span>/tháng</span></div>
            </div>
            <ul className="features">
              <li>✓ Âm thanh chất lượng cao 320kbps</li>
              <li>✓ Không bao giờ có quảng cáo</li>
              <li>✓ Tải nhạc ngoại tuyến</li>
              <li>✓ Nghe nhạc cùng bạn bè</li>
            </ul>
            <button
              className="btn-plan active"
              onClick={handleUpgradeClick}
            >
              Nâng cấp ngay - 79k
            </button>
          </div>
        </div>
      </section>

      {/* My Songs Section - Thêm để render mySongs */}
      {mySongs.length > 0 && (
        <section className="my-songs-section">
          <h2>Bài hát của bạn ({mySongs.length})</h2>
          <div className="song-grid">
            {mySongs.map(song => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProfilePage;