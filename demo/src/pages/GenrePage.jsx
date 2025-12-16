// FILE: demo/src/pages/GenrePage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SongList from '../components/music/SongList';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { Shuffle } from 'lucide-react';
import './GenrePage.css';

function GenrePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [genre, setGenre] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchGenreData();
    }
  }, [id]);

  const fetchGenreData = async () => {
    try {
      setLoading(true);
      
      // Load genre info
      const genreResponse = await api.get(API_ENDPOINTS.GENRE_BY_ID(id));
      console.log('Genre response:', genreResponse.data);
      
      let genreData = genreResponse.data.result || genreResponse.data;
      
      // Load genre songs using dedicated endpoint
      const songsResponse = await api.get(API_ENDPOINTS.GENRE_SONGS(id));
      console.log('Genre songs response:', songsResponse.data);
      
      let songsData = [];
      if (Array.isArray(songsResponse.data)) {
        songsData = songsResponse.data;
      } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
        songsData = songsResponse.data.result;
      } else if (songsResponse.data.data && Array.isArray(songsResponse.data.data)) {
        songsData = songsResponse.data.data;
      }
      
      // Process songs
      const processedSongs = songsData.map(song => {
        const songId = song.songId || song.id;
        
        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: song.artist || 'Unknown Artist',
          album: song.idalbum || 'Single',
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          audioUrl: song.path || '',
          views: song.views || 0
        };
      });
      
      setGenre({
        id: parseInt(id),
        name: genreData.genrename || genreData.name || 'Thể loại',
        description: getDescription(genreData.genrename || genreData.name),
        color: getColorByGenreId(id),
        songCount: processedSongs.length
      });
      
      setSongs(processedSongs);
      
    } catch (error) {
      console.error('Error fetching genre:', error);
      navigate('/genres');
    } finally {
      setLoading(false);
    }
  };

  const getColorByGenreId = (genreId) => {
    const colors = {
      1: '#1DB954',
      2: '#FF6B6B',
      3: '#4ECDC4',
      4: '#FF9F1C',
      5: '#9D4EDD',
      6: '#06D6A0',
      7: '#118AB2',
      8: '#FFD166',
    };
    return colors[genreId] || '#666';
  };

  const getDescription = (genreName) => {
    const descriptions = {
      'Pop': 'Nhạc Pop phổ biến nhất hiện nay với giai điệu bắt tai và dễ nghe.',
      'Hip Hop': 'Hip Hop đỉnh cao với những bản rap chất lượng và beat mạnh mẽ.',
      'Rock': 'Rock mạnh mẽ, cá tính với guitar điện và trống sôi động.',
      'R&B': 'R&B nhẹ nhàng, sâu lắng với giai điệu quyến rũ.',
      'Jazz': 'Jazz tinh tế với những giai điệu phức tạp và nghệ thuật.',
      'Electronic': 'Electronic Dance Music sôi động, hoàn hảo cho các bữa tiệc.',
      'Country': 'Country dân dã, gần gũi với cuộc sống và tình cảm chân thật.',
      'Indie': 'Indie độc lập và sáng tạo, mang hơi thở mới mẻ.'
    };
    return descriptions[genreName] || 'Khám phá những bài hát tuyệt vời trong thể loại này.';
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

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      console.log(`Shuffle play ${songs.length} songs in ${genre?.name}`);
    }
  };

  if (loading) {
    return (
      <div className="genre-page loading">
        <div className="spinner"></div>
        <p>Đang tải thể loại...</p>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="genre-page not-found">
        <h2>Thể loại không tồn tại</h2>
        <button onClick={() => navigate('/genres')}>
          Quay lại danh sách thể loại
        </button>
      </div>
    );
  }

  return (
    <div className="genre-page">
      <div 
        className="genre-header"
        style={{ backgroundColor: genre.color + '20', borderLeft: `6px solid ${genre.color}` }}
      >
        <div className="genre-header-content">
          <div className="genre-badge" style={{ backgroundColor: genre.color }}>
            {genre.name}
          </div>
          <h1 className="genre-title">{genre.name}</h1>
          <p className="genre-description">{genre.description}</p>
          <div className="genre-stats">
            <span className="stat-item">
              <strong>{genre.songCount}</strong> bài hát
            </span>
            <span className="stat-item">
              <strong>•</strong> Thể loại
            </span>
          </div>
        </div>
      </div>

      <div className="genre-controls">
        <button className="btn-shuffle" onClick={handleShufflePlay}>
          <Shuffle size={20} />
          Phát ngẫu nhiên
        </button>
      </div>

      <div className="genre-content">
        <div className="section-header">
          <h2>Tất cả bài hát</h2>
          <span className="song-count">{songs.length} bài hát</span>
        </div>
        
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <div className="no-songs">
            <p>Chưa có bài hát nào trong thể loại này</p>
            <button onClick={() => navigate('/')}>
              Khám phá bài hát
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GenrePage;