// FILE: demo/src/pages/GenresPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGenresList } from '../../services/genreService'; // Import từ service mới
import './GenresPage.css';

function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGenresList()
      .then(setGenres)
      .catch((error) => {
        console.error('Error loading genres:', error);
        setGenres([]); // Empty on error, no mock
      })
      .finally(() => {
        setLoading(false);
      });
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

      {genres.length === 0 && (
        <div className="empty-state">
          <p>Chưa có thể loại nào</p>
        </div>
      )}
    </div>
  );
}

export default GenresPage;