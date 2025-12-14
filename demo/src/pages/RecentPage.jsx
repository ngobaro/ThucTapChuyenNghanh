// FILE: demo/src/pages/RecentPage.jsx

import { useState, useEffect } from 'react';
import SongList from '../components/music/SongList';
import './RecentPage.css';

function RecentPage() {
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSongs();
  }, []);

  const fetchRecentSongs = async () => {
    try {
      setLoading(true);
      
      // Lấy từ localStorage hoặc API
      const history = JSON.parse(localStorage.getItem('playHistory') || '[]');
      
      if (history.length > 0) {
        // TODO: Fetch song details từ API dựa trên IDs
        // const response = await api.get('/songs', { params: { ids: history } });
        
        // Dữ liệu mẫu
        const mockSongs = history.map(id => ({
          id,
          title: `Song ${id}`,
          artist: 'Unknown Artist',
          duration: '3:45',
          coverUrl: '/default-cover.png'
        }));
        
        setRecentSongs(mockSongs);
      }
    } catch (error) {
      console.error('Error fetching recent songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('playHistory');
    setRecentSongs([]);
  };

  if (loading) {
    return (
      <div className="recent-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="recent-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Nghe gần đây</h1>
          <p>Xem lại những bài hát bạn đã nghe</p>
        </div>
        {recentSongs.length > 0 && (
          <button className="btn-clear" onClick={clearHistory}>
            Xóa lịch sử
          </button>
        )}
      </div>

      {recentSongs.length > 0 ? (
        <div className="recent-content">
          <SongList songs={recentSongs} />
        </div>
      ) : (
        <div className="no-recent">
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <h3>Chưa có bài hát nào được nghe gần đây</h3>
            <p>Bắt đầu nghe nhạc và chúng sẽ xuất hiện ở đây</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecentPage;