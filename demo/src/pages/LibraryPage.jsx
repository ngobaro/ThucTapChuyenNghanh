// FILE: demo/src/pages/LibraryPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Heart, Plus, X, Loader2, Shuffle } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import SongCard from '../components/music/SongCard'; // Import SongCard để hiển thị often songs
import './LibraryPage.css';

function LibraryPage() {
  const [playlists, setPlaylists] = useState([]);
  const [oftenSongs, setOftenSongs] = useState([]); // Changed: oftenSongs instead of favorites
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playlists'); // Tab state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null); // For often load

  const navigate = useNavigate();

  useEffect(() => {
    loadLibraryData();
  }, []);

  // Shared: Load artists map (from OftenListenedPage)
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

  // Shared: Load artist-song relationships (from OftenListenedPage)
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

  // New: Load often songs (adapted from OftenListenedPage)
  const loadOftenSongs = async (currentUserId) => {
    try {
      console.log('=== DEBUG: Fetching FULL user history for often ===');
      console.log('API Endpoint:', API_ENDPOINTS.USER_HISTORY(currentUserId));

      const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(currentUserId));

      console.log('=== DEBUG: Full History API Response ===');
      console.log('Full response:', historyResponse);
      console.log('Response data:', historyResponse.data);

      let historyData = [];

      // Xử lý nhiều cấu trúc response
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

      // Sắp xếp theo thời gian (desc)
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

      // Random unique songs (by songId) từ full history
      const shuffledHistory = [...historyData].sort(() => 0.5 - Math.random());
      const selectedHistory = [];
      const seenSongIds = new Set();

      for (const item of shuffledHistory) {
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

      // Load artists và artist-songs parallel
      const [artistsMap, artistSongMap] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);

      // Fetch song details cho selected history (parallel)
      const oftenSongsPromises = selectedHistory.map(async (historyItem, index) => {
        try {
          console.log(`\n=== Processing random unique history item ${index + 1} ===`);
          console.log('Item data:', historyItem);

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

          // Map artists
          const artistIds = artistSongMap[songId] || [];
          const artistNames = artistIds
            .map(id => artistsMap[id] || 'Unknown Artist')
            .filter(name => name)
            .join(', ');

          const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

          // Lấy thời gian nghe
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

          // Lấy playCount nếu có
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
      setOftenSongs([]); // Clear on error
    }
  };

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      setError('');

      // Lấy userId
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

      // Load playlists (same as before)
      const playlistRes = await api.get(API_ENDPOINTS.PLAYLISTS); // GET /playlists
      const playlistData = playlistRes.data.result || playlistRes.data || [];
      console.log('Loaded playlists in LibraryPage:', playlistData.length, 'items'); // Debug

      // Fetch songCount cho mỗi playlist (parallel)
      const playlistsWithCount = await Promise.all(
        playlistData.map(async (p) => {
          try {
            const songsRes = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(p.idplaylist || p.id));
            const songCount = (songsRes.data.result || songsRes.data || []).length;
            return { ...p, songCount }; // Add songCount
          } catch (err) {
            console.warn(`Failed to fetch song count for playlist ${p.id}:`, err);
            return { ...p, songCount: 0 };
          }
        })
      );

      // Random màu cho playlist card
      const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'];
      const enrichedPlaylists = playlistsWithCount.map((p, i) => ({
        id: p.idplaylist || p.id,
        name: p.nameplaylist || p.name || 'Playlist không tên',
        songCount: p.songCount || 0, // Now from fetch
        color: colors[i % colors.length]
      }));

      setPlaylists(enrichedPlaylists);

      // Load often songs (parallel with playlists, but since async, call here)
      if (currentUserId) {
        await loadOftenSongs(currentUserId);
      }

    } catch (error) {
      console.error('Error loading library data:', error);
      setError('Không thể tải dữ liệu thư viện. Vui lòng thử lại.');
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = () => {
    setNewPlaylistName('');
    setError('');
    setShowCreateModal(true);
  };

  const submitCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên playlist');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post(API_ENDPOINTS.PLAYLISTS, {
        nameplaylist: trimmedName,
        // description: tùy chọn, backend có thể mặc định
      });

      const newPlaylist = response.data.result || response.data;

      alert('Tạo playlist thành công!');
      setShowCreateModal(false);

      // Reload và chuyển đến playlist mới
      await loadLibraryData();
      navigate(`/playlist/${newPlaylist.idplaylist || newPlaylist.id}`);
    } catch (err) {
      console.error('Create playlist error:', err);
      const msg = err.response?.data?.message || 'Không thể tạo playlist (có thể do quyền hoặc lỗi server)';
      setError(msg);
    } finally {
      setCreating(false);
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
      <div className="library-page loading">
        <div className="spinner"></div>
        <p>Đang tải thư viện...</p>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Thư viện của tôi</h1>
      </div>

      <div className="library-tabs">
        <button
          className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          <ListMusic size={20} />
          Playlists
          <span className="tab-count">{playlists.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'often' ? 'active' : ''}`}
          onClick={() => setActiveTab('often')}
        >
          <Heart size={20} />
          Bài hát của bạn
          <span className="tab-count">{oftenSongs.length}</span>
        </button>
      </div>

      <div className="library-content">
        {activeTab === 'playlists' ? (
          <div className="playlists-section">
            <div className="section-header">
              <h2>Tất cả Playlists</h2>
            </div>

            <div className="playlists-grid">
              {playlists.map(p => (
                <div
                  key={p.id}
                  className="playlist-card"
                  onClick={() => navigate(`/playlist/${p.id}`)}
                >
                  <div className="playlist-cover" style={{ backgroundColor: p.color }}>
                    <span className="playlist-icon">♫</span>
                  </div>
                  <div className="playlist-info">
                    <h3>{p.name}</h3>
                    <p>{p.songCount} bài hát</p>
                  </div>
                </div>
              ))}

              <div className="playlist-card create-new" onClick={handleCreatePlaylist}>
                <div className="playlist-cover new-playlist">
                  <Plus size={32} />
                </div>
                <div className="playlist-info">
                  <h3>Tạo playlist mới</h3>
                  <p>Bắt đầu từ trống</p>
                </div>
              </div>
            </div>

            {playlists.length === 0 && (
              <div className="empty-state">
                <ListMusic size={64} />
                <h2>Chưa có playlist nào</h2>
                <p>Nhấn nút "Tạo mới" để bắt đầu</p>
              </div>
            )}
          </div>
        ) : (
          <div className="often-section"> {/* Reuse styles from OftenListenedPage */}
            <div className="section-header">
              <h2>🎵 Bài hát bạn thường nghe</h2>
            </div>
            {oftenSongs.length > 0 ? (
              <div className="songs-grid">
                {/* FIX: Pass songs={oftenSongs} (full queue) và index cho SongCard */}
                {oftenSongs.map((song, index) => (
                  <SongCard 
                    key={song.id} 
                    song={song}
                    songs={oftenSongs}  // ✅ Pass full oftenSongs list (queue = tất cả often songs)
                    index={index}  // ✅ Pass index cho next/prev đúng vị trí
                    isPlaying={false}  // Optional
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Heart size={64} /> {/* Reuse icon */}
                <h2>Chưa có bài hát nào trong lịch sử</h2>
                <p>Bắt đầu nghe nhạc để xem gợi ý ở đây</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal tạo playlist */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal create-playlist-modal">
            <div className="modal-header">
              <h3>Tạo playlist mới</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)} disabled={creating}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Tên playlist *</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ví dụ: Chill buổi tối, Nhạc tập gym..."
                  autoFocus
                  disabled={creating}
                />
                {error && <div className="error-text">{error}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={submitCreatePlaylist}
                disabled={creating || !newPlaylistName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="spinner-small" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo playlist'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryPage;