// FILE: demo/src/pages/PlaylistDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User } from 'lucide-react';
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

  useEffect(() => {
    if (id) fetchPlaylistData();
  }, [id]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);

      const [playlistRes, songsRes, artistsRes] = await Promise.all([
        api.get(API_ENDPOINTS.PLAYLIST_BY_ID(id)),
        api.get(API_ENDPOINTS.PLAYLIST_SONGS(id)),
        api.get(API_ENDPOINTS.ARTISTS)
      ]);

      // Playlist info
      const playlistData = playlistRes.data.result || playlistRes.data;
      let creatorName = 'Unknown User';
      if (playlistData.iduser) {
        try {
          const userRes = await api.get(API_ENDPOINTS.USER_BY_ID(playlistData.iduser));
          creatorName = userRes.data.result?.username || 'Unknown User';
        } catch (e) { console.warn('Creator fetch failed'); }
      }

      // Artists map
      const artistsData = artistsRes.data.result || artistsRes.data.data || artistsRes.data || [];
      const artistsMap = {};
      artistsData.forEach(a => {
        artistsMap[a.idartist || a.id] = a.artistname || a.name || 'Unknown Artist';
      });

      // Songs in playlist
      let rawSongs = songsRes.data.result || songsRes.data.data || songsRes.data || [];
      if (!Array.isArray(rawSongs)) rawSongs = [];

      // Fetch full song details
      const detailedSongs = await Promise.all(
        rawSongs.map(async (item) => {
          const songId = item.idsong || item.songId;
          if (!songId) return null;

          try {
            const songRes = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
            const song = songRes.data.result || songRes.data;

            const genreId = song.idgenre || song.genreId;
            const genreName = getGenreName(genreId);
            const genreColor = getGenreColor(genreId);

            return {
              id: song.songId || song.id,
              title: song.title || 'Unknown Title',
              artist: artistsMap[song.idartist] || 'Unknown Artist',
              album: song.idalbum || 'Single',
              duration: formatDuration(song.duration),
              coverUrl: song.avatar || '/default-cover.png',
              audioUrl: song.path || '',
              views: song.views || 0,
              genreId,
              genreName,
              genreColor
            };
          } catch (err) {
            console.error('Song fetch error:', err);
            return null;
          }
        })
      );

      const validSongs = detailedSongs.filter(Boolean);
      const totalDuration = calculateTotalDuration(validSongs);

      setPlaylist({
        id: playlistData.idplaylist || playlistData.id,
        name: playlistData.name || 'Playlist',
        description: playlistData.description || 'Khám phá playlist này',
        creator: creatorName,
        createdDate: formatDate(playlistData.createdDate || playlistData.createdAt),
        songCount: validSongs.length,
        duration: totalDuration,
        color: getRandomColor()
      });

      setSongs(validSongs);
    } catch (error) {
      console.error('Playlist fetch error:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const getGenreName = (id) => {
    const map = { 1: 'Pop', 2: 'Hip Hop', 3: 'Rock', 4: 'R&B', 5: 'Jazz', 6: 'Electronic', 7: 'Country', 8: 'Indie' };
    return map[id] || 'Khác';
  };

  const getGenreColor = (id) => {
    const colors = { 1: '#1DB954', 2: '#FF6B6B', 3: '#4ECDC4', 4: '#FF9F1C', 5: '#9D4EDD', 6: '#06D6A0', 7: '#118AB2', 8: '#FFD166' };
    return colors[id] || '#888';
  };

  const formatDuration = (d) => {
    if (!d) return '00:00';
    if (typeof d === 'string' && d.includes(':')) {
      const p = d.split(':');
      return p.length === 3 ? `${p[1]}:${p[2]}` : d;
    }
    if (typeof d === 'number') {
      const m = Math.floor(d / 60);
      const s = d % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return '00:00';
  };

  const calculateTotalDuration = (songs) => {
    let total = 0;
    songs.forEach(s => {
      const parts = s.duration.split(':').map(Number);
      total += parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
    });
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'Unknown';

  const getRandomColor = () => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) return <div className="playlist-detail-page loading"><div className="spinner"></div><p>Đang tải...</p></div>;
  if (!playlist) return <div className="playlist-detail-page not-found"><h2>Playlist không tồn tại</h2><button onClick={() => navigate('/library')}>Quay lại</button></div>;

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
        <button className="btn-play-large"><Play size={24} /> Phát tất cả</button>
        <button className="btn-shuffle"><Shuffle size={20} /> Trộn bài</button>
        <button className="btn-like"><Heart size={20} /></button>
        <button className="btn-more"><MoreVertical size={20} /></button>
      </div>

      <div className="playlist-content">
        <div className="section-header">
          <h2>Danh sách bài hát</h2>
          <span className="song-count">{songs.length} bài</span>
        </div>
        {songs.length > 0 ? <SongList songs={songs} showGenre={true} /> : (
          <div className="no-songs"><p>Chưa có bài hát nào</p></div>
        )}
      </div>
    </div>
  );
}

export default PlaylistDetailPage;