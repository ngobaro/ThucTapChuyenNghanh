// FILE: demo/src/pages/GenresPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './GenresPage.css';

function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.GENRES);
      console.log('Genres response:', response.data);

      let genresData = [];

      if (Array.isArray(response.data)) {
        genresData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        genresData = response.data.result;
      }

      // Get song count for each genre using dedicated endpoint
      const genresWithCounts = await Promise.all(
        genresData.map(async (genre) => {
          try {
            const songsResponse = await api.get(API_ENDPOINTS.GENRE_SONGS(genre.idgenre || genre.id));
            let songs = [];

            if (Array.isArray(songsResponse.data)) {
              songs = songsResponse.data;
            } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
              songs = songsResponse.data.result;
            } else if (songsResponse.data.data && Array.isArray(songsResponse.data.data)) {
              songs = songsResponse.data.data;
            }

            return {
              id: genre.idgenre || genre.id,
              name: genre.genrename || genre.name || 'Unknown Genre',
              count: songs.length,
              color: getColorByGenreId(genre.idgenre || genre.id),
              description: getDescriptionByGenre(genre.genrename || genre.name)
            };
          } catch (error) {
            console.error(`Error loading songs for genre ${genre.idgenre}:`, error);
            return {
              id: genre.idgenre || genre.id,
              name: genre.genrename || genre.name || 'Unknown Genre',
              count: 0,
              color: getColorByGenreId(genre.idgenre || genre.id),
              description: getDescriptionByGenre(genre.genrename || genre.name)
            };
          }
        })
      );

      setGenres(genresWithCounts);

    } catch (error) {
      console.error('Error loading genres:', error);
      // Fallback data
      setGenres([
        { id: 1, name: 'Pop', count: 245, color: '#1DB954', description: 'Nhạc Pop phổ biến' },
        { id: 2, name: 'Hip Hop', count: 189, color: '#FF6B6B', description: 'Hip Hop đỉnh cao' },
        { id: 3, name: 'Rock', count: 167, color: '#4ECDC4', description: 'Rock mạnh mẽ' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getColorByGenreId = (id) => {
    const colors = {
      1: '#1DB954',
      2: '#FF6B6B',
      3: '#4ECDC4',
      4: '#FF9F1C',
      5: '#9D4EDD',
      6: '#06D6A0',
      7: '#118AB2',
      8: '#FFD166'
    };
    return colors[id] || '#666';
  };

  const getDescriptionByGenre = (name) => {
    const descriptions = {
      'Pop': 'Nhạc Pop phổ biến nhất hiện nay',
      'Hip Hop': 'Hip Hop với beat mạnh mẽ',
      'Rock': 'Rock cá tính và sôi động',
      'R&B': 'R&B nhẹ nhàng, sâu lắng',
      'Jazz': 'Jazz tinh tế và nghệ thuật',
      'Electronic': 'EDM sôi động cho các bữa tiệc',
      'Country': 'Country dân dã, gần gũi',
      'Indie': 'Indie độc lập và sáng tạo'
    };
    return descriptions[name] || 'Khám phá âm nhạc theo thể loại này';
  };

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