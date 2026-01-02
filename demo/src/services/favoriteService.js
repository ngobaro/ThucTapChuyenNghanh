// FILE: demo/src/services/favoriteService.js (new for FavoritesPage)
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Load artists map
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let artistsData = [];
    if (Array.isArray(response.data)) artistsData = response.data;
    else if (response.data.result && Array.isArray(response.data.result)) artistsData = response.data.result;
    else if (response.data.data && Array.isArray(response.data.data)) artistsData = response.data.data;

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

// Load artist-song map
export const loadArtistSongMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
    const artistSongMap = {};
    let data = [];
    if (Array.isArray(response.data)) data = response.data;
    else if (response.data.result && Array.isArray(response.data.result)) data = response.data.result;

    data.forEach(item => {
      const songId = item.idsong;
      const artistId = item.idartist;
      if (songId && artistId) {
        if (!artistSongMap[songId]) artistSongMap[songId] = [];
        artistSongMap[songId].push(artistId);
      }
    });
    return artistSongMap;
  } catch (error) {
    console.warn('Error loading artist songs:', error);
    return {};
  }
};

// Get user ID
export const getUserId = async () => {
  let currentUserId = localStorage.getItem('userId');
  if (!currentUserId) {
    try {
      const userRes = await api.get(API_ENDPOINTS.MY_INFO);
      const userData = userRes.data?.result || userRes.data;
      currentUserId = userData?.id || userData?.userId;
      if (currentUserId) {
        localStorage.setItem('userId', currentUserId.toString());
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return null;
    }
  }
  return Number(currentUserId);
};

// Fetch favorite songs with processing
export const fetchFavoriteSongs = async (userId) => {
  try {
    const res = await api.get(API_ENDPOINTS.USER_FAVORITES(userId));
    const favSongs = res.data?.result || [];

    // Load maps parallel
    const [artistsMap, artistSongMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap()
    ]);

    const songs = favSongs.map(song => {
      const songId = song.songId || song.id;

      const artistIds = artistSongMap[songId] || [];
      const artistNames = artistIds
        .map(aId => artistsMap[aId] || 'Unknown Artist')
        .filter(name => name)
        .join(', ');
      const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

      return {
        id: songId,
        title: song.title || 'Unknown Title',
        artist: artistName,
        album: song.idalbum ? `Album ${song.idalbum}` : 'Single',
        duration: formatDuration(song.duration),
        coverUrl: song.avatar || '/default-cover.png',
        audioUrl: song.path || '',
        addedDate: new Date().toLocaleDateString('vi-VN'),
        genreId: song.genreId || 1,
        genreName: getGenreName(song.genreId),
        genreColor: getGenreColor(song.genreId)
      };
    });

    return songs;
  } catch (error) {
    console.error('Error fetching favorite songs:', error);
    throw error;
  }
};

// Remove favorite
export const removeFavorite = async (userId, songId) => {
  try {
    const response = await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId));
    return response.data;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

// Utility functions
const getGenreName = (id) => {
  const map = { 1: 'Pop', 2: 'Hip Hop', 3: 'Rock', 4: 'R&B', 5: 'Jazz', 6: 'Electronic', 7: 'Country', 8: 'Indie' };
  return map[id] || 'Khác';
};

const getGenreColor = (id) => {
  const colors = { 1: '#1DB954', 2: '#FF6B6B', 3: '#4ECDC4', 4: '#FF9F1C', 5: '#9D4EDD', 6: '#06D6A0', 7: '#118AB2', 8: '#FFD166' };
  return colors[id] || '#888';
};

const formatDuration = (duration) => {
  if (!duration) return '00:00';
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 3) return `${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return duration;
  }
  if (typeof duration === 'number') {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return '00:00';
};