// FILE: demo/src/pages/FavoritesPage.jsx
import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { usePlayer } from '../context/PlayerContext'; // THÊM DÒNG NÀY
import SongCard from '../components/music/SongCard';
import './FavoritesPage.css';

function FavoritesPage() {
  const { userId: contextUserId, toggleFavorite, forceRefreshFavorites } = usePlayer(); // LẤY TỪ CONTEXT

  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [artistsMap, setArtistsMap] = useState({});
  const [artistSongMap, setArtistSongMap] = useState({});

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  // Load artists (giống HomePage)
  const loadArtists = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTISTS);
      const artistsMapTemp = {};
      let artistsData = [];
      if (Array.isArray(response.data)) artistsData = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) artistsData = response.data.result;
      else if (response.data.data && Array.isArray(response.data.data)) artistsData = response.data.data;

      artistsData.forEach(artist => {
        const artistId = artist.idartist || artist.id;
        const artistName = artist.artistname || artist.name || 'Unknown Artist';
        artistsMapTemp[artistId] = artistName;
      });
      return artistsMapTemp;
    } catch (err) {
      console.warn('Error loading artists:', err);
      return {};
    }
  };

  // Load artist-song relationships (multiple artists)
  const loadArtistSongs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      const artistSongMapTemp = {};
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) data = response.data.result;

      data.forEach(item => {
        const songId = item.idsong;
        const artistId = item.idartist;
        if (songId && artistId) {
          if (!artistSongMapTemp[songId]) artistSongMapTemp[songId] = [];
          artistSongMapTemp[songId].push(artistId);
        }
      });
      return artistSongMapTemp;
    } catch (err) {
      console.warn('Error loading artist songs:', err);
      return {};
    }
  };

  const fetchUserAndFavorites = async () => {
    try {
      setLoading(true);

      // Lấy userId (ưu tiên localStorage → API)
      let currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        const userRes = await api.get(API_ENDPOINTS.MY_INFO);
        const userData = userRes.data?.result || userRes.data;
        currentUserId = userData?.id || userData?.userId;
        if (currentUserId) {
          localStorage.setItem('userId', currentUserId.toString());
        }
      }
      const uid = Number(currentUserId);
      setUserId(uid);

      // Load artists & artist-song song song
      const [artistsMapTemp, artistSongMapTemp] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);
      setArtistsMap(artistsMapTemp);
      setArtistSongMap(artistSongMapTemp);

      // Lấy danh sách yêu thích
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(uid));
      const favSongs = res.data?.result || [];

      const songs = favSongs.map(song => {
        const songId = song.songId || song.id;

        // Hỗ trợ nhiều nghệ sĩ
        const artistIds = artistSongMapTemp[songId] || [];
        const artistNames = artistIds
          .map(aId => artistsMapTemp[aId] || 'Unknown Artist')
          .filter(name => name)
          .join(', ');
        const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: artistName,
          album: song.idalbum ? `Album ${song.idalbum}` : 'Single',
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          audioUrl: song.path || '',
          addedDate: new Date().toLocaleDateString('vi-VN'),
          genreId: song.genreId || 1,
          genreName: getGenreName(song.genreId),
          genreColor: getGenreColor(song.genreId)
        };
      });

      setFavoriteSongs(songs);

      // Force refresh context để PlayerBar và SongList cập nhật ngay
      forceRefreshFavorites();

    } catch (error) {
      console.error('Error fetching favorite songs:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        // Fallback data (giữ nguyên như cũ)
        setFavoriteSongs([
          { id: 101, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:22', coverUrl: '/default-cover.png', audioUrl: '', addedDate: '2024-01-15', genreId: 1, genreName: 'Pop', genreColor: '#1DB954' },
          { id: 102, title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', duration: '3:20', coverUrl: '/default-cover.png', audioUrl: '', addedDate: '2024-02-10', genreId: 4, genreName: 'R&B', genreColor: '#FF9F1C' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // XÓA KHỎI YÊU THÍCH - ĐỒNG BỘ NGAY LẬP TỨC
  const handleRemoveFavorite = async (songId) => {
    try {
      const uid = userId || contextUserId;
      if (!uid) {
        alert('Vui lòng đăng nhập lại!');
        return;
      }

      await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(uid, songId));

      // Cập nhật UI local
      setFavoriteSongs(prev => prev.filter(song => song.id !== songId));

      // Đồng bộ context → PlayerBar và SongList tự động cập nhật trái tim
      toggleFavorite(songId);

    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Lỗi khi xóa bài hát yêu thích');
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
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 3) return `${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
      if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      return duration;
    }
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return '00:00';
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
      <section className="hero-section">
        <h1>Bài hát yêu thích</h1>
        <p>Những bài hát bạn đã lưu</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{favoriteSongs.length}</strong> bài hát
          </span>
        </div>
      </section>

      {favoriteSongs.length > 0 ? (
        <section className="trending-section">
          <h2>Danh sách yêu thích của bạn</h2>
          <div className="song-grid">
            {favoriteSongs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                songs={favoriteSongs}
                index={index}
                onRemoveFavorite={handleRemoveFavorite} // Truyền callback xóa
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