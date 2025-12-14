import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPlaylistById } from '../services/playlistService';
import SongList from '../components/music/SongList';
import { Play, MoreVertical } from 'lucide-react';
import './PlaylistPage.css';

function PlaylistPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    try {
      // Mock data
      const mockPlaylist = {
        id: id,
        name: 'My Awesome Playlist',
        description: 'The best songs ever',
        coverUrl: null,
        songs: [
          {
            id: 1,
            title: 'Song 1',
            artist: 'Artist 1',
            album: 'Album 1',
            duration: 240,
            coverUrl: null,
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
          }
        ]
      };
      setPlaylist(mockPlaylist);
      setLoading(false);
      
      // const data = await getPlaylistById(id);
      // setPlaylist(data);
    } catch (error) {
      console.error('Error loading playlist:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!playlist) {
    return <div className="error">Không tìm thấy playlist</div>;
  }

  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <img 
          src={playlist.coverUrl || '/default-playlist.png'} 
          alt={playlist.name}
          className="playlist-cover-large"
        />
        <div className="playlist-info">
          <span className="playlist-type">PLAYLIST</span>
          <h1>{playlist.name}</h1>
          <p>{playlist.description}</p>
          <span className="playlist-meta">
            {playlist.songs?.length || 0} bài hát
          </span>
        </div>
      </div>

      <div className="playlist-actions">
        <button className="btn-play-large">
          <Play size={24} />
          Phát
        </button>
        <button className="btn-icon">
          <MoreVertical size={24} />
        </button>
      </div>

      {playlist.songs && playlist.songs.length > 0 ? (
        <SongList songs={playlist.songs} />
      ) : (
        <div className="empty-playlist">
          <p>Playlist này chưa có bài hát nào</p>
        </div>
      )}
    </div>
  );
}

export default PlaylistPage;