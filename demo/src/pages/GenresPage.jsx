// FILE: demo/src/pages/GenresPage.jsx

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './GenresPage.css';

function GenresPage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch genres từ API
    const fetchGenres = async () => {
      try {
        setLoading(true);
        // Dữ liệu mẫu
        const mockGenres = [
          { id: 1, name: 'Pop', count: 245, color: '#1DB954', description: 'Nhạc Pop phổ biến' },
          { id: 2, name: 'Hip Hop', count: 189, color: '#FF6B6B', description: 'Hip Hop đỉnh cao' },
          { id: 3, name: 'Rock', count: 167, color: '#4ECDC4', description: 'Rock mạnh mẽ' },
          { id: 4, name: 'EDM', count: 156, color: '#9D4EDD', description: 'EDM sôi động' },
          { id: 5, name: 'R&B', count: 132, color: '#FF9F1C', description: 'R&B nhẹ nhàng' },
          { id: 6, name: 'Acoustic', count: 98, color: '#06D6A0', description: 'Acoustic tinh tế' },
          { id: 7, name: 'Jazz', count: 87, color: '#118AB2', description: 'Jazz tinh tế' },
          { id: 8, name: 'Country', count: 76, color: '#FFD166', description: 'Country dân dã' },
          { id: 9, name: 'Classical', count: 65, color: '#EF476F', description: 'Nhạc cổ điển' },
          { id: 10, name: 'Reggae', count: 54, color: '#06D6A0', description: 'Reggae thoải mái' },
          { id: 11, name: 'Indie', count: 43, color: '#7209B7', description: 'Indie độc lập' },
          { id: 12, name: 'Metal', count: 32, color: '#333333', description: 'Metal mạnh mẽ' },
        ];
        
        setGenres(mockGenres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreClick = (genreId) => {
    navigate(`/genre/${genreId}`);
  };

  if (loading) {
    return (
      <div className="genres-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="genres-page">
      <div className="genres-header">
        <h1>Thể loại</h1>
        <p>Khám phá âm nhạc theo thể loại yêu thích của bạn</p>
      </div>

      <div className="genres-grid">
        {genres.map((genre) => (
          <div 
            key={genre.id}
            className="genre-card"
            onClick={() => handleGenreClick(genre.id)}
            style={{ backgroundColor: genre.color + '20' }}
          >
            <div className="genre-card-content">
              <h3 className="genre-name">{genre.name}</h3>
              <p className="genre-description">{genre.description}</p>
              <div className="genre-count">{genre.count} bài hát</div>
            </div>
            <div 
              className="genre-color-block"
              style={{ backgroundColor: genre.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default GenresPage;