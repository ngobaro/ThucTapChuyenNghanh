import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import api from '../services/api';
import { getMySongs } from '../services/songService';
import { API_ENDPOINTS } from '../utils/constants';
import SongCard from '../components/music/SongCard';
import './ProfilePage.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // 2. Khởi tạo navigate

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [resArt, resArtSong, resAlb, userRes] = await Promise.all([
        api.get(API_ENDPOINTS.ARTISTS),
        api.get(API_ENDPOINTS.ARTIST_SONGS.BASE),
        api.get(API_ENDPOINTS.ALBUMS),
        api.get(API_ENDPOINTS.MY_INFO)
      ]);

      const aMap = {};
      const artistsData = resArt.data.result || resArt.data || [];
      artistsData.forEach(a => aMap[a.idartist || a.id] = a.artistname || a.name);

      const asMap = {};
      const artSongData = resArtSong.data.result || resArtSong.data || [];
      artSongData.forEach(item => {
        if (!asMap[item.idsong]) asMap[item.idsong] = [];
        asMap[item.idsong].push(item.idartist);
      });

      const albMap = {};
      const albumsData = resAlb.data.result || resAlb.data || [];
      albumsData.forEach(al => albMap[al.idalbum || al.id] = al.albumname || al.title);

      setUser(userRes.data.result || userRes.data);

      try {
        const songsRes = await getMySongs();
        const rawSongs = songsRes.data.result || songsRes.data || [];
        const processed = rawSongs.map(song => {
          const sId = song.songId || song.id;
          const artistNames = (asMap[sId] || []).map(id => aMap[id]).join(', ') || song.artist || 'Unknown Artist';
          return {
            ...song,
            id: sId,
            artist: artistNames,
            album: albMap[song.idalbum] || song.album || 'Single',
            coverUrl: song.avatar || '/default-cover.png',
          };
        });
        setMySongs(processed);
      } catch (songErr) {
        console.error("Lỗi getMySongs (400):", songErr);
        setMySongs([]);
      }

    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // 3. Hàm xử lý chuyển hướng sang trang thanh toán
  const handleUpgradeClick = () => {
    navigate('/checkout');
  };

  if (loading) return <div className="profile-status">Đang tải dữ liệu...</div>;
  if (error) return (
    <div className="profile-status">
      <p>{error}</p>
      <button className="retry-btn" onClick={fetchProfileData}>Thử lại</button>
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
            {/* 4. Gán hàm vào sự kiện onClick */}
            <button
              className="btn-plan active"
              onClick={handleUpgradeClick}
            >
              Nâng cấp ngay - 79k
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;