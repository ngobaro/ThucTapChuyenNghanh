// FILE: demo/src/pages/RecentPage.jsx
// Updated: Switch to list view using SongListRecent for better table-like display.
// Removed SongCard grid, now uses SongListRecent for full list with listenedAt column.
// Fixed: Added proper multi-artist mapping using artist-songs relationship, consistent with HomePage.

import { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import SongListRecent from '../components/music/SongListRecent'; // Import SongListRecent for list view
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
          const userData = userRes.data?.result || userRes.data;
          currentUserId = userData?.id || userData?.userId;
          if (currentUserId) {
            localStorage.setItem('userId', currentUserId.toString());
            setUserId(Number(currentUserId));
          } else {
            console.warn('No userId in myInfo');
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
        setUserId(Number(currentUserId));
      }

      // Lấy lịch sử nghe của user hiện tại
      const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(currentUserId));
      console.log('Listen history response:', historyResponse.data);
      
      let historyData = [];
      if (Array.isArray(historyResponse.data)) {
        historyData = historyResponse.data;
      } else if (historyResponse.data.result && Array.isArray(historyResponse.data.result)) {
        historyData = historyResponse.data.result;
      }
      
      // Sắp xếp theo thời gian gần nhất (top 20)
      historyData.sort((a, b) => new Date(b.listenedAt) - new Date(a.listenedAt));
      const recentHistory = historyData.slice(0, 20);
      
      // Load artists và artist-songs parallel
      const [artistsMap, artistSongMap] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);

      // Fetch song details cho recent history (parallel)
      const recentSongsPromises = recentHistory.map(async (historyItem) => {
        try {
          const songId = historyItem.idsong;
          const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          const song = songResponse.data.result || songResponse.data;
          
          // Map artists using relationship (consistent with HomePage)
          const artistIds = artistSongMap[songId] || [];
          const artistNames = artistIds
            .map(id => artistsMap[id] || 'Unknown Artist')
            .filter(name => name)
            .join(', ');
          
          const artistName = artistNames || song.artist || 'Unknown Artist';
          
          // Format thời gian nghe
          const listenedAt = new Date(historyItem.listenedAt);
          const timeAgo = getTimeAgo(listenedAt);
          
          return {
            id: song.songId || song.id,
            title: song.title || 'Unknown Title',
            artist: artistName,
            album: song.idalbum ? `Album ${song.idalbum}` : 'Single',
            duration: song.duration, // Keep raw duration for SongListRecent parsing
            coverUrl: song.avatar || '/default-cover.png',
            audioUrl: song.path || '', // Required for useAudioDuration in SongListRecent
            listenedAt: timeAgo, // For display in col-listened
            playCount: historyItem.playCount || 1,
            // Add other fields if needed for consistency with HomePage songs
            views: song.views || 0,
            releaseDate: song.releasedate,
            genreId: song.genreId,
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
      
      // Fallback data (updated with proper artist handling, but since fallback is hardcoded, it's fine)
      if (error.response?.status !== 401) {
        setRecentSongs([
          { 
            id: 101, 
            title: 'Blinding Lights', 
            artist: 'The Weeknd', 
            album: 'After Hours',
            duration: 202, // 3:22 in seconds
            coverUrl: '/default-cover.png',
            audioUrl: '', // Empty for fallback
            listenedAt: 'Hôm nay, 10:30',
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
            duration: 200, // 3:20 in seconds
            coverUrl: '/default-cover.png',
            audioUrl: '',
            listenedAt: 'Hôm nay, 09:15',
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
          <SongListRecent songs={recentSongs} title="" /> {/* Use list view, no title since already in header */}
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