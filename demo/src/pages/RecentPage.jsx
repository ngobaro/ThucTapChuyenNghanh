// FILE: demo/src/pages/RecentPage.jsx
import { useState, useEffect } from 'react';
import { Clock, Play, MoreVertical } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './RecentPage.css';

function RecentPage() {
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState({});

  useEffect(() => {
    fetchRecentSongs();
  }, []);

  const fetchRecentSongs = async () => {
    try {
      setLoading(true);
      
      // Lấy lịch sử nghe của user hiện tại
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No user ID found for listen history');
        setRecentSongs([]);
        return;
      }
      
      // Lấy listen history
      const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
      console.log('Listen history response:', historyResponse.data);
      
      let historyData = [];
      if (Array.isArray(historyResponse.data)) {
        historyData = historyResponse.data;
      } else if (historyResponse.data.result && Array.isArray(historyResponse.data.result)) {
        historyData = historyResponse.data.result;
      }
      
      // Sắp xếp theo thời gian gần nhất
      historyData.sort((a, b) => new Date(b.listenedAt) - new Date(a.listenedAt));
      
      // Lấy tất cả artists để map
      const artistsResponse = await api.get(API_ENDPOINTS.ARTISTS);
      let artistsData = [];
      
      if (Array.isArray(artistsResponse.data)) {
        artistsData = artistsResponse.data;
      } else if (artistsResponse.data.result && Array.isArray(artistsResponse.data.result)) {
        artistsData = artistsResponse.data.result;
      }
      
      const artistsMap = {};
      artistsData.forEach(artist => {
        const artistId = artist.idartist || artist.id;
        const artistName = artist.artistname || artist.name || 'Unknown Artist';
        artistsMap[artistId] = artistName;
      });
      setArtists(artistsMap);
      
      // Lấy thông tin chi tiết của từng bài hát trong lịch sử
      const recentSongsPromises = historyData.slice(0, 20).map(async (historyItem) => {
        try {
          const songId = historyItem.idsong;
          const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          const song = songResponse.data.result || songResponse.data;
          
          // Lấy artist name
          let artistName = 'Unknown Artist';
          if (song.idartist) {
            artistName = artistsMap[song.idartist] || 'Unknown Artist';
          }
          
          // Format thời gian nghe
          const listenedAt = new Date(historyItem.listenedAt);
          const timeAgo = getTimeAgo(listenedAt);
          
          return {
            id: song.songId || song.id,
            title: song.title || 'Unknown Title',
            artist: artistName,
            album: song.idalbum || 'Single',
            duration: formatDuration(song.duration),
            listenedAt: timeAgo,
            playCount: historyItem.playCount || 1,
            coverColor: getRandomColor()
          };
        } catch (error) {
          console.error(`Error fetching song ${historyItem.idsong}:`, error);
          return null;
        }
      });
      
      const songs = (await Promise.all(recentSongsPromises)).filter(Boolean);
      console.log('Recent songs:', songs);
      setRecentSongs(songs);
      
    } catch (error) {
      console.error('Error fetching recent songs:', error);
      
      // Fallback data
      setRecentSongs([
        { 
          id: 101, 
          title: 'Blinding Lights', 
          artist: 'The Weeknd', 
          album: 'After Hours',
          duration: '3:22',
          listenedAt: 'Hôm nay, 10:30',
          playCount: 15,
          coverColor: '#8B0000'
        },
        { 
          id: 102, 
          title: 'Flowers', 
          artist: 'Miley Cyrus', 
          album: 'Endless Summer Vacation',
          duration: '3:20',
          listenedAt: 'Hôm nay, 09:15',
          playCount: 8,
          coverColor: '#FF69B4'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) {
      return 'Vừa xong';
    } else if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    
    if (typeof duration === 'string') {
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          return `${parts[0]}:${parts[1]}`;
        }
        return duration;
      }
      return duration;
    }
    
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    return '00:00';
  };

  const getRandomColor = () => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePlay = (songId) => {
    console.log('Play song:', songId);
  };

  const clearHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      // TODO: Thêm endpoint xóa lịch sử nếu có
      // await api.delete(API_ENDPOINTS.USER_HISTORY(userId));
      
      // Tạm thời chỉ clear trên client
      setRecentSongs([]);
      
    } catch (error) {
      console.error('Error clearing history:', error);
    }
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
        <div className="header-icon">
          <Clock size={48} />
        </div>
        <div className="header-info">
          <span className="page-type">COLLECTION</span>
          <h1>Nghe gần đây</h1>
          <p>{recentSongs.length} bài hát đã nghe</p>
        </div>
      </div>

      {recentSongs.length > 0 ? (
        <div className="recent-content">
          <div className="recent-controls">
            <button className="btn-play-all" onClick={() => handlePlay('all')}>
              <Play size={20} />
              Phát tất cả
            </button>
            <button className="btn-clear" onClick={clearHistory}>
              Xóa lịch sử
            </button>
          </div>

          <div className="recent-list">
            <div className="list-header">
              <div className="header-col index">#</div>
              <div className="header-col title">Tiêu đề</div>
              <div className="header-col artist">Nghệ sĩ</div>
              <div className="header-col album">Album</div>
              <div className="header-col played">Nghe lần cuối</div>
              <div className="header-col count">Số lần</div>
              <div className="header-col actions"></div>
            </div>
            
            <div className="list-content">
              {recentSongs.map((song, index) => (
                <div key={song.id} className="recent-item">
                  <div className="item-col index">
                    <span className="item-number">{index + 1}</span>
                    <button 
                      className="btn-play-small"
                      onClick={() => handlePlay(song.id)}
                    >
                      <Play size={14} />
                    </button>
                  </div>
                  <div className="item-col title">
                    <div className="song-info">
                      <div 
                        className="song-cover-small"
                        style={{ backgroundColor: song.coverColor }}
                      >
                        <span className="song-icon">♪</span>
                      </div>
                      <div>
                        <h4 className="song-title">{song.title}</h4>
                        <p className="song-artist-mobile">{song.artist}</p>
                      </div>
                    </div>
                  </div>
                  <div className="item-col artist">{song.artist}</div>
                  <div className="item-col album">{song.album}</div>
                  <div className="item-col played">
                    <span className="played-at">
                      <Clock size={12} />
                      {song.listenedAt}
                    </span>
                  </div>
                  <div className="item-col count">{song.playCount} lần</div>
                  <div className="item-col actions">
                    <button className="btn-more">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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