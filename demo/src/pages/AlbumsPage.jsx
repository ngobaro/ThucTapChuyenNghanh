// FILE: demo/src/pages/AlbumsPage.jsx

import { useState, useEffect } from 'react';
import './AlbumsPage.css';

function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      // TODO: Fetch albums từ API
      // const response = await api.get('/albums');
      
      // Dữ liệu mẫu
      const mockAlbums = [
        { 
          id: 1, 
          title: 'Midnights', 
          artist: 'Taylor Swift', 
          year: 2022,
          tracks: 13,
          image: '/album-1.jpg' 
        },
        { 
          id: 2, 
          title: '÷', 
          artist: 'Ed Sheeran', 
          year: 2017,
          tracks: 16,
          image: '/album-2.jpg' 
        },
        { 
          id: 3, 
          title: '30', 
          artist: 'Adele', 
          year: 2021,
          tracks: 12,
          image: '/album-3.jpg' 
        },
      ];
      
      setAlbums(mockAlbums);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
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
          <div key={album.id} className="album-card">
            <div className="album-cover">
              <img 
                src={album.image || '/default-album.jpg'} 
                alt={album.title}
              />
              <button className="btn-play">▶</button>
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
    </div>
  );
}

export default AlbumsPage;