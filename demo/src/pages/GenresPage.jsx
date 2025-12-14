// FILE: demo/src/pages/GenresPage.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GenresPage.css';

function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      // TODO: Fetch all genres từ API
      const mockGenres = [
        { id: 1, name: 'Pop', count: 245, color: '#1DB954', description: 'Nhạc Pop phổ biến' },
        { id: 2, name: 'Hip Hop', count: 189, color: '#FF6B6B', description: 'Hip Hop & Rap' },
        { id: 3, name: 'Rock', count: 167, color: '#4ECDC4', description: 'Rock cổ điển & hiện đại' },
        // ... thêm các thể loại khác
      ];
      setGenres(mockGenres);
    } catch (error) {
      console.error('Error fetching genres:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="page-header">
        <h1>Tất cả thể loại</h1>
        <p>Khám phá âm nhạc theo thể loại yêu thích</p>
      </div>

      <div className="genres-grid">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            to={`/genre/${genre.id}`}
            className="genre-card"
            style={{ 
              backgroundColor: `${genre.color}15`,
              borderColor: genre.color
            }}
          >
            <div className="genre-card-header">
              <div 
                className="genre-icon" 
                style={{ backgroundColor: genre.color }}
              >
                {genre.name.charAt(0)}
              </div>
              <span className="genre-count">{genre.count} bài</span>
            </div>
            <h3 className="genre-card-title">{genre.name}</h3>
            <p className="genre-card-description">{genre.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default GenresPage;