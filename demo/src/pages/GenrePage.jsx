// FILE: demo/src/pages/GenrePage.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SongList from '../components/music/SongList';
import { getGenreSongs } from '../services/songService';
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
      
      // Dữ liệu mẫu cho genre
      const genreData = {
        1: { 
          id: 1, 
          name: 'Pop', 
          description: 'Nhạc Pop phổ biến nhất hiện nay',
          color: '#1DB954',
          songCount: 245 
        },
        2: { 
          id: 2, 
          name: 'Hip Hop', 
          description: 'Nhạc Hip Hop đỉnh cao',
          color: '#FF6B6B',
          songCount: 189 
        },
        3: { 
          id: 3, 
          name: 'Rock', 
          description: 'Rock mạnh mẽ và cá tính',
          color: '#4ECDC4',
          songCount: 167 
        },
        4: { 
          id: 4, 
          name: 'R&B', 
          description: 'R&B nhẹ nhàng, sâu lắng',
          color: '#FF9F1C',
          songCount: 132 
        },
        5: { 
          id: 5, 
          name: 'Jazz', 
          description: 'Jazz tinh tế và sang trọng',
          color: '#9D4EDD',
          songCount: 98 
        },
        6: { 
          id: 6, 
          name: 'Electronic', 
          description: 'Electronic sôi động',
          color: '#06D6A0',
          songCount: 156 
        },
      };
      
      const genreId = parseInt(id);
      const selectedGenre = genreData[genreId] || {
        id: genreId,
        name: 'Unknown',
        description: 'Thể loại nhạc',
        color: '#666',
        songCount: 0
      };
      
      // Lấy danh sách bài hát từ service
      const songsData = await getGenreSongs(genreId);
      console.log('Songs data:', songsData);
      
      setGenre(selectedGenre);
      setSongs(songsData.result || []);
      
      // Cập nhật số lượng bài hát thực tế
      if (songsData.result?.length) {
        setGenre(prev => ({
          ...prev,
          songCount: songsData.total || songsData.result.length
        }));
      }
      
    } catch (error) {
      console.error('Error fetching genre:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // ... phần còn lại giữ nguyên
  if (loading) {
    return (
      <div className="genre-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="genre-page not-found">
        <h2>Thể loại không tồn tại</h2>
      </div>
    );
  }

  return (
    <div className="genre-page">
      {/* Header với màu thể loại */}
      <div 
        className="genre-header"
        style={{ backgroundColor: genre.color }}
      >
        <div className="genre-header-content">
          <h1 className="genre-title">{genre.name}</h1>
          <p className="genre-description">{genre.description}</p>
          <div className="genre-stats">
            <span className="stat-item">
              <strong>{genre.songCount}</strong> bài hát
            </span>
          </div>
        </div>
      </div>

      {/* Danh sách bài hát */}
      <div className="genre-content">
        <div className="section-header">
          <h2>Bài hát phổ biến</h2>
          <button className="btn-shuffle">
            Phát ngẫu nhiên
          </button>
        </div>
        
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <div className="no-songs">
            <p>Chưa có bài hát nào trong thể loại này</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GenrePage;