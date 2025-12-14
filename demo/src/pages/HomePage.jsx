// FILE: src/pages/HomePage.jsx
// Thay thế toàn bộ nội dung file này

import { useEffect, useState } from 'react';
import SongCard from '../components/music/SongCard';
import SongList from '../components/music/SongList';
import { getAllSongs } from '../services/songService';
import './HomePage.css';

function HomePage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await getAllSongs();
      console.log('API response:', response);

      // Map data từ backend
      const mappedSongs = (response.result || []).map((song, index) => ({
        id: song.id || index,
        title: song.title || 'Unknown Title',
        artist: song.artist || 'Unknown Artist',
        album: song.album || 'Single',
        duration: song.duration || 0,
        coverUrl: song.avatar || song.coverUrl || '/default-cover.png',
        audioUrl: song.path || song.audioUrl || ''
      }));

      console.log('Mapped songs:', mappedSongs);
      setSongs(mappedSongs);
    } catch (err) {
      console.error('Error loading songs:', err);
      setError('Không thể tải danh sách bài hát');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải bài hát...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button className="btn-retry" onClick={loadSongs}>
          Thử lại
        </button>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="empty-state">
        <p>Chưa có bài hát nào</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>🎵 Chào mừng đến Music Web</h1>
        <p>Khám phá hàng triệu bài hát yêu thích của bạn</p>
      </section>

      {/* Trending Cards - Grid Layout */}
      <section className="section">
        <h2>Trending Now 🔥</h2>
        <div className="song-grid">
          {songs.slice(0, 6).map(song => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      {/* All Songs - Table Layout */}
      <section className="section">
        <h2>Tất cả bài hát</h2>
        <SongList songs={songs} />
      </section>
    </div>
  );
}

export default HomePage;