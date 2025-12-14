// FILE: demo/src/pages/GenrePage.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SongList from '../components/music/SongList';
import { getGenreSongs } from '../services/songService';
import { Shuffle } from 'lucide-react';
import './GenrePage.css';

function GenrePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [genre, setGenre] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenreData();
  }, [id]);

  const fetchGenreData = async () => {
    try {
      setLoading(true);
      const genreId = parseInt(id);
      
      // Lấy danh sách bài hát theo thể loại
      const response = await getGenreSongs(genreId);
      console.log('Genre response:', response);
      
      // Dữ liệu mẫu cho genre info
      const genreData = {
        1: { name: 'Pop', description: 'Nhạc Pop phổ biến nhất hiện nay với giai điệu bắt tai và dễ nghe.', color: '#1DB954' },
        2: { name: 'Hip Hop', description: 'Hip Hop đỉnh cao với những bản rap chất lượng và beat mạnh mẽ.', color: '#FF6B6B' },
        3: { name: 'Rock', description: 'Rock mạnh mẽ, cá tính với guitar điện và trống sôi động.', color: '#4ECDC4' },
        4: { name: 'EDM', description: 'Electronic Dance Music sôi động, hoàn hảo cho các bữa tiệc.', color: '#9D4EDD' },
        5: { name: 'R&B', description: 'R&B nhẹ nhàng, sâu lắng với giai điệu quyến rũ.', color: '#FF9F1C' },
        6: { name: 'Acoustic', description: 'Acoustic tinh tế với guitar mộc và giọng hát truyền cảm.', color: '#06D6A0' },
      };
      
      const selectedGenre = genreData[genreId] || {
        name: 'Thể loại',
        description: 'Khám phá những bài hát tuyệt vời trong thể loại này.',
        color: '#666'
      };
      
      setGenre({
        id: genreId,
        name: selectedGenre.name,
        description: selectedGenre.description,
        color: selectedGenre.color,
        songCount: response.result?.length || 0
      });
      
      setSongs(response.result || []);
      
    } catch (error) {
      console.error('Error fetching genre:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      // TODO: Implement shuffle play logic
      alert(`Bắt đầu phát ngẫu nhiên ${songs.length} bài hát ${genre?.name}`);
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
      {/* Header với màu thể loại */}
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

      {/* Controls */}
      <div className="genre-controls">
        <button className="btn-shuffle" onClick={handleShufflePlay}>
          <Shuffle size={20} />
          Phát ngẫu nhiên
        </button>
      </div>

      {/* Danh sách bài hát */}
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
            <button onClick={() => navigate('/discover')}>
              Khám phá bài hát
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GenrePage;