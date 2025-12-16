// FILE: demo/src/pages/AlbumDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User } from 'lucide-react';
import SongList from '../components/music/SongList';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './AlbumDetailPage.css';

function AlbumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAlbumData();
    }
  }, [id]);

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

  const fetchAlbumData = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin album
      const albumResponse = await api.get(API_ENDPOINTS.ALBUM_BY_ID(id));
      console.log('Album response:', albumResponse.data);
      
      let albumData = albumResponse.data.result || albumResponse.data;
      
      // Load artists và artist-songs parallel
      const [artistsMap, artistSongMap] = await Promise.all([
        loadArtists(),
        loadArtistSongs()
      ]);
      
      // Lấy thông tin artist (main artist cho album) từ map để tránh request thừa
      let artistName = 'Unknown Artist';
      if (albumData.idartist) {
        artistName = artistsMap[albumData.idartist] || 'Unknown Artist';
      }
      
      // Lấy danh sách bài hát trong album (sử dụng params album=id, assuming API supports)
      const songsResponse = await api.get(API_ENDPOINTS.SONGS, {
        params: { album: id }
      });
      
      console.log('Album songs response:', songsResponse.data);
      
      let songsData = [];
      if (Array.isArray(songsResponse.data)) {
        songsData = songsResponse.data;
      } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
        songsData = songsResponse.data.result;
      }
      
      // Format songs data với multi-artist mapping
      const formattedSongs = songsData.map((song, index) => {
        const songId = song.songId || song.id;
        const artistIds = artistSongMap[songId] || [];
        
        // Lấy artist names từ artistIds
        const artistNames = artistIds
          .map(aId => artistsMap[aId] || 'Unknown Artist')
          .filter(name => name)
          .join(', ');
        
        const songArtist = artistNames || song.artist || artistName;
        
        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: songArtist,
          album: albumData.albumname || albumData.title || 'Unknown Album',
          duration: formatDuration(song.duration),
          trackNumber: song.trackNumber || (index + 1),
          coverUrl: song.avatar || albumData.cover || '/default-album.jpg',
          audioUrl: song.path || '',
          views: song.views || 0,
          releaseDate: song.releasedate,
          genreId: song.genreId,
          color: getColorByGenre(song.genreId)
        };
      });
      
      // Tính tổng thời lượng
      const totalDuration = calculateTotalDuration(formattedSongs);
      
      // Thêm cover cho album nếu có
      const albumCover = albumData.cover || albumData.avatar || '/default-album.jpg';
      
      setAlbum({
        id: albumData.idalbum || albumData.id,
        title: albumData.albumname || albumData.title || 'Unknown Album',
        artist: artistName,
        year: albumData.releaseyear || albumData.year || new Date().getFullYear(),
        genre: albumData.genre || 'Unknown Genre',
        description: getAlbumDescription(albumData.albumname || albumData.title),
        color: getRandomColor(),
        duration: totalDuration,
        songCount: formattedSongs.length,
        cover: albumCover  // Thêm cover vào album state
      });
      
      setSongs(formattedSongs);
      
    } catch (error) {
      console.error('Error fetching album:', error);
      navigate('/albums');
    } finally {
      setLoading(false);
    }
  };

  const getAlbumDescription = (title) => {
    const descriptions = {
      'After Hours': 'Album phòng thu thứ 4 của The Weeknd, khám phá chủ đề đêm khuya và những cảm xúc cô đơn.',
      'Future Nostalgia': 'Album phòng thu thứ 2 của Dua Lipa, kết hợp giữa âm thanh disco retro và pop hiện đại.',
      'Midnights': 'Album phòng thu thứ 10 của Taylor Swift, khám phá những suy tư vào đêm khuya.',
      '30': 'Album phòng thu thứ 4 của Adele, khám phá hành trình ly hôn và tự khám phá bản thân.',
      '÷': 'Album phòng thu thứ 3 của Ed Sheeran với sự pha trộn giữa pop, folk và hip-hop.'
    };
    return descriptions[title] || 'Khám phá những bài hát tuyệt vời trong album này.';
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

  const calculateTotalDuration = (songs) => {
    let totalSeconds = 0;
    
    songs.forEach(song => {
      const duration = song.duration;
      if (duration && typeof duration === 'string' && duration.includes(':')) {
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
          totalSeconds += parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  };

  const getRandomColor = () => {
    const colors = ['#1E3A8A', '#DC2626', '#1DB954', '#7C3AED', '#0F766E', '#DB2777'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      console.log('Play all songs in album:', album?.title);
    }
  };

  if (loading) {
    return (
      <div className="album-detail-page loading">
        <div className="spinner"></div>
        <p>Đang tải album...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="album-detail-page not-found">
        <h2>Album không tồn tại</h2>
        <button onClick={() => navigate('/albums')}>
          Quay lại danh sách album
        </button>
      </div>
    );
  }

  return (
    <div className="album-detail-page">
      <div className="album-header">
        <div className="album-cover-large">
          {album.cover && album.cover !== '/default-album.jpg' ? (
            <img 
              src={album.cover} 
              alt={`${album.title} cover`} 
              className="album-image"
              onError={(e) => {
                e.target.style.display = 'none'; // Ẩn img nếu load lỗi, fallback sang icon
              }}
            />
          ) : null}
          {!album.cover || album.cover === '/default-album.jpg' ? (
            <div 
              className="album-fallback-cover"
              style={{ backgroundColor: album.color }}
            >
              <span className="album-icon">A</span>
            </div>
          ) : null}
        </div>
        
        <div className="album-info">
          <div className="album-badge">ALBUM</div>
          <h1 className="album-title">{album.title}</h1>
          <h2 className="album-artist">{album.artist}</h2>
          
          <div className="album-meta">
            <span className="meta-item">
              {album.year}
            </span>
            <span className="meta-item">
              •
            </span>
            <span className="meta-item">
              {album.genre}
            </span>
            <span className="meta-item">
              •
            </span>
            <span className="meta-item">
              {album.songCount} bài hát
            </span>
            <span className="meta-item">
              •
            </span>
            <span className="meta-item">
              {album.duration}
            </span>
          </div>
          
          <p className="album-description">{album.description}</p>
        </div>
      </div>

      <div className="album-controls">
        <button className="btn-play-large" onClick={handlePlayAll}>
          <Play size={24} />
          Phát tất cả
        </button>
        <button className="btn-like">
          <Heart size={20} />
        </button>
        <button className="btn-more">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="album-content">
        <div className="section-header">
          <h2>Danh sách bài hát</h2>
          <span className="song-count">{songs.length} bài hát</span>
        </div>
        
        {songs.length > 0 ? (
          <SongList songs={songs} showTrackNumber={true} />
        ) : (
          <div className="no-songs">
            <p>Chưa có bài hát nào trong album này</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlbumDetailPage;