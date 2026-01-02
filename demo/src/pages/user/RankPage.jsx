// FILE: demo/src/pages/RankPage.jsx
import { useState, useEffect } from 'react';
import SongCard from '../../components/music/SongCard';
import { fetchRankData } from '../../services/rankService'; // Import từ service mới
import './RankPage.css';

function RankPage() {
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankData()
      .then(({ trendingSongs: trending, newReleases: releases }) => {
        setTrendingSongs(trending);
        setNewReleases(releases);
      })
      .catch((error) => {
        console.error('Error loading rank data:', error);
        setTrendingSongs([]);
        setNewReleases([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rank-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="rank-page">
      <div className="page-header">
        <h1>Bảng xếp hạng</h1>
      </div>

      {/* Trending Section */}
      <section className="rank-section">
        <div className="section-header">
          <h2>Trending Now 🔥</h2>
        </div>
        <div className="song-grid">
          {trendingSongs.map((song, index) => (
            <SongCard
              key={song.id}
              song={{
                id: song.id,
                title: song.title,
                artist: song.artist,
                coverUrl: song.coverUrl,
                color: song.color,
                rank: index + 1, // Thêm rank cho card
                views: song.views // Thêm views cho card
              }}
            />
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section className="rank-section">
        <div className="section-header">
          <h2>Mới phát hành ✨</h2>
        </div>
        <div className="song-grid">
          {newReleases.map(song => (
            <SongCard
              key={song.id}
              song={{
                id: song.id,
                title: song.title,
                artist: song.artist,
                coverUrl: song.coverUrl,
                color: song.color,
                isNew: true // Đánh dấu là new release
              }}
            />
          ))}
        </div>
      </section>

      {trendingSongs.length === 0 && newReleases.length === 0 && (
        <div className="empty-state">
          <p>Chưa có dữ liệu bảng xếp hạng</p>
        </div>
      )}
    </div>
  );
}

export default RankPage;