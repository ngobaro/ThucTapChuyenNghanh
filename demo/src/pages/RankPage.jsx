// FILE: demo/src/pages/RankPage.jsx

import { useState, useEffect } from 'react';
import SongCard from '../components/music/SongCard';
import { getAllSongs } from '../services/songService';
import './RankPage.css';

function RankPage() {
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setLoading(true);
      
      // Lấy tất cả bài hát
      const response = await getAllSongs();
      const allSongs = response.result || [];
      
      // Giả lập trending (có thể dựa trên views từ backend)
      const trending = allSongs.slice(0, 8);
      const newReleases = allSongs.slice(0, 6);
      
      setTrendingSongs(trending);
      setNewReleases(newReleases);
    } catch (error) {
      console.error('Error fetching discover data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <p>Top bài hát phổ biến nhất hiện nay</p>
      </div>

      {/* Trending Section */}
      <section className="rank-section">
        <div className="section-header">
          <h2>Trending Now 🔥</h2>
          <button className="btn-view-all">Xem tất cả</button>
        </div>
        <div className="song-grid">
          {trendingSongs.map(song => (
            <SongCard 
              key={song.songId} 
              song={{
                id: song.songId,
                title: song.title,
                artist: 'Unknown Artist',
                coverUrl: song.avatar || '/default-cover.png'
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
              key={song.songId} 
              song={{
                id: song.songId,
                title: song.title,
                artist: 'Unknown Artist',
                coverUrl: song.avatar || '/default-cover.png'
              }} 
            />
          ))}
        </div>
      </section>

    </div>
  );
}

export default RankPage;