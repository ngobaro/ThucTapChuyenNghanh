import { useState, useEffect } from 'react';
import { getUserPlaylists } from '../services/playlistService';
import { Music, ListMusic, Plus } from 'lucide-react';
import './LibraryPage.css';

function LibraryPage() {
  const [playlists, setPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState('playlists');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      // Mock data
      const mockPlaylists = [
        { id: 1, name: 'My Favorites', songCount: 25, coverUrl: null },
        { id: 2, name: 'Chill Vibes', songCount: 18, coverUrl: null },
        { id: 3, name: 'Workout Mix', songCount: 32, coverUrl: null },
      ];
      setPlaylists(mockPlaylists);
      
      // const data = await getUserPlaylists();
      // setPlaylists(data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
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
        </button>
        <button 
          className={`tab ${activeTab === 'songs' ? 'active' : ''}`}
          onClick={() => setActiveTab('songs')}
        >
          <Music size={20} />
          Bài hát
        </button>
      </div>

      <div className="library-content">
        {activeTab === 'playlists' && (
          <div className="playlists-grid">
            {playlists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-cover">
                  <img 
                    src={playlist.coverUrl || '/default-playlist.png'} 
                    alt={playlist.name}
                  />
                </div>
                <h3>{playlist.name}</h3>
                <p>{playlist.songCount} bài hát</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'songs' && (
          <div className="songs-section">
            <p>Danh sách bài hát của bạn</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LibraryPage;