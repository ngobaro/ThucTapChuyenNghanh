// FILE: demo/src/services/recentService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getAlbumById } from './albumService'; // Import để fetch album name

// Cache cho albums (tương tự artistsMap) - global để tránh reload
let albumsCache = {};

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

// Lấy tất cả albums (cache map) - load một lần và cache global
export const loadAlbumsMap = async () => {
  try {
    if (Object.keys(albumsCache).length > 0) {
      console.log('Using cached albumsMap'); // Debug: Check cache hit
      return albumsCache;
    }

    console.log('Fetching albums for cache...'); // Debug
    const response = await api.get(API_ENDPOINTS.ALBUMS);
    console.log('Albums API response:', response.data); // Debug: Check raw data

    const albumsMap = {};
    let albumsData = [];

    if (Array.isArray(response.data)) {
      albumsData = response.data;
    } else if (response.data.result && Array.isArray(response.data.result)) {
      albumsData = response.data.result;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      albumsData = response.data.data;
    }

    console.log('Albums data processed:', albumsData.length); // Debug

    albumsData.forEach(album => {
      const albumId = album.idalbum || album.id; // Đảm bảo ID đúng format (string/number)
      const albumName = album.albumname || album.title || `Album ${albumId}`; // Fallback ngay nếu không có tên
      albumsMap[albumId] = albumName;
      console.log(`Mapped album ID ${albumId}: "${albumName}"`); // Debug từng item
    });

    albumsCache = albumsMap; // Cache global
    console.log('AlbumsMap built:', albumsCache); // Debug: Check final map
    return albumsMap;
  } catch (error) {
    console.error('Error loading albumsMap:', error); // Error log
    return {}; // Return empty nếu fail
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

// Lấy user ID từ localStorage hoặc API
export const getUserId = async () => {
  let currentUserId = localStorage.getItem('userId');
  if (!currentUserId) {
    try {
      const userRes = await api.get(API_ENDPOINTS.MY_INFO);
      const userData = userRes.data?.result || userRes.data;
      currentUserId = userData?.id || userData?.userId || userData?.id_user;
      
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
  return currentUserId ? Number(currentUserId) : null;
};

// Lấy lịch sử nghe của user
export const fetchUserHistory = async (userId) => {
  try {
    const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
    
    let historyData = [];
    if (Array.isArray(historyResponse.data)) {
      historyData = historyResponse.data;
    } else if (historyResponse.data?.result && Array.isArray(historyResponse.data.result)) {
      historyData = historyResponse.data.result;
    } else if (historyResponse.data?.data && Array.isArray(historyResponse.data.data)) {
      historyData = historyResponse.data.data;
    } else if (historyResponse.data?.history && Array.isArray(historyResponse.data.history)) {
      historyData = historyResponse.data.history;
    }

    // Sắp xếp theo thời gian gần nhất
    historyData.sort((a, b) => {
      const getDate = (item) => {
        return item.listen_date || 
               item.listenedAt || 
               item.listenDate || 
               item.listen_time || 
               item.date || 
               item.created_at ||
               item.time;
      };
      
      const dateA = getDate(a);
      const dateB = getDate(b);
      
      if (!dateA || !dateB) return 0;
      
      return new Date(dateB) - new Date(dateA);
    });
    
    return historyData.slice(0, 20); // Top 20 recent
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw error;
  }
};

// Format một history item thành song object - SỬA FULL: Robust album resolution
export const formatHistoryToSong = async (historyItem, artistsMap, artistSongMap, albumsMap) => {
  try {
    const songId = historyItem.idsong || 
                  historyItem.songId || 
                  historyItem.id_song || 
                  historyItem.diêten || 
                  historyItem.song_id || 
                  historyItem.id;
    
    if (!songId) {
      console.warn('No songId in history item:', historyItem); // Warn
      return null;
    }
    
    const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
    const song = songResponse.data.result || songResponse.data;
    
    if (!song) {
      console.warn(`No song data for ID ${songId}`); // Warn
      return null;
    }

    console.log(`Processing song ${songId}:`, { idalbum: song.idalbum, album: song.album }); // Debug song data

    // Map artists
    const artistIds = artistSongMap[songId] || [];
    const artistNames = artistIds
      .map(id => artistsMap[id] || 'Unknown Artist')
      .filter(name => name)
      .join(', ');

    const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

    // FULL FIX ALBUM: Multi-layer fallback với debug
    let albumName = song.album || song.albumname || null; // Ưu tiên từ song data
    const albumId = song.idalbum; // Có thể string/number

    if (!albumName && albumId) {
      // Layer 1: Từ cache
      const cachedName = albumsMap[albumId];
      if (cachedName) {
        albumName = cachedName;
        console.log(`Album from cache ID ${albumId}: "${albumName}"`); // Debug hit
      } else {
        // Layer 2: Fetch single album
        try {
          console.log(`Fetching single album ID ${albumId}...`); // Debug
          const albumData = await getAlbumById(albumId);
          albumName = albumData.albumname || albumData.title || `Album ${albumId}`;
          albumsMap[albumId] = albumName; // Update cache
          console.log(`Album fetched ID ${albumId}: "${albumName}"`); // Debug success
        } catch (fetchErr) {
          console.error(`Error fetching album ${albumId}:`, fetchErr); // Error log
          albumName = `Album ${albumId}`; // Final fallback
        }
      }
    }

    if (!albumName) {
      albumName = 'Single'; // Ultimate fallback nếu không có idalbum
    }

    // Listen date
    const getListenDate = (item) => {
      return item.listen_date || 
             item.listenedAt || 
             item.listenDate || 
             item.listen_time || 
             item.date || 
             item.created_at ||
             item.time;
    };
    
    const listenDateField = getListenDate(historyItem);
    
    if (!listenDateField) {
      console.warn(`No listen date for song ${songId}`); // Warn
      return null;
    }
    
    const listenedAt = new Date(listenDateField);
    
    if (isNaN(listenedAt.getTime())) {
      console.warn(`Invalid date "${listenDateField}" for song ${songId}`); // Warn
      return null;
    }
    
    const timeAgo = getTimeAgo(listenedAt);

    const playCount = historyItem.playCount || 
                      historyItem.play_count || 
                      historyItem.count || 
                      1;

    console.log(`Final album for song ${songId}: "${albumName}"`); // Debug final

    return {
      id: song.songId || song.id || songId,
      title: song.title || song.name || 'Unknown Title',
      artist: artistName,
      album: albumName,  // ← Giờ sẽ là tên thật hoặc fallback rõ ràng
      duration: song.duration || 0,
      coverUrl: song.avatar || song.cover || song.image || '/default-cover.png',
      audioUrl: song.path || song.url || song.audio_url || '',
      listenedAt: timeAgo,
      rawListenDate: listenedAt,
      playCount: playCount,
      views: song.views || song.listens || 0,
      releaseDate: song.releasedate || song.release_date,
      genreId: song.genreId || song.idgenre || song.genre_id,
    };
  } catch (error) {
    console.error('Error formatting history item:', error, historyItem); // Full error log
    return null;
  }
};

// Fetch full recent songs - Giữ nguyên, nhưng thêm debug ở loadAlbumsMap
export const fetchRecentSongs = async () => {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('No user ID available');
    }

    const history = await fetchUserHistory(userId);

    // Load artists, artist-songs, và albums parallel
    const [artistsMap, artistSongMap, albumsMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap(),
      loadAlbumsMap()  // Đảm bảo load cache với debug
    ]);

    console.log('Loaded maps - Artists keys:', Object.keys(artistsMap).length); // Debug
    console.log('Loaded maps - Albums keys:', Object.keys(albumsMap).length); // Debug

    // Format songs parallel - pass albumsMap
    const recentSongsPromises = history.map(historyItem => 
      formatHistoryToSong(historyItem, artistsMap, artistSongMap, albumsMap)
    );

    let songs = (await Promise.all(recentSongsPromises)).filter(Boolean);

    // Sort theo thời gian nghe gần nhất
    songs.sort((a, b) => b.rawListenDate - a.rawListenDate);

    return songs;
  } catch (error) {
    console.error('Error fetching recent songs:', error);
    throw error;
  }
};

// Utility: Get time ago string
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Vừa xong';
  } else if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays === 1) {
    return 'Hôm qua';
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
};