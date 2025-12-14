// FILE: demo/src/pages/DiscoverPage.jsx

import { useState, useEffect } from 'react';
import SongCard from '../components/music/SongCard';
import { getAllSongs } from '../services/songService';
import './DiscoverPage.css';

function DiscoverPage() {
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
      <div className="discover-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="discover-page">
      <div className="page-header">
        <h1>Khám phá</h1>
        <p>Phát hiện âm nhạc mới và xu hướng</p>
      </div>

      {/* Trending Section */}
      <section className="discover-section">
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
                artist: 'Unknown Artist', // Cần fetch artist
                coverUrl: song.avatar || '/default-cover.png'
              }} 
            />
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section className="discover-section">
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

      {/* Moods & Genres */}
      <section className="discover-section">
        <div className="section-header">
          <h2>Tâm trạng & Thể loại</h2>
        </div>
        <div className="moods-grid">
          {[
            { name: 'Chill', color: '#4ECDC4', icon: '☕' },
            { name: 'Workout', color: '#FF6B6B', icon: '💪' },
            { name: 'Focus', color: '#118AB2', icon: '🎯' },
            { name: 'Party', color: '#9D4EDD', icon: '🎉' },
            { name: 'Sad', color: '#06D6A0', icon: '☔' },
            { name: 'Happy', color: '#FFD166', icon: '😊' },
          ].map(mood => (
            <div 
              key={mood.name}
              className="mood-card"
              style={{ backgroundColor: `${mood.color}20`, borderColor: mood.color }}
            >
              <span className="mood-icon">{mood.icon}</span>
              <h3>{mood.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DiscoverPage;