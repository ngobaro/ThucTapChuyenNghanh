import { useState, useEffect } from 'react';
import api from '../services/api';
import { getMySongs } from '../services/songService';
import { getUserPlaylists } from '../services/playlistService';
import { API_ENDPOINTS } from '../utils/constants';
import SongCard from '../components/music/SongCard';
import SongList from '../components/music/SongList';
import './ProfilePage.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artistsMap, setArtistsMap] = useState({});
  const [albumMap, setAlbumMap] = useState({});
  const [artistSongMap, setArtistSongMap] = useState({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Lấy tất cả artists một lần (consistent with HomePage)
  const loadArtists = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTISTS);
      console.log('Artists response:', response.data);
      
      const artistsMapTemp = {};
      let artistsData = [];
      
      if (Array.isArray(response.data)) {
        artistsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        artistsData = response.data.result;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        artistsData = response.data.data;
      }
      
      artistsData.forEach(artist => {
        const artistId = artist.idartist || artist.id;
        const artistName = artist.artistname || artist.name || 'Unknown Artist';
        artistsMapTemp[artistId] = artistName;
      });
      
      console.log('Artists map:', artistsMapTemp);
      return artistsMapTemp;
    } catch (err) {
      console.warn('Error loading artists:', err);
      return {};
    }
  };

  // Lấy artist-song relationships
  const loadArtistSongs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      console.log('Artist songs response:', response.data);
      
      const artistSongMapTemp = {};
      let data = [];
      
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        data = response.data.result;
      }
      
      data.forEach(item => {
        const songId = item.idsong;
        const artistId = item.idartist;
        
        if (songId && artistId) {
          if (!artistSongMapTemp[songId]) {
            artistSongMapTemp[songId] = [];
          }
          artistSongMapTemp[songId].push(artistId);
        }
      });
      
      console.log('Artist song map:', artistSongMapTemp);
      return artistSongMapTemp;
    } catch (err) {
      console.warn('Error loading artist songs:', err);
      return {};
    }
  };

  // Lấy albums map
  const loadAlbums = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ALBUMS);
      console.log('Albums response:', response.data);
      
      const albumMapTemp = {};
      let albumsData = [];
      
      if (Array.isArray(response.data)) {
        albumsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        albumsData = response.data.result;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        albumsData = response.data.data;
      }
      
      albumsData.forEach(album => {
        const albumId = album.idalbum || album.id;
        const albumName = album.albumname || album.title || 'Unknown Album';
        albumMapTemp[albumId] = albumName;
      });
      
      console.log('Albums map:', albumMapTemp);
      return albumMapTemp;
    } catch (err) {
      console.warn('Error loading albums:', err);
      return {};
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load maps parallel
      const [artistsMapTemp, artistSongMapTemp, albumMapTemp] = await Promise.all([
        loadArtists(),
        loadArtistSongs(),
        loadAlbums()
      ]);
      setArtistsMap(artistsMapTemp);
      setArtistSongMap(artistSongMapTemp);
      setAlbumMap(albumMapTemp);

      // Fetch parallel, catch individual errors
      const userRes = await api.get(API_ENDPOINTS.MY_INFO).catch(() => ({ data: { result: null } }));
      const songsRes = await getMySongs().catch(() => ({ data: { result: [] } }));
      const playlistsRes = await getUserPlaylists().catch(() => ({ data: { result: [] } }));
      
      const fetchedUser = userRes.data.result || userRes.data || null;
      setUser(fetchedUser);

      // Process songs với mapping
      const rawSongsData = songsRes.data.result || songsRes.data || [];
      const processedSongs = rawSongsData.map(song => {
        const songId = song.songId || song.id;
        const artistIds = artistSongMapTemp[songId] || [];
        
        // Artist names
        const artistNames = artistIds
          .map(id => artistsMapTemp[id] || 'Unknown Artist')
          .filter(name => name)
          .join(', ');
        
        const artistName = artistNames || song.artist || 'Unknown Artist';
        
        // Album name
        const albumId = song.idalbum || song.albumId;
        const albumName = albumMapTemp[albumId] || null;
        const finalAlbum = albumName || `${song.title || 'Unknown'} (${artistName})`;
        
        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: artistName,
          album: finalAlbum,
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          audioUrl: song.path || '',
          views: song.views || 0,
          releaseDate: song.releasedate,
          genreId: song.genreId,
          color: getColorByGenre(song.genreId)
        };
      });
      
      // Sort by views descending cho "Bài hát phổ biến"
      const sortedSongs = processedSongs.sort((a, b) => b.views - a.views);
      setMySongs(sortedSongs);

      // Process playlists: Add songCount nếu chưa có (parallel fetch)
      let fetchedPlaylists = playlistsRes.data.result || playlistsRes.data || [];
      const playlistsWithCount = await Promise.all(
        fetchedPlaylists.map(async (playlist) => {
          if (playlist.songCount !== undefined) return { ...playlist, songCount: playlist.songCount };
          
          try {
            const songsRes = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(playlist.idplaylist || playlist.id));
            const songCount = (songsRes.data.result || songsRes.data || []).length;
            return { ...playlist, songCount };
          } catch (err) {
            console.warn(`Failed to fetch song count for playlist ${playlist.id}:`, err);
            return { ...playlist, songCount: 0 };
          }
        })
      );
      
      setMyPlaylists(playlistsWithCount);
      
      console.log('Profile data loaded:', { fetchedUser, sortedSongs: sortedSongs.length, playlistsWithCount: playlistsWithCount.length });
    } catch (err) {
      setError('Không thể tải dữ liệu profile: ' + err.message);
      console.error('Fetch profile error:', err.response?.data || err);
      setMySongs([]);
      setMyPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const getColorByGenre = (genreId) => {
    const colors = {
      1: '#1DB954', // Pop
      2: '#FF6B6B', // Hip Hop
      3: '#4ECDC4', // Rock
      4: '#FF9F1C', // R&B
      5: '#9D4EDD', // Jazz
      6: '#06D6A0', // Electronic
      7: '#118AB2', // Country
      8: '#FFD166', // Indie
    };
    return colors[genreId] || '#666';
  };

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    
    if (typeof duration === 'string') {
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          return `${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
        }
        if (parts.length === 2) {
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
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

  if (loading) {
    return <div className="loading">Đang tải profile...</div>;
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchProfileData}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img 
          src={user?.avatar || 'https://via.placeholder.com/150'} 
          alt="Avatar" 
          className="avatar" 
          onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
        />
        <div className="profile-info">
          <h1>{user?.username || 'User'}</h1>
          <p>{user?.email || 'email@example.com'}</p>
          <p>Tham gia từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '2024'}</p>
        </div>
      </div>

      <section className="section">
        <h2>My Playlists</h2>
        <div className="playlist-grid">
          {myPlaylists.length > 0 ? (
            myPlaylists.map(playlist => (
              <div key={playlist.id || playlist.idplaylist} className="playlist-card">
                <div 
                  className="playlist-cover" 
                  style={{ backgroundColor: getPlaylistColor(playlist.id || playlist.idplaylist) }}
                >
                  <span>♫</span>
                </div>
                <h3>{playlist.name || playlist.nameplaylist || 'Playlist không tên'}</h3>
                <p>{playlist.songCount || 0} bài hát</p>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Chưa có playlist nào</p>
              <button onClick={() => window.location.href = '/create-playlist'}>Tạo playlist đầu tiên</button>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Bài hát phổ biến</h2>
        {mySongs.length > 0 ? (
          <SongList songs={mySongs} title="" showGenre={true} />
        ) : (
          <div className="empty-state">
            <p>Chưa có bài hát phổ biến</p>
          </div>
        )}
      </section>

      <section className="section">
        <h2>Giỏ hàng</h2>
        <div className="song-grid">
          {mySongs.length > 0 ? (
            mySongs.slice(0, 8).map(song => (  // Limit to 8 for grid
              <SongCard key={song.id} song={song} />
            ))
          ) : (
            <div className="empty-state">
              <p>Giỏ hàng trống</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Helper cho playlist color
const getPlaylistColor = (id) => {
  const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
  const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
  return colors[index];
};

export default ProfilePage;