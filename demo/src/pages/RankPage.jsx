// FILE: demo/src/pages/RankPage.jsx
import { useState, useEffect } from 'react';
import SongCard from '../components/music/SongCard';
import { getAllSongs } from '../services/songService';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './RankPage.css';

function RankPage() {
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState({});

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setLoading(true);
      
      // Lấy tất cả bài hát
      const response = await getAllSongs();
      console.log('Rank page songs response:', response);
      
      // Xác định dạng dữ liệu trả về
      const allSongs = Array.isArray(response) ? response : 
                     response.result || response.data || [];
      
      console.log('All songs for ranking:', allSongs);
      
      // Lấy artists để map tên
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
      
      // Lấy artist-song relationships
      const artistSongsResponse = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      let artistSongsData = [];
      
      if (Array.isArray(artistSongsResponse.data)) {
        artistSongsData = artistSongsResponse.data;
      } else if (artistSongsResponse.data.result && Array.isArray(artistSongsResponse.data.result)) {
        artistSongsData = artistSongsResponse.data.result;
      }
      
      const artistSongMap = {};
      artistSongsData.forEach(item => {
        const songId = item.idsong;
        const artistId = item.idartist;
        
        if (songId && artistId) {
          if (!artistSongMap[songId]) {
            artistSongMap[songId] = [];
          }
          artistSongMap[songId].push(artistId);
        }
      });
      
      // Xử lý dữ liệu bài hát với artist names
      const processedSongs = allSongs.map(song => {
        const songId = song.songId || song.id;
        const artistIds = artistSongMap[songId] || [];
        
        // Lấy artist names từ artistIds
        const artistNames = artistIds
          .map(id => artistsMap[id] || 'Unknown Artist')
          .filter(name => name)
          .join(', ');
        
        const artistName = artistNames || song.artist || 'Unknown Artist';
        
        // Giả lập views cho ranking (trong thực tế lấy từ backend)
        const views = song.views || Math.floor(Math.random() * 100000);
        
        return {
          id: songId,
          title: song.title || 'Unknown Title',
          artist: artistName,
          album: song.idalbum || 'Single',
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          views: views,
          releaseDate: song.releasedate,
          color: getRandomColor()
        };
      });
      
      console.log('Processed songs for ranking:', processedSongs);
      
      // Sắp xếp theo views để lấy trending
      const sortedByViews = [...processedSongs].sort((a, b) => b.views - a.views);
      
      // Sắp xếp theo release date để lấy new releases
      const sortedByDate = [...processedSongs].sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
        return dateB - dateA;
      });
      
      setTrendingSongs(sortedByViews.slice(0, 8));
      setNewReleases(sortedByDate.slice(0, 6));
      
    } catch (error) {
      console.error('Error fetching discover data:', error);
      
      // Fallback data
      const fallbackSongs = [
        { 
          id: 1, 
          title: 'Blinding Lights', 
          artist: 'The Weeknd', 
          coverUrl: '/default-cover.png',
          color: '#8B0000',
          views: 45000
        },
        { 
          id: 2, 
          title: 'Flowers', 
          artist: 'Miley Cyrus', 
          coverUrl: '/default-cover.png',
          color: '#FF69B4',
          views: 38000
        },
        { 
          id: 3, 
          title: 'Stay', 
          artist: 'The Kid LAROI, Justin Bieber', 
          coverUrl: '/default-cover.png',
          color: '#1E90FF',
          views: 32000
        },
        { 
          id: 4, 
          title: 'Bad Habit', 
          artist: 'Steve Lacy', 
          coverUrl: '/default-cover.png',
          color: '#32CD32',
          views: 28000
        },
        { 
          id: 5, 
          title: 'Anti-Hero', 
          artist: 'Taylor Swift', 
          coverUrl: '/default-cover.png',
          color: '#FFD700',
          views: 25000
        },
        { 
          id: 6, 
          title: 'As It Was', 
          artist: 'Harry Styles', 
          coverUrl: '/default-cover.png',
          color: '#FF4500',
          views: 22000
        },
      ];
      
      setTrendingSongs(fallbackSongs.slice(0, 8));
      setNewReleases(fallbackSongs.slice(0, 6));
    } finally {
      setLoading(false);
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

  const getRandomColor = () => {
    const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return (
      <div className="rank-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="rank-page">
      <div className="page-header">
        <h1>Bảng xếp hạng</h1>
        <p>Top bài hát phổ biến nhất hiện nay</p>
      </div>

      {/* Trending Section */}
      <section className="rank-section">
        <div className="section-header">
          <h2>Trending Now 🔥</h2>
          <button className="btn-view-all">Xem tất cả</button>
        </div>
        <div className="song-grid">
          {trendingSongs.map((song, index) => (
            <SongCard 
              key={song.id} 
              song={{
                id: song.id,
                title: song.title,
                artist: song.artist,
                coverUrl: song.coverUrl,
                color: song.color,
                rank: index + 1, // Thêm rank cho card
                views: song.views // Thêm views cho card
              }} 
            />
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section className="rank-section">
        <div className="section-header">
          <h2>Mới phát hành ✨</h2>
        </div>
        <div className="song-grid">
          {newReleases.map(song => (
            <SongCard 
              key={song.id} 
              song={{
                id: song.id,
                title: song.title,
                artist: song.artist,
                coverUrl: song.coverUrl,
                color: song.color,
                isNew: true // Đánh dấu là new release
              }} 
            />
          ))}
        </div>
      </section>

    </div>
  );
}

export default RankPage;