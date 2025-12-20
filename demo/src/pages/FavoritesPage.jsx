// FILE: demo/src/pages/FavoritesPage.jsx

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import SongCard from '../components/music/SongCard'; // Import SongCard cho grid
import './FavoritesPage.css';

function FavoritesPage() {
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null); // Handle userId fetch
  const [artistsMap, setArtistsMap] = useState({}); // Thêm state cho artistsMap
  const [artistSongMap, setArtistSongMap] = useState({}); // Thêm state cho artistSongMap (multiple artists)

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  // Lấy tất cả artists một lần để tránh multiple requests (consistent with HomePage)
  const loadArtists = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTISTS);
      console.log('Artists response:', response.data);
      
      const artistsMapTemp = {};
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
        artistsMapTemp[artistId] = artistName;
      });
      
      console.log('Artists map:', artistsMapTemp);
      return artistsMapTemp;
    } catch (err) {
      console.warn('Error loading artists:', err);
      return {};
    }
  };

  // Lấy artist-song relationships (cho multiple artists)
  const loadArtistSongs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      console.log('Artist songs response:', response.data);
      
      const artistSongMapTemp = {};
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
          if (!artistSongMapTemp[songId]) {
            artistSongMapTemp[songId] = [];
          }
          artistSongMapTemp[songId].push(artistId);
        }
      });
      
      console.log('Artist song map:', artistSongMapTemp);
      return artistSongMapTemp;
    } catch (err) {
      console.warn('Error loading artist songs:', err);
      return {};
    }
  };

  const fetchUserAndFavorites = async () => {
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

      // Load artists, artist-songs parallel trước khi fetch favorites
      const [artistsMapTemp, artistSongMapTemp] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);
      setArtistsMap(artistsMapTemp);
      setArtistSongMap(artistSongMapTemp);

      // Dùng USER_FAVORITES(userId) để lấy trực tiếp list SongResponse
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(currentUserId)); // GET /users/{userId}/favorites
      const favSongs = res.data?.result || []; // List<SongResponse> từ backend
      
      console.log('Favorite songs from API:', favSongs.length, 'items');
      
      // Map sang format cho SongCard (với artist mapping đúng)
      const songs = favSongs.map(song => {
        const songId = song.songId || song.id;
        
        // SỬA ARTIST MAPPING: Handle multiple artists via artistSongMap
        const artistIds = artistSongMapTemp[songId] || [];
        const artistNames = artistIds
          .map(aId => artistsMapTemp[aId] || 'Unknown Artist')
          .filter(name => name)
          .join(', ');
        const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: artistName,  // SỬA: Multiple artists nếu có, hoặc fallback
          album: song.idalbum ? `Album ${song.idalbum}` : 'Single', // Có thể cải thiện sau với albumMap
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png', // Real cover
          addedDate: new Date().toLocaleDateString('vi-VN'),
          genreId: song.genreId || 1, // Fallback
          genreName: getGenreName(song.genreId),
          genreColor: getGenreColor(song.genreId)
        };
      });

      setFavoriteSongs(songs);
      
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
      
      // Fallback data (chỉ nếu error không phải auth)
      if (error.response?.status !== 401) {
        setFavoriteSongs([
          { 
            id: 101, 
            title: 'Blinding Lights', 
            artist: 'The Weeknd', 
            album: 'After Hours',
            duration: '3:22',
            coverUrl: '/default-cover.png',
            addedDate: '2024-01-15',
            genreId: 1,
            genreName: 'Pop',
            genreColor: '#1DB954'
          },
          { 
            id: 102, 
            title: 'Flowers', 
            artist: 'Miley Cyrus', 
            album: 'Endless Summer Vacation',
            duration: '3:20',
            coverUrl: '/default-cover.png',
            addedDate: '2024-02-10',
            genreId: 4,
            genreName: 'R&B',
            genreColor: '#FF9F1C'
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getGenreName = (id) => {
    const map = { 1: 'Pop', 2: 'Hip Hop', 3: 'Rock', 4: 'R&B', 5: 'Jazz', 6: 'Electronic', 7: 'Country', 8: 'Indie' };
    return map[id] || 'Khác';
  };

  const getGenreColor = (id) => {
    const colors = { 1: '#1DB954', 2: '#FF6B6B', 3: '#4ECDC4', 4: '#FF9F1C', 5: '#9D4EDD', 6: '#06D6A0', 7: '#118AB2', 8: '#FFD166' };
    return colors[id] || '#888';
  };

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    
    if (typeof duration === 'string') {
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          // SỬA: Xử lý đúng định dạng HH:MM:SS -> MM:SS
          return `${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
        }
        if (parts.length === 2) {
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
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

  const handleRemoveFavorite = async (songId) => {
    try {
      if (!userId) {
        alert('Vui lòng đăng nhập lại!');
        return;
      }
      
      // Gọi API để xóa khỏi favorites
      await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId));
      
      // Cập nhật UI (filter local)
      setFavoriteSongs(prev => prev.filter(song => song.id !== songId));
      
      console.log('Removed favorite:', songId);
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Lỗi khi xóa bài hát yêu thích');
    }
  };

  if (loading) {
    return (
      <div className="favorites-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <section className="hero-section"> {/* Match HomePage hero style */}
        <h1>❤️ Bài hát yêu thích</h1>
        <p>Những bài hát bạn đã lưu</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{favoriteSongs.length}</strong> bài hát
          </span>
        </div>
      </section>

      {favoriteSongs.length > 0 ? (
        <section className="trending-section"> {/* Match HomePage trending style */}
          <h2>🔥 Danh sách yêu thích của bạn</h2>
          <div className="song-grid"> {/* Grid như Trending Now */}
            {favoriteSongs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                onRemoveFavorite={handleRemoveFavorite} // Pass callback cho remove
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-state">
          <Heart size={64} />
          <h2>Chưa có bài hát yêu thích</h2>
          <p>Nhấn vào biểu tượng trái tim để lưu bài hát vào đây</p>
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;