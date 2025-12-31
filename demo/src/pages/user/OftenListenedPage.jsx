// FILE: demo/src/pages/OftenListenedPage.jsx
// Fixed: Added logic to select 18 unique songs (by songId) from shuffled history to avoid duplicates.
// No major changes otherwise; ensured fallback getTimeAgo called correctly, added error handling for date parsing.

import { useState, useEffect } from 'react';
import { Clock, Loader2, Shuffle } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import SongCard from '../../components/music/SongCard'; // Assume SongCard from HomePage/others for grid display
import './OftenListenedPage.css'; // New CSS file (provided below)

function OftenListenedPage() {
  const [oftenSongs, setOftenSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserAndOftenSongs();
  }, []);

  // Shared: Load artists map (same as RecentPage)
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

  // Shared: Load artist-song relationships (same as RecentPage)
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

  const fetchUserAndOftenSongs = async () => {
    try {
      setLoading(true);

      // Fetch userId nếu chưa có (same as RecentPage)
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

      // Lấy TOÀN BỘ lịch sử nghe của user (không limit)
      console.log('=== DEBUG: Fetching FULL user history ===');
      console.log('API Endpoint:', API_ENDPOINTS.USER_HISTORY(currentUserId));

      const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(currentUserId));

      console.log('=== DEBUG: Full History API Response ===');
      console.log('Full response:', historyResponse);
      console.log('Response data:', historyResponse.data);

      let historyData = [];

      // Xử lý nhiều cấu trúc response (same as RecentPage)
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

      console.log('Full history data length:', historyData.length);

      if (historyData.length === 0) {
        console.log('No history data found');
        setOftenSongs([]);
        return;
      }

      // Sắp xếp theo thời gian (desc) để ưu tiên recent, nhưng sẽ random sau
      const getDate = (item) => {
        return item.listen_date ||
          item.listenedAt ||
          item.listenDate ||
          item.listen_time ||
          item.date ||
          item.created_at;
      };

      historyData.sort((a, b) => {
        const dateA = getDate(a);
        const dateB = getDate(b);
        if (!dateA || !dateB) return 0;
        return new Date(dateB) - new Date(dateA);
      });

      // Random unique songs (by songId) từ full history (nếu <18 unique thì lấy hết)
      const shuffledHistory = [...historyData].sort(() => 0.5 - Math.random());
      const selectedHistory = [];
      const seenSongIds = new Set();

      for (const item of shuffledHistory) {
        // Xác định songId (same as below)
        const songId = item.idsong ||
          item.songId ||
          item.id_song ||
          item.diêten ||
          item.song_id ||
          item.id;

        if (songId && !seenSongIds.has(songId) && selectedHistory.length < 18) {
          selectedHistory.push(item);
          seenSongIds.add(songId);
        }
        if (selectedHistory.length === 18) break;
      }

      console.log('Selected random unique history (18 unique songs):', selectedHistory.length);
      console.log('Unique song IDs:', Array.from(seenSongIds));

      // Load artists và artist-songs parallel (same as RecentPage)
      const [artistsMap, artistSongMap] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);

      // Fetch song details cho selected history (parallel)
      const oftenSongsPromises = selectedHistory.map(async (historyItem, index) => {
        try {
          console.log(`\n=== Processing random unique history item ${index + 1} ===`);
          console.log('Item data:', historyItem);

          // Xác định songId (same as RecentPage)
          const songId = historyItem.idsong ||
            historyItem.songId ||
            historyItem.id_song ||
            historyItem.diêten ||
            historyItem.song_id ||
            historyItem.id;

          if (!songId) {
            console.error('No songId found in history item:', historyItem);
            return null;
          }

          console.log(`Found songId: ${songId}`);

          // Fetch thông tin bài hát
          const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          console.log(`Song ${songId} response:`, songResponse.data);

          const song = songResponse.data.result || songResponse.data;

          if (!song) {
            console.error(`Song ${songId} not found`);
            return null;
          }

          // Map artists (same as RecentPage)
          const artistIds = artistSongMap[songId] || [];
          const artistNames = artistIds
            .map(id => artistsMap[id] || 'Unknown Artist')
            .filter(name => name)
            .join(', ');

          const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

          // Lấy thời gian nghe (cho display, dù random)
          const getListenDate = (item) => {
            return item.listen_date ||
              item.listenedAt ||
              item.listenDate ||
              item.listen_time ||
              item.date ||
              item.created_at ||
              item.time;
          };

          const listenDateField = getListenDate(historyItem);
          const listenedAt = listenDateField ? new Date(listenDateField) : new Date();
          if (isNaN(listenedAt.getTime())) {
            listenedAt = new Date();  // Fallback to now if invalid
          }
          const timeAgo = getTimeAgo(listenedAt);

          // Lấy playCount nếu có (từ history hoặc song)
          const playCount = historyItem.playCount ||
            historyItem.play_count ||
            historyItem.count ||
            song.views || song.listens || 1;

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
            rawListenDate: listenedAt,
            playCount: playCount,
            views: song.views || song.listens || 0,
            releaseDate: song.releasedate || song.release_date,
            genreId: song.genreId || song.idgenre || song.genre_id,
          };
        } catch (error) {
          console.error(`Error fetching song from history item ${index}:`, error);
          return null;
        }
      });

      const songs = (await Promise.all(oftenSongsPromises)).filter(Boolean);
      console.log('\n=== FINAL: Often listened songs (18 unique random) ===');
      console.log('Total songs:', songs.length);
      console.log('Songs data:', songs);

      setOftenSongs(songs);

    } catch (error) {
      console.error('Error fetching often songs:', error);

      // Fallback: Random sample data nếu lỗi (không phải auth)
      if (error.response?.status !== 401) {
        const fallbackSongs = Array.from({ length: 18 }, (_, i) => ({
          id: 200 + i,
          title: `Random Song ${i + 1}`,
          artist: `Artist ${i + 1}`,
          album: 'Various',
          duration: Math.floor(Math.random() * 200) + 180,
          coverUrl: '/default-cover.png',
          audioUrl: '',
          listenedAt: getTimeAgo(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
          rawListenDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          playCount: Math.floor(Math.random() * 50) + 1,
          views: 0,
          releaseDate: null,
          genreId: 1,
        }));
        setOftenSongs(fallbackSongs);
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