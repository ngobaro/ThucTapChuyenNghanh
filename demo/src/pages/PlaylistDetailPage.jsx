// FILE: demo/src/pages/PlaylistDetailPage.jsx
// Updated: Added delete playlist button in controls. Confirm dialog, call DELETE /playlists/{id}, navigate back.
// Only for owner (backend checks). Refresh on success.
// Additional: Fetch and map album names properly (consistent with HomePage). Added loadAlbums and albumMap.
// Fixed: Artist mapping now handles multiple artists via artist-song relationships (loadArtistSongs, like HomePage).

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User, Loader2, Trash2 } from 'lucide-react';
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
  const [error, setError] = useState(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);
  const [albumMap, setAlbumMap] = useState({});  // State cho albumMap

  useEffect(() => {
    if (id) fetchPlaylistData();
  }, [id]);

  // Lấy tất cả artists một lần để tránh multiple requests (consistent with HomePage)
  const loadArtists = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTISTS);
      console.log('Artists response:', response.data);
      
      const artistsMap = {};
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
        artistsMap[artistId] = artistName;
      });
      
      console.log('Artists map:', artistsMap);
      return artistsMap;
    } catch (err) {
      console.warn('Error loading artists:', err);
      return {};
    }
  };

  // Lấy artist-song relationships (mới, consistent with HomePage)
  const loadArtistSongs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      console.log('Artist songs response:', response.data);
      
      const artistSongMap = {};
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
          if (!artistSongMap[songId]) {
            artistSongMap[songId] = [];
          }
          artistSongMap[songId].push(artistId);
        }
      });
      
      console.log('Artist song map:', artistSongMap);
      return artistSongMap;
    } catch (err) {
      console.warn('Error loading artist songs:', err);
      return {};
    }
  };

  // Thêm hàm loadAlbums (tương tự HomePage)
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

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load playlist songs, artists, artist-songs, albums parallel
      const [playlistRes, songsRes, artistsMap, artistSongMap, albumMapTemp] = await Promise.all([
        api.get(API_ENDPOINTS.PLAYLIST_BY_ID(id)),
        api.get(API_ENDPOINTS.PLAYLIST_SONGS(id)),
        loadArtists(),
        loadArtistSongs(),
        loadAlbums()
      ]);

      // Set albumMap vào state
      setAlbumMap(albumMapTemp);

      // Playlist info (fallback result/data)
      const playlistData = playlistRes.data.result || playlistRes.data;
      if (!playlistData) throw new Error('Playlist not found');

      // Fetch creator name
      let creatorName = 'Unknown User';
      if (playlistData.iduser) {
        try {
          const userRes = await api.get(API_ENDPOINTS.USER_BY_ID(playlistData.iduser));
          const user = userRes.data.result || userRes.data;
          creatorName = user.username || 'Unknown User';
        } catch (e) {
          console.warn('Creator fetch failed:', e);
        }
      }

      // Raw songs from playlist (fallback result/data/data)
      let rawSongs = songsRes.data.result || songsRes.data.data || songsRes.data || [];
      if (!Array.isArray(rawSongs)) rawSongs = [];

      // Fetch full song details parallel (with error handling per song)
      const detailedSongsPromises = rawSongs.map(async (item) => {
        const songId = item.idsong || item.songId;
        if (!songId) return null;

        try {
          const songRes = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          const song = songRes.data.result || songRes.data;
          if (!song) return null;

          // Genre from song (fallback)
          const genreId = song.idgenre || song.genreId || song.genre_id || 1; // Default Pop
          const genreName = getGenreName(genreId);
          const genreColor = getGenreColor(genreId);

          // SỬA ARTIST MAPPING: Handle multiple artists via artistSongMap (như HomePage)
          const artistIds = artistSongMap[songId] || [];
          const artistNames = artistIds
            .map(aId => artistsMap[aId] || 'Unknown Artist')
            .filter(name => name)
            .join(', ');
          const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

          // LẤY TÊN ALBUM: Map từ idalbum
          const albumId = song.idalbum || song.albumId;  // Fallback nếu tên trường khác
          const albumName = albumMapTemp[albumId] || null;
          
          // FALLBACK: Nếu không có album, dùng `${title} (${artistName})`
          const finalAlbum = albumName || `${song.title || 'Unknown'} (${artistName})`;

          return {
            id: song.songId || song.id || songId,
            title: song.title || 'Unknown Title',
            artist: artistName,  // SỬA: Multiple artists nếu có
            album: finalAlbum,
            duration: song.duration, // Keep raw for parse in SongList
            coverUrl: song.avatar || song.cover || song.image || '/default-cover.png',
            audioUrl: song.path || song.url || song.audio_url || '',
            views: song.views || song.listens || 0,
            genreId,
            genreName,
            genreColor,
            releaseDate: song.releasedate || song.release_date,
          };
        } catch (err) {
          console.error(`Song ${songId} fetch error:`, err);
          return null;
        }
      });

      const detailedSongs = await Promise.all(detailedSongsPromises);
      const validSongs = detailedSongs.filter(Boolean);
      const totalDuration = calculateTotalDuration(validSongs);

      setPlaylist({
        id: playlistData.idplaylist || playlistData.id,
        name: playlistData.nameplaylist || playlistData.name || 'Playlist',
        description: playlistData.description || 'Khám phá playlist này',
        creator: creatorName,
        createdDate: formatDate(playlistData.createdDate || playlistData.createdAt || new Date()),
        songCount: validSongs.length,
        duration: totalDuration,
        color: getPlaylistColor(id) // Consistent random color based on ID
      });

      setSongs(validSongs);
    } catch (error) {
      console.error('Playlist fetch error:', error);
      setError('Không thể tải playlist. Vui lòng thử lại.');
      setTimeout(() => navigate('/library'), 2000); // Auto redirect on error
    } finally {
      setLoading(false);
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async () => {
    if (!confirm('Bạn có chắc muốn xóa playlist này? Hành động không thể hoàn tác!')) return;

    setDeletingPlaylist(true);
    try {
      await api.delete(API_ENDPOINTS.PLAYLIST_BY_ID(playlist.id));
      alert('Đã xóa playlist!');
      navigate('/library');
    } catch (err) {
      console.error('Delete playlist error:', err);
      alert('Có lỗi khi xóa playlist: ' + (err.response?.data?.message || 'Thử lại'));
    } finally {
      setDeletingPlaylist(false);
    }
  };

  // playQueue stub (nếu chưa có, có thể implement ở global context hoặc player service)
  const playQueue = (songList, startIndex) => {
    console.log('Play queue:', songList, 'starting at', startIndex);
    // TODO: Integrate with global player: e.g., dispatch play action
    // For now, just log
  };

  const getGenreName = (id) => {
    const map = { 1: 'Pop', 2: 'Hip Hop', 3: 'Rock', 4: 'R&B', 5: 'Jazz', 6: 'Electronic', 7: 'Country', 8: 'Indie' };
    return map[id] || 'Khác';
  };

  const getGenreColor = (id) => {
    const colors = { 1: '#1DB954', 2: '#FF6B6B', 3: '#4ECDC4', 4: '#FF9F1C', 5: '#9D4EDD', 6: '#06D6A0', 7: '#118AB2', 8: '#FFD166' };
    return colors[id] || '#888';
  };

  const getPlaylistColor = (id) => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
    const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
    return colors[index];
  };

  const formatDuration = (d) => {
    if (!d) return '00:00';
    if (typeof d === 'string' && d.includes(':')) {
      const p = d.split(':');
      if (p.length === 3) {
        // Xử lý đúng định dạng HH:MM:SS -> MM:SS
        return `${p[1].padStart(2, '0')}:${p[2].padStart(2, '0')}`;
      }
      if (p.length === 2) {
        return `${p[0].padStart(2, '0')}:${p[1].padStart(2, '0')}`;
      }
      return d;
    }
    if (typeof d === 'number') {
      const m = Math.floor(d / 60);
      const s = d % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return '00:00';
  };

  const calculateTotalDuration = (songs) => {
    let totalSeconds = 0;
    songs.forEach(s => {
      const rawDuration = s.duration;
      if (typeof rawDuration === 'number') {
        totalSeconds += rawDuration;
      } else if (typeof rawDuration === 'string' && rawDuration.includes(':')) {
        const parts = rawDuration.split(':').map(Number);
        if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
        else if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
  };

  const formatDate = (d) => {
    if (!d) return 'Không rõ';
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="playlist-detail-page loading">
        <Loader2 size={48} className="spinner" />
        <p>Đang tải playlist...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="playlist-detail-page not-found">
        <h2>Playlist không tồn tại</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/library')}>Quay lại thư viện</button>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page">
      <div className="playlist-header">
        <div className="playlist-cover-large" style={{ backgroundColor: playlist.color }}>
          <span className="playlist-icon">♫</span>
        </div>
        <div className="playlist-info">
          <div className="playlist-badge">PLAYLIST</div>
          <h1 className="playlist-title">{playlist.name}</h1>
          <p className="playlist-description">{playlist.description}</p>
          <div className="playlist-meta">
            <span className="meta-item"><User size={16} />{playlist.creator}</span>
            <span className="meta-item">{playlist.songCount} bài hát</span>
            <span className="meta-item"><Clock size={16} />{playlist.duration}</span>
            <span className="meta-item">Tạo ngày {playlist.createdDate}</span>
          </div>
        </div>
      </div>

      <div className="playlist-controls">
        <button className="btn-play-large" onClick={() => playQueue(songs, 0)}>
          <Play size={24} /> Phát tất cả
        </button>
        <button className="btn-shuffle" onClick={() => playQueue(songs, Math.floor(Math.random() * songs.length))}>
          <Shuffle size={20} /> Trộn bài
        </button>
        <button className="btn-like"><Heart size={20} /></button>
        <button className="btn-more"><MoreVertical size={20} /></button>
        <button 
          className="btn-delete-playlist" 
          onClick={handleDeletePlaylist}
          disabled={deletingPlaylist}
          style={{ opacity: deletingPlaylist ? 0.5 : 1 }}
        >
          {deletingPlaylist ? (
            <Loader2 size={20} className="spinner" />
          ) : (
            <Trash2 size={20} />
          )}
          Xóa playlist
        </button>
      </div>

      <div className="playlist-content">
        <div className="section-header">
          <h2>Danh sách bài hát</h2>
          <span className="song-count">{songs.length} bài</span>
        </div>
        <SongList 
          songs={songs} 
          title="" 
          showGenre={true} 
          playlistId={playlist.id} // Pass playlistId for delete in SongList
        />
      </div>
    </div>
  );
}

export default PlaylistDetailPage;