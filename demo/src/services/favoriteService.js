// FILE: demo/src/services/favoriteService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Load artists map
 * Dùng để tra nhanh tên nghệ sĩ theo artistId
 * { artistId: artistName }
 */
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let artistsData = [];

    if (Array.isArray(response.data)) {
      artistsData = response.data;
    } else if (Array.isArray(response.data?.result)) {
      artistsData = response.data.result;
    } else if (Array.isArray(response.data?.data)) {
      artistsData = response.data.data;
    }

    artistsData.forEach(artist => {
      const artistId = artist.idartist || artist.id;
      const artistName = artist.artistname || artist.name || 'Unknown Artist';
      if (artistId) artistsMap[artistId] = artistName;
    });

    return artistsMap;
  } catch {
    return {};
  }
};

/**
 * Load artist–song map
 * Dùng để biết 1 bài hát có những nghệ sĩ nào
 * { songId: [artistId] }
 */
export const loadArtistSongMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
    const artistSongMap = {};
    let data = [];

    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response.data?.result)) {
      data = response.data.result;
    }

    data.forEach(item => {
      const songId = item.idsong;
      const artistId = item.idartist;
      if (!songId || !artistId) return;

      if (!artistSongMap[songId]) {
        artistSongMap[songId] = [];
      }
      artistSongMap[songId].push(artistId);
    });

    return artistSongMap;
  } catch {
    return {};
  }
};

/**
 * Lấy userId hiện tại
 * Ưu tiên localStorage, nếu chưa có thì gọi API
 */
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
    } catch {
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
  }

  return Number(currentUserId);
};

/**
 * Lấy danh sách bài hát yêu thích của user
 * Có xử lý map nghệ sĩ – bài hát
 */
export const fetchFavoriteSongs = async (userId) => {
  try {
    const res = await api.get(API_ENDPOINTS.USER_FAVORITES(userId));
    const favSongs = res.data?.result || [];

    // Load map song – artist song song
    const [artistsMap, artistSongMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap()
    ]);

    const songs = favSongs.map(song => {
      const songId = song.songId || song.id;

      // Ghép nhiều nghệ sĩ cho 1 bài hát
      const artistIds = artistSongMap[songId] || [];
      const artistNames = artistIds
        .map(aId => artistsMap[aId] || 'Unknown Artist')
        .filter(Boolean)
        .join(', ');

      const artistName =
        artistNames ||
        song.artist ||
        song.artistname ||
        'Unknown Artist';

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
  } catch {
    throw new Error();
  }
};

/**
 * Xóa bài hát khỏi danh sách yêu thích
 */
export const removeFavorite = async (userId, songId) => {
  try {
    const response = await api.delete(
      API_ENDPOINTS.REMOVE_FAVORITE(userId, songId)
    );
    return response.data;
  } catch {
    throw new Error();
  }
};

/**
 * Lấy tên thể loại theo genreId
 */
const getGenreName = (id) => {
  const map = {
    1: 'Pop',
    2: 'Hip Hop',
    3: 'Rock',
    4: 'R&B',
    5: 'Jazz',
    6: 'Electronic',
    7: 'Country',
    8: 'Indie'
  };
  return map[id] || 'Khác';
};

/**
 * Lấy màu theo genreId
 */
const getGenreColor = (id) => {
  const colors = {
    1: '#1DB954',
    2: '#FF6B6B',
    3: '#4ECDC4',
    4: '#FF9F1C',
    5: '#9D4EDD',
    6: '#06D6A0',
    7: '#118AB2',
    8: '#FFD166'
  };
  return colors[id] || '#888';
};

/**
 * Format thời lượng bài hát về mm:ss
 */
const formatDuration = (duration) => {
  if (!duration) return '00:00';

  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 3) {
      return `${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
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
