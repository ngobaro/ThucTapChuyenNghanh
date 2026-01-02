// FILE: demo/src/services/rankService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getAllSongs } from './songService'; // Reuse existing song fetch

// Lấy tất cả artists (cache map)
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
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

    return artistsMap;
  } catch (error) {
    console.warn('Error loading artists:', error);
    return {};
  }
};

// Lấy artist-song relationships (map)
export const loadArtistSongMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
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

    return artistSongMap;
  } catch (error) {
    console.warn('Error loading artist songs:', error);
    return {};
  }
};

// Process songs với artist mapping
export const processSongsWithArtists = async (allSongs, artistsMap, artistSongMap) => {
  const processedSongs = allSongs.map(song => {
    const songId = song.songId || song.id;
    const artistIds = artistSongMap[songId] || [];

    const artistNames = artistIds
      .map(id => artistsMap[id] || 'Unknown Artist')
      .filter(name => name)
      .join(', ');

    const artistName = artistNames || song.artist || 'Unknown Artist';

    const views = song.views || Math.floor(Math.random() * 100000); // Giả lập nếu không có

    return {
      id: songId,
      title: song.title || 'Unknown Title',
      artist: artistName,
      album: song.idalbum || 'Single', // Có thể enhance sau nếu cần album name
      duration: formatDuration(song.duration),
      coverUrl: song.avatar || '/default-cover.png',
      views: views,
      releaseDate: song.releasedate,
      color: getRandomColor()
    };
  });

  return processedSongs;
};

// Fetch full rank data (trending + new releases)
export const fetchRankData = async () => {
  try {
    // Fetch songs
    const response = await getAllSongs();
    const allSongs = Array.isArray(response) ? response :
      response.result || response.data || [];

    if (allSongs.length === 0) {
      return { trendingSongs: [], newReleases: [] };
    }

    // Load artists và artist-songs parallel
    const [artistsMap, artistSongMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap()
    ]);

    // Process songs
    const processedSongs = await processSongsWithArtists(allSongs, artistsMap, artistSongMap);

    // Trending: Sort by views desc, top 12
    const trendingSongs = [...processedSongs]
      .sort((a, b) => b.views - a.views)
      .slice(0, 12);

    // New releases: Sort by releaseDate desc, top 6
    const newReleases = [...processedSongs]
      .sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 6);

    return { trendingSongs, newReleases };
  } catch (error) {
    console.error('Error fetching rank data:', error);
    return { trendingSongs: [], newReleases: [] }; // No mock, return empty
  }
};

// Utility functions
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