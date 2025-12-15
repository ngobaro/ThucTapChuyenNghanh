// FILE: src/pages/LibraryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPlaylists } from '../services/playlistService';
import { Music, ListMusic, Plus, Heart, Play } from 'lucide-react';
import './LibraryPage.css';

function LibraryPage() {
  const [playlists, setPlaylists] = useState([]);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [activeTab, setActiveTab] = useState('playlists');
  const navigate = useNavigate();

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      // Load playlists
      const mockPlaylists = [
        { id: 1, name: 'My Favorites', songCount: 25, color: '#1DB954' },
        { id: 2, name: 'Chill Vibes', songCount: 18, color: '#4ECDC4' },
        { id: 3, name: 'Workout Mix', songCount: 32, color: '#FF6B6B' },
        { id: 4, name: 'Study Focus', songCount: 22, color: '#9D4EDD' },
        { id: 5, name: 'Party Time', songCount: 28, color: '#FF9F1C' },
        { id: 6, name: 'Road Trip', songCount: 35, color: '#06D6A0' },
      ];
      setPlaylists(mockPlaylists);
      
      // Load favorite songs
      const mockFavoriteSongs = [
        { 
          id: 101, 
          title: 'Blinding Lights', 
          artist: 'The Weeknd', 
          album: 'After Hours',
          duration: '3:22',
          isFavorite: true,
          coverColor: '#8B0000'
        },
        { 
          id: 102, 
          title: 'Flowers', 
          artist: 'Miley Cyrus', 
          album: 'Endless Summer Vacation',
          duration: '3:20',
          isFavorite: true,
          coverColor: '#FF69B4'
        },
        { 
          id: 103, 
          title: 'Anti-Hero', 
          artist: 'Taylor Swift', 
          album: 'Midnights',
          duration: '3:20',
          isFavorite: true,
          coverColor: '#1E90FF'
        },
        { 
          id: 104, 
          title: 'As It Was', 
          artist: 'Harry Styles', 
          album: "Harry's House",
          duration: '2:47',
          isFavorite: true,
          coverColor: '#FFD700'
        },
        { 
          id: 105, 
          title: 'Bad Habit', 
          artist: 'Steve Lacy', 
          album: 'Gemini Rights',
          duration: '3:52',
          isFavorite: true,
          coverColor: '#32CD32'
        },
        { 
          id: 106, 
          title: 'Heat Waves', 
          artist: 'Glass Animals', 
          album: 'Dreamland',
          duration: '3:58',
          isFavorite: true,
          coverColor: '#FF4500'
        },
      ];
      
      setFavoriteSongs(mockFavoriteSongs);
      
    } catch (error) {
      console.error('Error loading library data:', error);
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  const handleCreatePlaylist = () => {
    // TODO: Implement create playlist logic
    console.log('Create new playlist');
  };

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Thư viện của tôi</h1> 
      </div>

      <div className="library-tabs">
        <button 
          className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          <ListMusic size={20} />
          Playlists
          <span className="tab-count">{playlists.length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Music size={20} />
          Bài hát yêu thích
          <span className="tab-count">{favoriteSongs.length}</span>
        </button>
      </div>

      <div className="library-content">
        {activeTab === 'playlists' && (
          <div className="playlists-section">
            <div className="section-header">
              <h2>Tất cả Playlists</h2>
              <button className="btn-create" onClick={handleCreatePlaylist}>
                <Plus size={18} />
                Tạo playlist mới
              </button>
            </div>
            
            <div className="playlists-grid">
              {playlists.map(playlist => (
                <div 
                  key={playlist.id} 
                  className="playlist-card"
                  onClick={() => handlePlaylistClick(playlist.id)}
                >
                  <div 
                    className="playlist-cover"
                    style={{ backgroundColor: playlist.color }}
                  >
                    <span className="playlist-icon">♫</span>
                  </div>
                  <div className="playlist-info">
                    <h3>{playlist.name}</h3>
                    <p>{playlist.songCount} bài hát</p>
                  </div>
                </div>
              ))}
              
              {/* Nút tạo playlist mới */}
              <div 
                className="playlist-card create-new"
                onClick={handleCreatePlaylist}
              >
                <div className="playlist-cover new-playlist">
                  <Plus size={32} />
                </div>
                <div className="playlist-info">
                  <h3>Tạo playlist mới</h3>
                  <p>Bắt đầu từ trống</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-section">
            {favoriteSongs.length > 0 ? (
              <>
                {/* Header giống AlbumsPage */}
                <div className="favorites-header">
                  <div className="header-icon">
                    <Heart size={48} />
                  </div>
                  <div className="header-info">
                    <span className="page-type">COLLECTION</span>
                    <h1>Bài hát yêu thích</h1>
                    <p>{favoriteSongs.length} bài hát đã thích</p>
                  </div>
                </div>

                {/* Grid hiển thị bài hát giống AlbumsPage */}
                <div className="favorites-grid">
                  {favoriteSongs.map(song => (
                    <div key={song.id} className="song-card">
                      <div 
                        className="song-cover"
                        style={{ backgroundColor: song.coverColor }}
                      >
                        <span className="song-icon">♪</span>
                        <button className="btn-play-overlay">
                          <Play size={24} />
                        </button>
                      </div>
                      <div className="song-info">
                        <h3 className="song-title">{song.title}</h3>
                        <p className="song-artist">{song.artist}</p>
                        <div className="song-meta">
                          <span className="song-album">{song.album}</span>
                          <span className="song-duration">{song.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Heart size={64} />
                <h2>Chưa có bài hát yêu thích</h2>
                <p>Nhấn vào biểu tượng trái tim để lưu bài hát vào đây</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}  

export default LibraryPage;