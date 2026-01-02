// FILE: demo/src/pages/AlbumsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAlbumsList } from '../../services/albumService';
import { Play } from 'lucide-react';
import './AlbumsPage.css';

function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlbumsList()
      .then(setAlbums)
      .catch(() => {
        // No fallback, just set empty
        setAlbums([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  const handlePlayAlbum = (album) => {
    console.log('Play album:', album.title);
  };

  if (loading) {
    return (
      <div className="albums-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="albums-page">
      <div className="page-header">
        <h1>Albums</h1>
        <p>Khám phá album mới và phổ biến</p>
      </div>

      <div className="albums-grid">
        {albums.map(album => (
          <div 
            key={album.id} 
            className="album-card"
            onClick={() => handleAlbumClick(album.id)}
          >
            <div 
              className="album-cover"
              style={{ backgroundColor: album.color }}
            >
              <div className="album-cover-content">
                <span className="album-icon">A</span>
              </div>
              <button 
                className="btn-play"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAlbum(album);
                }}
              >
                <Play size={24} />
              </button>
            </div>
            <div className="album-info">
              <h3 className="album-title">{album.title}</h3>
              <p className="album-artist">{album.artist}</p>
              <div className="album-meta">
                <span className="album-year">{album.year}</span>
                <span className="album-tracks">{album.tracks} bài</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {albums.length === 0 && (
        <div className="empty-state">
          <p>Chưa có album nào</p>
        </div>
      )}
    </div>
  );
}

export default AlbumsPage;