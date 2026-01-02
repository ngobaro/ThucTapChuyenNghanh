// FILE: demo/src/pages/OftenListenedPage.jsx
import { useState, useEffect } from 'react';
import { Clock, Loader2, Shuffle } from 'lucide-react';
import SongCard from '../../components/music/SongCard';
import { fetchOftenSongs } from '../../services/oftenService'; // Import từ service mới
import './OftenListenedPage.css';

function OftenListenedPage() {
  const [oftenSongs, setOftenSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOftenSongs()
      .then(setOftenSongs)
      .catch((error) => {
        console.error('Error loading often songs:', error);
        setOftenSongs([]); // Empty on error, no mock
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="often-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải bài hát thường nghe...</p>
      </div>
    );
  }

  return (
    <div className="often-page">
      <section className="hero-section">
        <h1>🎵 Bài hát bạn thường nghe</h1>
        <p>18 bài ngẫu nhiên từ lịch sử nghe của bạn</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{oftenSongs.length}</strong> bài hát
          </span>
        </div>
      </section>

      {oftenSongs.length > 0 ? (
        <section className="often-songs-section">
          <div className="section-header">
            <h2>📻 Gợi ý ngẫu nhiên</h2>
            <span className="song-count">{oftenSongs.length} bài hát • <Shuffle size={16} /> Ngẫu nhiên</span>
          </div>
          <div className="songs-grid">
            {oftenSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-state">
          <Clock size={64} />
          <h2>Chưa có bài hát nào trong lịch sử</h2>
          <p>Bắt đầu nghe nhạc để xem gợi ý ở đây</p>
        </div>
      )}
    </div>
  );
}

export default OftenListenedPage;