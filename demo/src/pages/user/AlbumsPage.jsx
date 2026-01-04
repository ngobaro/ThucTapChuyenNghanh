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
      <div className="music-collection loading-view">
        <div className="loading-circle"></div>
      </div>
    );
  }

  return (
    <div className="music-collection">
      <div className="collection-top">
        <h1>Albums</h1>
        <p>Khám phá album mới và phổ biến</p>
      </div>

      <div className="collection-grid">
        {albums.map(album => (
          <div 
            key={album.id} 
            className="music-item"
            onClick={() => handleAlbumClick(album.id)}
          >
            <div 
              className="item-thumb"
              style={{ backgroundColor: album.color }}
            >
              <div className="thumb-content">
                <span className="thumb-text">Album</span>
              </div>
              <button 
                className="play-action"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAlbum(album);
                }}
              >
                <Play size={24} />
              </button>
            </div>
            <div className="item-details">
              <h3 className="item-title">{album.title}</h3>
              <p className="item-author">{album.artist}</p>
              <div className="item-meta">
                <span className="item-year">{album.year}</span>
                <span className="item-count">{album.tracks} bài</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {albums.length === 0 && (
        <div className="no-items">
          <p>Chưa có album nào</p>
        </div>
      )}
    </div>
  );
}

export default AlbumsPage;