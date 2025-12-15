// FILE: demo/src/pages/HomePage.jsx

import { useEffect, useState } from 'react';
import SongCard from '../components/music/SongCard';
import SongList from '../components/music/SongList';
import { getAllSongs } from '../services/songService';
import api from '../services/api';
import './HomePage.css';

function HomePage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artistCache, setArtistCache] = useState({}); // Cache cho artist

  useEffect(() => {
    loadSongs();
  }, []);

  // Function để fetch artist name từ ID
  const getArtistName = async (artistId) => {
    // Kiểm tra cache trước
    if (artistCache[artistId]) {
      return artistCache[artistId];
    }
    
    try {
      const artistResponse = await api.get(`/artists/${artistId}`);
      console.log(`Artist response for ID ${artistId}:`, artistResponse.data);
      
      let artistName = 'Unknown Artist';
      
      // QUAN TRỌNG: API trả về artistname, không phải name
      if (artistResponse.data) {
        // Có thể response trực tiếp là object artist
        if (artistResponse.data.artistname) {
          artistName = artistResponse.data.artistname;
        } 
        // Hoặc response có cấu trúc { result: { artistname: ... } }
        else if (artistResponse.data.result?.artistname) {
          artistName = artistResponse.data.result.artistname;
        }
        // Hoặc có trường name
        else if (artistResponse.data.name) {
          artistName = artistResponse.data.name;
        }
        else if (artistResponse.data.result?.name) {
          artistName = artistResponse.data.result.name;
        }
      }
      
      console.log(`Extracted artist name for ID ${artistId}: ${artistName}`);
      
      // Lưu vào cache
      setArtistCache(prev => ({
        ...prev,
        [artistId]: artistName
      }));
      
      return artistName;
    } catch (err) {
      console.warn(`Could not fetch artist ${artistId}:`, err.message);
      return 'Unknown Artist';
    }
  };

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await getAllSongs();
      console.log('API response structure:', response);
      
      const songsData = response.result || [];
      console.log('Raw songs data:', songsData);
      
      // Tối ưu: Lấy tất cả artist IDs trước
      const artistPromises = songsData.map(async (song) => {
        const songId = song.songId;
        
        try {
          const artistSongResponse = await api.get(`/artistsongs/song/${songId}`);
          console.log(`ArtistSong for song ${songId}:`, artistSongResponse.data);
          
          if (artistSongResponse.data?.result && artistSongResponse.data.result.length > 0) {
            const artistSong = artistSongResponse.data.result[0];
            return {
              songId,
              artistId: artistSong.idartist
            };
          }
        } catch (err) {
          console.warn(`No artist for song ${songId}:`, err.message);
        }
        return { songId, artistId: null };
      });
      
      const artistLinks = await Promise.all(artistPromises);
      console.log('Artist links:', artistLinks);
      
      // Lấy tất cả unique artist IDs
      const uniqueArtistIds = [...new Set(artistLinks
        .filter(link => link.artistId)
        .map(link => link.artistId)
      )];
      console.log('Unique artist IDs:', uniqueArtistIds);
      
      // Fetch tất cả artist names một lần
      const artistNamePromises = uniqueArtistIds.map(async (artistId) => {
        const name = await getArtistName(artistId);
        return { artistId, name };
      });
      
      const artistNames = await Promise.all(artistNamePromises);
      const artistMap = {};
      artistNames.forEach(item => {
        artistMap[item.artistId] = item.name;
      });
      console.log('Artist map:', artistMap);
      
      // Map songs với artist names
      const songsWithArtists = songsData.map((song, index) => {
        const artistLink = artistLinks.find(link => link.songId === song.songId);
        const artistName = artistLink?.artistId ? 
                          (artistMap[artistLink.artistId] || 'Unknown Artist') : 
                          'Unknown Artist';
        
        return {
          id: song.songId,
          title: song.title || `Song ${index + 1}`,
          artist: artistName,
          album: song.idalbum || 'Single',
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          audioUrl: song.path || '',
          views: song.views || '0',
          releaseDate: song.releasedate
        };
      });
      
      console.log('Final songs with artists:', songsWithArtists);
      setSongs(songsWithArtists);
    } catch (err) {
      console.error('Error loading songs:', err);
      setError('Không thể tải danh sách bài hát');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format duration
  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    
    if (typeof duration === 'string') {
      // Format: "04:12:00" -> "04:12"
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          // Bỏ phần giây
          return `${parts[0]}:${parts[1]}`;
        }
        return duration;
      }
      return duration;
    }
    
    return '00:00';
  };

  // Phiên bản đơn giản hơn nếu muốn
  const loadSongsSimple = async () => {
    try {
      setLoading(true);
      const response = await getAllSongs();
      const songsData = response.result || [];
      
      // Map songs với artist (fetch tuần tự để dễ debug)
      const songsWithArtists = [];
      
      for (const song of songsData) {
        const songId = song.songId;
        let artistName = 'Unknown Artist';
        
        try {
          // 1. Lấy artist-song relationship
          const artistSongResponse = await api.get(`/artistsongs/song/${songId}`);
          console.log(`Song ${songId} artist data:`, artistSongResponse.data);
          
          if (artistSongResponse.data?.result && artistSongResponse.data.result.length > 0) {
            const artistId = artistSongResponse.data.result[0].idartist;
            console.log(`Found artistId ${artistId} for song ${songId}`);
            
            // 2. Lấy artist name
            if (artistId) {
              const artistResponse = await api.get(`/artists/${artistId}`);
              console.log(`Artist ${artistId} data:`, artistResponse.data);
              
              // QUAN TRỌNG: Sử dụng đúng key 'artistname'
              if (artistResponse.data?.artistname) {
                artistName = artistResponse.data.artistname;
              } else if (artistResponse.data?.result?.artistname) {
                artistName = artistResponse.data.result.artistname;
              }
              console.log(`Artist name for song ${songId}: ${artistName}`);
            }
          }
        } catch (err) {
          console.warn(`Error processing song ${songId}:`, err.message);
        }
        
        songsWithArtists.push({
          id: songId,
          title: song.title || 'Unknown Title',
          artist: artistName,
          album: song.idalbum || 'Single',
          duration: formatDuration(song.duration),
          coverUrl: song.avatar || '/default-cover.png',
          audioUrl: song.path || ''
        });
      }
      
      console.log('Processed songs:', songsWithArtists);
      setSongs(songsWithArtists);
    } catch (err) {
      console.error('Error loading songs:', err);
      setError('Không thể tải danh sách bài hát');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải bài hát...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button className="btn-retry" onClick={loadSongs}>
          Thử lại
        </button>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="empty-state">
        <p>Chưa có bài hát nào</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>🎵 Chào mừng đến Music Web</h1>
        <p>Khám phá hàng triệu bài hát yêu thích của bạn</p>
      </section>

      {/* Trending Cards - Grid Layout */}
      {/* <section className="section">
        <h2>Trending Now 🔥</h2>
        <div className="song-grid">
          {songs.slice(0, 6).map(song => (
            <SongCard 
              key={song.id} 
              song={song}
            />
          ))}
        </div>
      </section> */}

      {/* All Songs - Table Layout */}
      <section className="section">
        <h2>Tất cả bài hát</h2>
        <SongList songs={songs} />
      </section>
    </div>
  );
}

export default HomePage;