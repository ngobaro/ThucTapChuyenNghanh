// FILE: demo/src/services/albumService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Lấy thông tin album theo ID
export const getAlbumById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.ALBUM_BY_ID(id));
    return response.data.result || response.data;
  } catch (error) {
    console.error('Error fetching album:', error);
    throw error;
  }
};

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

// Lấy tất cả albums (cache map) - THÊM MỚI ĐỂ EXPORT CHO SONGlist
let albumsCache = {};
export const loadAlbumsMap = async () => {
  try {
    if (Object.keys(albumsCache).length > 0) {
      return albumsCache;
    }

    const response = await api.get(API_ENDPOINTS.ALBUMS);
    const albumsMap = {};
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
      albumsMap[albumId] = albumName;
    });

    albumsCache = albumsMap;
    return albumsMap;
  } catch (error) {
    console.warn('Error loading albums map:', error);
    return {};
  }
};

// Lấy songs trong album
export const getSongsByAlbum = async (albumId, artistsMap, artistSongMap, albumData) => {
  try {
    const response = await api.get(API_ENDPOINTS.SONGS, {
      params: { album: albumId }
    });

    let songsData = [];
    if (Array.isArray(response.data)) {
      songsData = response.data;
    } else if (response.data.result && Array.isArray(response.data.result)) {
      songsData = response.data.result;
    }

    // Format songs với multi-artist
    const formattedSongs = songsData.map((song, index) => {
      const songId = song.songId || song.id;
      const artistIds = artistSongMap[songId] || [];

      const artistNames = artistIds
        .map(aId => artistsMap[aId] || 'Unknown Artist')
        .filter(name => name)
        .join(', ');

      const songArtist = artistNames || song.artist || 'Unknown Artist';

      return {
        id: songId,
        title: song.title || 'Unknown Title',
        artist: songArtist,
        album: albumData.albumname || albumData.title || 'Unknown Album',
        duration: formatDuration(song.duration),
        trackNumber: song.trackNumber || (index + 1),
        coverUrl: song.avatar || albumData.cover || '/default-album.jpg',
        audioUrl: song.path || '',
        views: song.views || 0,
        releaseDate: song.releasedate,
        genreId: song.genreId,
        color: getColorByGenre(song.genreId)
      };
    });

    return formattedSongs;
  } catch (error) {
    console.error('Error fetching album songs:', error);
    throw error;
  }
};

// Fetch full album data (parallel loads)
export const fetchAlbumData = async (id) => {
  try {
    const albumData = await getAlbumById(id);

    // Load artists và artist-songs parallel
    const [artistsMap, artistSongMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap()
    ]);

    // Artist name cho album
    let artistName = 'Unknown Artist';
    if (albumData.idartist) {
      artistName = artistsMap[albumData.idartist] || 'Unknown Artist';
    }

    // Lấy songs và format
    const songs = await getSongsByAlbum(id, artistsMap, artistSongMap, albumData);

    // Tính total duration
    const totalDuration = calculateTotalDuration(songs);

    // Album cover
    const albumCover = albumData.cover || albumData.avatar || '/default-album.jpg';

    // Album object
    const album = {
      id: albumData.idalbum || albumData.id,
      title: albumData.albumname || albumData.title || 'Unknown Album',
      artist: artistName,
      year: albumData.releaseyear || albumData.year || new Date().getFullYear(),
      genre: albumData.genre || 'Unknown Genre',
      description: 'Khám phá những bài hát tuyệt vời trong album này.', // Generic, no mock
      color: getRandomColor(),
      duration: totalDuration,
      songCount: songs.length,
      cover: albumCover
    };

    return { album, songs };
  } catch (error) {
    console.error('Error in fetchAlbumData:', error);
    throw error;
  }
};

// Lấy danh sách albums với song counts
export const fetchAlbumsList = async () => {
  try {
    // Load albums và artists parallel
    const [albumsResponse, artistsResponse] = await Promise.all([
      api.get(API_ENDPOINTS.ALBUMS),
      api.get(API_ENDPOINTS.ARTISTS)
    ]);

    // Process artists
    const artistsMap = {};
    let artistsData = [];

    if (Array.isArray(artistsResponse.data)) {
      artistsData = artistsResponse.data;
    } else if (artistsResponse.data.result && Array.isArray(artistsResponse.data.result)) {
      artistsData = artistsResponse.data.result;
    }

    artistsData.forEach(artist => {
      const artistId = artist.idartist || artist.id;
      const artistName = artist.artistname || artist.name || 'Unknown Artist';
      artistsMap[artistId] = artistName;
    });

    // Process albums
    let albumsData = [];

    if (Array.isArray(albumsResponse.data)) {
      albumsData = albumsResponse.data;
    } else if (albumsResponse.data.result && Array.isArray(albumsResponse.data.result)) {
      albumsData = albumsResponse.data.result;
    }

    // Get songs count for each album (sử dụng params album=albumId thay vì artist)
    const albumsWithSongs = await Promise.all(
      albumsData.map(async (album) => {
        try {
          const albumId = album.idalbum || album.id;
          const songsResponse = await api.get(API_ENDPOINTS.SONGS, {
            params: { album: albumId }  // ← SỬA: Dùng album ID để lấy đúng songs trong album
          });

          let songs = [];
          if (Array.isArray(songsResponse.data)) {
            songs = songsResponse.data;
          } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
            songs = songsResponse.data.result;
          }

          // Get artist name
          const artistId = album.idartist;
          const artistName = artistId ? artistsMap[artistId] : 'Unknown Artist';

          return {
            id: albumId,
            title: album.albumname || album.title || 'Unknown Album',
            artist: artistName,
            year: album.releaseyear || album.year || new Date().getFullYear(),
            tracks: songs.length,  // ← BÂY GIỜ là số tracks đúng trong album
            coverUrl: album.cover || album.avatar || '/default-album.jpg',
            color: getRandomColor()
          };
        } catch (error) {
          console.error(`Error loading songs for album ${album.idalbum}:`, error);
          return {
            id: album.idalbum || album.id,
            title: album.albumname || album.title || 'Unknown Album',
            artist: 'Unknown Artist',
            year: album.releaseyear || album.year || new Date().getFullYear(),
            tracks: 0,
            coverUrl: album.cover || album.avatar || '/default-album.jpg',
            color: getRandomColor()
          };
        }
      })
    );

    return albumsWithSongs;
  } catch (error) {
    console.error('Error loading albums list:', error);
    return []; // No mock fallback, return empty array
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
  const colors = ['#1E3A8A', '#DC2626', '#1DB954', '#7C3AED', '#0F766E', '#DB2777'];
  return colors[Math.floor(Math.random() * colors.length)];
};