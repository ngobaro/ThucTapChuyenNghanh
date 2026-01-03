import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { fetchRecentSongs } from '../../services/recentService';
import SongListRecent from '../../components/music/SongListRecent';
import { usePlayer } from '../../context/PlayerContext';
import './RecentPage.css';

function RecentPage() {
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentSong } = usePlayer();

  // Hàm load recent songs với debounce
  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const songs = await fetchRecentSongs();
      // FIX: Sử dụng uniqueKey cho React key nếu có
      const songsWithUniqueKeys = songs.map(song => ({
        ...song,
        reactKey: song.uniqueKey || `${song.id}_${song.rawListenDate?.getTime()}`
      }));
      setRecentSongs(songsWithUniqueKeys);
    } catch (error) {
      console.error('Error loading recent songs:', error);
      setRecentSongs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lần đầu
  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Cập nhật khi có bài hát mới phát
  useEffect(() => {
    if (currentSong) {
      const timer = setTimeout(() => {
        loadRecent();
      }, 1000); // Debounce 1 giây
      
      return () => clearTimeout(timer);
    }
  }, [currentSong, loadRecent]);

  if (loading) {
    return (
      <div className="recent-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải lịch sử nghe...</p>
      </div>
    );
  }

  return (
    <div className="recent-page">
      <section className="hero-section">
        <h1>⏰ Nghe gần đây</h1>
        <p>Những bài hát bạn đã nghe gần đây</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{recentSongs.length}</strong> bài hát
          </span>
        </div>
      </section>

      {recentSongs.length > 0 ? (
        <section className="recent-songs-section">
          <div className="section-header">
            <h2>📋 Lịch sử nghe</h2>
            <span className="song-count">{recentSongs.length} bài hát</span>
          </div>
          {/* Truyền songs với unique keys */}
          <SongListRecent songs={recentSongs} title="" />
        </section>
      ) : (
        <div className="empty-state">
          <Clock size={64} />
          <h2>Chưa có bài hát nào được nghe gần đây</h2>
          <p>Bắt đầu nghe nhạc và chúng sẽ xuất hiện ở đây</p>
        </div>
      )}
    </div>
  );
}

export default RecentPage;