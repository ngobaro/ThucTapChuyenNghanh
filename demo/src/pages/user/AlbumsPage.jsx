// FILE: demo/src/pages/AlbumsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { Play } from 'lucide-react';
import './AlbumsPage.css';

function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      
      // Load albums và artists parallel
      const [albumsResponse, artistsResponse] = await Promise.all([
        api.get(API_ENDPOINTS.ALBUMS),
        api.get(API_ENDPOINTS.ARTISTS)
      ]);
      
      console.log('Albums response:', albumsResponse.data);
      console.log('Artists response:', artistsResponse.data);
      
      // Process artists
      const artistsMap = {};
      let artistsData = [];
      
      if (Array.isArray(artistsResponse.data)) {
        artistsData = artistsResponse.data;
      } else if (artistsResponse.data.result && Array.isArray(artistsResponse.data.result)) {
        artistsData = artistsResponse.data.result;
      }
      
      artistsData.forEach(artist => {
        const artistId = artist.idartist || artist.id;
        const artistName = artist.artistname || artist.name || 'Unknown Artist';
        artistsMap[artistId] = artistName;
      });
      
      // Process albums
      let albumsData = [];
      
      if (Array.isArray(albumsResponse.data)) {
        albumsData = albumsResponse.data;
      } else if (albumsResponse.data.result && Array.isArray(albumsResponse.data.result)) {
        albumsData = albumsResponse.data.result;
      }
      
      // Get songs count for each album (using artist since no direct album-song relation)
      const albumsWithSongs = await Promise.all(
        albumsData.map(async (album) => {
          try {
            const artistId = album.idartist;
            const songsResponse = await api.get(API_ENDPOINTS.SONGS, {
              params: { artist: artistId }
            });
            
            let songs = [];
            if (Array.isArray(songsResponse.data)) {
              songs = songsResponse.data;
            } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
              songs = songsResponse.data.result;
            }
            
            // Get artist name
            const artistName = artistId ? artistsMap[artistId] : 'Unknown Artist';
            
            return {
              id: album.idalbum || album.id,
              title: album.albumname || album.title || 'Unknown Album',
              artist: artistName,
              year: album.releaseyear || album.year || new Date().getFullYear(),
              tracks: songs.length,
              coverUrl: album.cover || album.avatar || '/default-album.jpg',
              color: getRandomColor()
            };
          } catch (error) {
            console.error(`Error loading songs for album ${album.idalbum}:`, error);
            return {
              id: album.idalbum || album.id,
              title: album.albumname || album.title || 'Unknown Album',
              artist: 'Unknown Artist',
              year: album.releaseyear || album.year || new Date().getFullYear(),
              tracks: 0,
              coverUrl: album.cover || album.avatar || '/default-album.jpg',
              color: getRandomColor()
            };
          }
        })
      );
      
      setAlbums(albumsWithSongs);
      
    } catch (error) {
      console.error('Error loading albums:', error);
      // Fallback data
      setAlbums([
        { 
          id: 1, 
          title: 'After Hours', 
          artist: 'The Weeknd', 
          year: 2020,
          tracks: 14,
          coverUrl: '/default-album.jpg',
          color: '#8B0000'
        },
        { 
          id: 2, 
          title: 'Future Nostalgia', 
          artist: 'Dua Lipa', 
          year: 2020,
          tracks: 11,
          coverUrl: '/default-album.jpg',
          color: '#FF69B4'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRandomColor = () => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
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
                  console.log('Play album:', album.title);
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