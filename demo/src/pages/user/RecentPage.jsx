// FILE: demo/src/pages/RecentPage.jsx
// Updated: Switch to list view using SongListRecent for better table-like display.
// Removed SongCard grid, now uses SongListRecent for full list with listenedAt column.
// Fixed: Added proper multi-artist mapping using artist-songs relationship, consistent with HomePage.

import { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import SongListRecent from '../../components/music/SongListRecent'; // Import SongListRecent for list view
import './RecentPage.css';

function RecentPage() {
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null); // Handle userId fetch

  useEffect(() => {
    fetchUserAndRecent();
  }, []);

  // Lấy tất cả artists một lần để tránh multiple requests (shared with HomePage)
  const loadArtists = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTISTS);
      console.log('Artists response:', response.data);

      const artistsMap = {};
      let artistsData = [];

      if (Array.isArray(response.data)) {
        artistsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        artistsData = response.data.result;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        artistsData = response.data.data;
      }

      artistsData.forEach(artist => {
        const artistId = artist.idartist || artist.id;
        const artistName = artist.artistname || artist.name || 'Unknown Artist';
        artistsMap[artistId] = artistName;
      });

      console.log('Artists map:', artistsMap);
      return artistsMap;
    } catch (err) {
      console.warn('Error loading artists:', err);
      return {};
    }
  };

  // Lấy artist-song relationships (shared with HomePage)
  const loadArtistSongs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      console.log('Artist songs response:', response.data);

      const artistSongMap = {};
      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        data = response.data.result;
      }

      data.forEach(item => {
        const songId = item.idsong;
        const artistId = item.idartist;

        if (songId && artistId) {
          if (!artistSongMap[songId]) {
            artistSongMap[songId] = [];
          }
          artistSongMap[songId].push(artistId);
        }
      });

      console.log('Artist song map:', artistSongMap);
      return artistSongMap;
    } catch (err) {
      console.warn('Error loading artist songs:', err);
      return {};
    }
  };

  const fetchUserAndRecent = async () => {
    try {
      setLoading(true);

      // Fetch userId nếu chưa có (từ /users/myInfo)
      let currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        try {
          const userRes = await api.get(API_ENDPOINTS.MY_INFO);
          console.log('User info response:', userRes.data);
          
          const userData = userRes.data?.result || userRes.data;
          console.log('User data:', userData);
          
          currentUserId = userData?.id || userData?.userId || userData?.id_user;
          
          if (currentUserId) {
            console.log('Found userId:', currentUserId);
            localStorage.setItem('userId', currentUserId.toString());
            setUserId(Number(currentUserId));
          } else {
            console.warn('No userId found in myInfo response:', userData);
            return;
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
          if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
          }
          return;
        }
      } else {
        console.log('Using cached userId:', currentUserId);
        setUserId(Number(currentUserId));
      }

      // Lấy lịch sử nghe của user hiện tại
      console.log('=== DEBUG: Fetching user history ===');
      console.log('API Endpoint:', API_ENDPOINTS.USER_HISTORY(currentUserId));
      
      const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(currentUserId));
      
      console.log('=== DEBUG: History API Response ===');
      console.log('Full response:', historyResponse);
      console.log('Response status:', historyResponse.status);
      console.log('Response data:', historyResponse.data);
      console.log('Response data type:', typeof historyResponse.data);

      let historyData = [];
      
      // Xử lý nhiều cấu trúc response khác nhau
      if (Array.isArray(historyResponse.data)) {
        historyData = historyResponse.data;
        console.log('History data is direct array');
      } else if (historyResponse.data?.result && Array.isArray(historyResponse.data.result)) {
        historyData = historyResponse.data.result;
        console.log('History data is in result field');
      } else if (historyResponse.data?.data && Array.isArray(historyResponse.data.data)) {
        historyData = historyResponse.data.data;
        console.log('History data is in data field');
      } else if (historyResponse.data?.history && Array.isArray(historyResponse.data.history)) {
        historyData = historyResponse.data.history;
        console.log('History data is in history field');
      } else {
        console.warn('Unknown history response structure:', historyResponse.data);
      }

      console.log('History data length:', historyData.length);
      
      if (historyData.length > 0) {
        console.log('=== DEBUG: First history item structure ===');
        console.log('First item:', historyData[0]);
        console.log('First item keys:', Object.keys(historyData[0]));
        
        // Kiểm tra tất cả các trường có thể có
        const sampleItem = historyData[0];
        console.log('Possible song ID fields:');
        console.log('  - idsong:', sampleItem.idsong);
        console.log('  - songId:', sampleItem.songId);
        console.log('  - id_song:', sampleItem.id_song);
        console.log('  - diêten (from DB):', sampleItem.diêten);
        console.log('  - dòng (from DB):', sampleItem.dòng);
        console.log('  - song_id:', sampleItem.song_id);
        console.log('  - id:', sampleItem.id);
        
        console.log('Possible date fields:');
        console.log('  - listen_date:', sampleItem.listen_date);
        console.log('  - listenedAt:', sampleItem.listenedAt);
        console.log('  - listenDate:', sampleItem.listenDate);
        console.log('  - listen_time:', sampleItem.listen_time);
        console.log('  - date:', sampleItem.date);
        console.log('  - created_at:', sampleItem.created_at);
      } else {
        console.log('No history data found');
      }

      // Sắp xếp theo thời gian gần nhất (top 20)
      // Thử tất cả các trường date có thể có
      historyData.sort((a, b) => {
        const getDate = (item) => {
          // Thử các trường date khác nhau theo thứ tự ưu tiên
          return item.listen_date || 
                 item.listenedAt || 
                 item.listenDate || 
                 item.listen_time || 
                 item.date || 
                 item.created_at;
        };
        
        const dateA = getDate(a);
        const dateB = getDate(b);
        
        if (!dateA || !dateB) {
          console.warn('Missing date in history item:', { a, b });
          return 0;
        }
        
        return new Date(dateB) - new Date(dateA);
      });
      
      const recentHistory = historyData.slice(0, 20);
      console.log('Recent history (first 20):', recentHistory);

      // Load artists và artist-songs parallel
      const [artistsMap, artistSongMap] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);

      // Fetch song details cho recent history (parallel)
      const recentSongsPromises = recentHistory.map(async (historyItem, index) => {
        try {
          console.log(`\n=== Processing history item ${index + 1} ===`);
          console.log('Item data:', historyItem);
          
          // Xác định songId từ nhiều trường có thể có
          const songId = historyItem.idsong || 
                        historyItem.songId || 
                        historyItem.id_song || 
                        historyItem.diêten ||  // từ database
                        historyItem.song_id || 
                        historyItem.id; // fallback
          
          if (!songId) {
            console.error('No songId found in history item:', historyItem);
            return null;
          }
          
          console.log(`Found songId: ${songId} (type: ${typeof songId})`);
          
          // Fetch thông tin bài hát
          console.log(`Fetching song ${songId} from API...`);
          const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          console.log(`Song ${songId} response:`, songResponse.data);
          
          const song = songResponse.data.result || songResponse.data;
          
          if (!song) {
            console.error(`Song ${songId} not found or empty response`);
            return null;
          }
          
          console.log(`Song ${songId} data:`, song);

          // Map artists using relationship (consistent with HomePage)
          const artistIds = artistSongMap[songId] || [];
          console.log(`Artist IDs for song ${songId}:`, artistIds);
          
          const artistNames = artistIds
            .map(id => artistsMap[id] || 'Unknown Artist')
            .filter(name => name)
            .join(', ');

          const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';
          console.log(`Final artist name for song ${songId}:`, artistName);

          // Lấy thời gian nghe
          const getListenDate = (item) => {
            // Thử tất cả các trường có thể có
            return item.listen_date || 
                   item.listenedAt || 
                   item.listenDate || 
                   item.listen_time || 
                   item.date || 
                   item.created_at ||
                   item.time;
          };
          
          const listenDateField = getListenDate(historyItem);
          
          if (!listenDateField) {
            console.warn(`No listen date found for song ${songId}`, historyItem);
            return null;
          }
          
          console.log(`Listen date field for song ${songId}:`, listenDateField);
          
          const listenedAt = new Date(listenDateField);
          
          if (isNaN(listenedAt.getTime())) {
            console.warn(`Invalid date for song ${songId}:`, listenDateField);
            return null;
          }
          
          const timeAgo = getTimeAgo(listenedAt);
          console.log(`Formatted time ago for song ${songId}:`, timeAgo);

          // Lấy playCount từ các trường có thể có
          const playCount = historyItem.playCount || 
                          historyItem.play_count || 
                          historyItem.count || 
                          1;

          return {
            id: song.songId || song.id || songId,
            title: song.title || song.name || 'Unknown Title',
            artist: artistName,
            album: song.idalbum ? `Album ${song.idalbum}` : 
                  song.album || song.albumname || 'Single',
            duration: song.duration || 0,
            coverUrl: song.avatar || song.cover || song.image || '/default-cover.png',
            audioUrl: song.path || song.url || song.audio_url || '',
            listenedAt: timeAgo,
            rawListenDate: listenedAt, // Giữ nguyên để sort nếu cần
            playCount: playCount,
            views: song.views || song.listens || 0,
            releaseDate: song.releasedate || song.release_date,
            genreId: song.genreId || song.idgenre || song.genre_id,
          };
        } catch (error) {
          console.error(`Error fetching song from history item ${index}:`, error);
          console.error('History item that caused error:', historyItem);
          return null;
        }
      });

      const songs = (await Promise.all(recentSongsPromises)).filter(Boolean);
      console.log('\n=== FINAL: Recent songs ===');
      console.log('Total songs:', songs.length);
      console.log('Songs data:', songs);
      
      // Sort lại theo thời gian nghe gần nhất (phòng trường hợp fetch song mất thời gian khác nhau)
      songs.sort((a, b) => b.rawListenDate - a.rawListenDate);
      
      setRecentSongs(songs);

    } catch (error) {
      console.error('Error fetching recent songs:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Fallback data chỉ khi không phải lỗi auth
      if (error.response?.status !== 401) {
        console.log('Using fallback data');
        setRecentSongs([
          {
            id: 101,
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            album: 'After Hours',
            duration: 202,
            coverUrl: '/default-cover.png',
            audioUrl: '',
            listenedAt: 'Hôm nay, 10:30',
            rawListenDate: new Date(),
            playCount: 15,
            views: 0,
            releaseDate: null,
            genreId: 1,
          },
          {
            id: 102,
            title: 'Flowers',
            artist: 'Miley Cyrus',
            album: 'Endless Summer Vacation',
            duration: 200,
            coverUrl: '/default-cover.png',
            audioUrl: '',
            listenedAt: 'Hôm nay, 09:15',
            rawListenDate: new Date(Date.now() - 45 * 60 * 1000), // 45 phút trước
            playCount: 8,
            views: 0,
            releaseDate: null,
            genreId: 1,
          },
        ]);
      }
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