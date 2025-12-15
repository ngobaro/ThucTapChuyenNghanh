// FILE: demo/src/pages/PlaylistDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User, Plus } from 'lucide-react';
import SongList from '../components/music/SongList';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './PlaylistDetailPage.css';

function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState({});

  useEffect(() => {
    if (id) {
      fetchPlaylistData();
    }
  }, [id]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin playlist
      const playlistResponse = await api.get(API_ENDPOINTS.PLAYLIST_BY_ID(id));
      console.log('Playlist response:', playlistResponse.data);
      
      let playlistData = playlistResponse.data.result || playlistResponse.data;
      
      // Lấy user info của người tạo playlist
      let creatorName = 'Unknown User';
      if (playlistData.iduser) {
        try {
          const userResponse = await api.get(API_ENDPOINTS.USER_BY_ID(playlistData.iduser));
          const userData = userResponse.data.result || userResponse.data;
          creatorName = userData.username || userData.name || 'Unknown User';
        } catch (userError) {
          console.warn('Could not fetch creator info:', userError);
        }
      }
      
      // Lấy danh sách bài hát trong playlist
      const songsResponse = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(id));
      console.log('Playlist songs response:', songsResponse.data);
      
      let songsData = [];
      if (Array.isArray(songsResponse.data)) {
        songsData = songsResponse.data;
      } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
        songsData = songsResponse.data.result;
      }
      
      // Lấy artists để map
      const artistsResponse = await api.get(API_ENDPOINTS.ARTISTS);
      let artistsData = [];
      
      if (Array.isArray(artistsResponse.data)) {
        artistsData = artistsResponse.data;
      } else if (artistsResponse.data.result && Array.isArray(artistsResponse.data.result)) {
        artistsData = artistsResponse.data.result;
      }
      
      const artistsMap = {};
      artistsData.forEach(artist => {
        const artistId = artist.idartist || artist.id;
        const artistName = artist.artistname || artist.name || 'Unknown Artist';
        artistsMap[artistId] = artistName;
      });
      setArtists(artistsMap);
      
      // Lấy thông tin chi tiết của từng bài hát
      const detailedSongs = await Promise.all(
        songsData.map(async (playlistSong) => {
          try {
            const songId = playlistSong.idsong;
            const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
            const song = songResponse.data.result || songResponse.data;
            
            // Lấy artist name
            let artistName = 'Unknown Artist';
            if (song.idartist) {
              artistName = artistsMap[song.idartist] || 'Unknown Artist';
            }
            
            return {
              id: song.songId || song.id,
              title: song.title || 'Unknown Title',
              artist: artistName,
              album: song.idalbum || 'Single',
              duration: formatDuration(song.duration),
              coverUrl: song.avatar || '/default-cover.png'
            };
          } catch (error) {
            console.error(`Error fetching song ${playlistSong.idsong}:`, error);
            return null;
          }
        })
      );
      
      const validSongs = detailedSongs.filter(Boolean);
      
      // Tính tổng thời lượng
      const totalDuration = calculateTotalDuration(validSongs);
      
      setPlaylist({
        id: playlistData.idplaylist || playlistData.id,
        name: playlistData.name || 'Unknown Playlist',
        description: playlistData.description || 'Khám phá những bài hát tuyệt vời trong playlist này.',
        creator: creatorName,
        createdDate: formatDate(playlistData.createdDate || playlistData.createdAt),
        songCount: validSongs.length,
        duration: totalDuration,
        color: getRandomColor()
      });
      
      setSongs(validSongs);
      
    } catch (error) {
      console.error('Error fetching playlist:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    
    if (typeof duration === 'string') {
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          return `${parts[0]}:${parts[1]}`;
        }
        return duration;
      }
      return duration;
    }
    
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    return '00:00';
  };

  const calculateTotalDuration = (songs) => {
    let totalSeconds = 0;
    
    songs.forEach(song => {
      const duration = song.duration;
      if (duration && typeof duration === 'string' && duration.includes(':')) {
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
          totalSeconds += parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  };

  const getRandomColor = () => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      console.log('Play all songs in playlist:', playlist?.name);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      console.log('Shuffle play playlist:', playlist?.name);
    }
  };

  if (loading) {
    return (
      <div className="playlist-detail-page loading">
        <div className="spinner"></div>
        <p>Đang tải playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-detail-page not-found">
        <h2>Playlist không tồn tại</h2>
        <button onClick={() => navigate('/library')}>
          Quay lại thư viện
        </button>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page">
      <div className="playlist-header">
        <div 
          className="playlist-cover-large"
          style={{ backgroundColor: playlist.color }}
        >
          <span className="playlist-icon">♫</span>
        </div>
        
        <div className="playlist-info">
          <div className="playlist-badge">PLAYLIST</div>
          <h1 className="playlist-title">{playlist.name}</h1>
          <p className="playlist-description">{playlist.description}</p>
          
          <div className="playlist-meta">
            <span className="meta-item">
              <User size={16} />
              {playlist.creator}
            </span>
            <span className="meta-item">
              {playlist.songCount} bài hát
            </span>
            <span className="meta-item">
              <Clock size={16} />
              {playlist.duration}
            </span>
            <span className="meta-item">
              Tạo ngày {playlist.createdDate}
            </span>
          </div>
        </div>
      </div>

      <div className="playlist-controls">
        <button className="btn-play-large" onClick={handlePlayAll}>
          <Play size={24} />
          Phát tất cả
        </button>
        <button className="btn-shuffle" onClick={handleShufflePlay}>
          <Shuffle size={20} />
          Trộn bài
        </button>
        <button className="btn-like">
          <Heart size={20} />
        </button>
        <button className="btn-more">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="playlist-content">
        <div className="section-header">
          <h2>Danh sách bài hát</h2>
          <span className="song-count">{songs.length} bài hát</span>
        </div>
        
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <div className="no-songs">
            <p>Chưa có bài hát nào trong playlist này</p>
            <button className="btn-add-songs">
              <Plus size={16} />
              Thêm bài hát
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistDetailPage;