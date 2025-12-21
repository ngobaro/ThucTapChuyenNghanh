// FILE: demo/src/pages/HomePage.jsx
import { useEffect, useState } from 'react';
import SongCard from '../components/music/SongCard';
import SongList from '../components/music/SongList';
import { getAllSongs } from '../services/songService';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './HomePage.css';

function HomePage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artists, setArtists] = useState({});
  const [albumMap, setAlbumMap] = useState({});  // Thêm state cho albumMap

  useEffect(() => {
    loadData();
  }, []);

  // Lấy tất cả artists một lần để tránh multiple requests
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

  // Thêm hàm loadAlbums (mới)
  const loadAlbums = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ALBUMS);
      console.log('Albums response:', response.data);
      
      const albumMapTemp = {};
      let albumsData = [];
      
      if (Array.isArray(response.data)) {
        albumsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        albumsData = response.data.result;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        albumsData = response.data.data;
      }
      
      albumsData.forEach(album => {
        const albumId = album.idalbum || album.id;
        const albumName = album.albumname || album.title || 'Unknown Album';
        albumMapTemp[albumId] = albumName;
      });
      
      console.log('Albums map:', albumMapTemp);
      return albumMapTemp;
    } catch (err) {
      console.warn('Error loading albums:', err);
      return {};
    }
  };

  // Lấy artist-song relationships
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load song, artists, artist-songs, VÀ albums parallel
      const [songsResponse, artistsMap, artistSongMap, albumMapTemp] = await Promise.all([
        getAllSongs(),
        loadArtists(),
        loadArtistSongs(),
        loadAlbums()  // Thêm loadAlbums
      ]);
      
      console.log('All data loaded:', { songsResponse, artistsMap, artistSongMap, albumMapTemp });
      
      const songsData = Array.isArray(songsResponse) ? songsResponse : 
                       songsResponse.result || songsResponse.data || [];
      
      console.log('Songs data:', songsData);
      
      // Set albumMap và artistsMap vào state (để dùng nếu cần sau)
      setAlbumMap(albumMapTemp);
      setArtists(artistsMap);  // SỬA: Thêm dòng này để cập nhật state artists
      
      // Map songs với artist names VÀ album names
      const processedSongs = songsData.map(song => {
        const songId = song.songId || song.id;
        const artistIds = artistSongMap[songId] || [];
        
        // Lấy artist names từ artistIds
        const artistNames = artistIds
          .map(id => artistsMap[id] || 'Unknown Artist')
          .filter(name => name)
          .join(', ');
        
        const artistName = artistNames || song.artist || 'Unknown Artist';
        
        // LẤY TÊN ALBUM: Map từ idalbum
        const albumId = song.idalbum || song.albumId;  // Fallback nếu tên trường khác
        const albumName = albumMapTemp[albumId] || null;
        
        // FALLBACK: Nếu không có album, dùng `${title} (${artistName})`
        const finalAlbum = albumName || `${song.title || 'Unknown'} (${artistName})`;
        
        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: artistName,
          album: finalAlbum,  // SỬA Ở ĐÂY: Tên album thực hoặc fallback
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          audioUrl: song.path || '',
          views: song.views || 0,
          releaseDate: song.releasedate,
          genreId: song.genreId,
          color: getColorByGenre(song.genreId)
        };
      });
      
      // Sắp xếp songs theo views giảm dần để trending có ý nghĩa hơn
      const sortedSongs = processedSongs.sort((a, b) => b.views - a.views);
      
      console.log('Processed and sorted songs:', sortedSongs);
      setSongs(sortedSongs);
      setError(null);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
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
    
    // Nếu duration là số (giây)
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    return '00:00';
  };

  const getColorByGenre = (genreId) => {
    const colors = {
      1: '#1DB954', // Pop
      2: '#FF6B6B', // Hip Hop
      3: '#4ECDC4', // Rock
      4: '#FF9F1C', // R&B
      5: '#9D4EDD', // Jazz
      6: '#06D6A0', // Electronic
      7: '#118AB2', // Country
      8: '#FFD166', // Indie
    };
    return colors[genreId] || '#666';
  };

  if (loading) {
    return (
      <div className="home-page loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page error">
      <div className="error-content">
        <p>❌ {error}</p>
        <button className="btn-retry" onClick={loadData}>
          Thử lại
        </button>
      </div>
    </div>
  );
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>🎵 Chào mừng đến Music Web</h1>
        <p>Khám phá hàng triệu bài hát yêu thích của bạn</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{songs.length}</strong> bài hát
          </span>
          <span className="stat-item">
            <strong>•</strong>
          </span>
          <span className="stat-item">
            <strong>{new Set(songs.map(s => s.artist)).size}</strong> nghệ sĩ
          </span>
        </div>
      </section>

      <section className="trending-section">
        <h2>🔥 Trending Now</h2>
        <div className="song-grid">
          {/* FIX: Pass songs={songs.slice(0, 12)} (sub-queue) và index cho SongCard */}
          {songs.slice(0, 12).map((song, index) => (
            <SongCard 
              key={song.id} 
              song={song}
              songs={songs.slice(0, 12)}  // ✅ Pass sub-list để queue = 12 songs
              index={index}  // ✅ Pass index cho next/prev
              isPlaying={false}  // Optional
            />
          ))}
        </div>
      </section>

      <section className="all-songs-section">
        <div className="section-header">
          <h2>🎵 Tất cả bài hát</h2>
          <span className="song-count">{songs.length} bài hát</span>
        </div>
        <SongList songs={songs} />
      </section>
    </div>
  );
}

export default HomePage;