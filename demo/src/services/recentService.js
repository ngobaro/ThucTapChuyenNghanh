import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getAlbumById } from './albumService';

// Cache cho albums
let albumsCache = {};

// Cache để tránh duplicate songs
let processedSongsCache = new Set();

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

// Lấy tất cả albums (cache map)
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
      const albumName = album.albumname || album.title || `Album ${albumId}`;
      albumsMap[albumId] = albumName;
    });

    albumsCache = albumsMap;
    return albumsMap;
  } catch (error) {
    console.error('Error loading albumsMap:', error);
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

// Lấy lịch sử nghe của user - FIXED
export const fetchUserHistory = async (userId) => {
  try {
    console.log(`🔍 Fetching history for user ID: ${userId}`);
    const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
    
    console.log('🔍 RAW HISTORY RESPONSE:', historyResponse.data);
    
    let historyData = [];
    
    // Logic chính xác để extract history data
    if (Array.isArray(historyResponse.data)) {
      console.log('✅ Case 1: Direct array');
      historyData = historyResponse.data;
    } else if (historyResponse.data?.result) {
      console.log('✅ Case 2: data.result');
      if (Array.isArray(historyResponse.data.result)) {
        historyData = historyResponse.data.result;
      } else if (historyResponse.data.result?.history && Array.isArray(historyResponse.data.result.history)) {
        historyData = historyResponse.data.result.history;
      } else if (historyResponse.data.result?.data && Array.isArray(historyResponse.data.result.data)) {
        historyData = historyResponse.data.result.data;
      } else if (historyResponse.data.result?.items && Array.isArray(historyResponse.data.result.items)) {
        historyData = historyResponse.data.result.items;
      }
    } else if (historyResponse.data?.data && Array.isArray(historyResponse.data.data)) {
      console.log('✅ Case 3: data.data array');
      historyData = historyResponse.data.data;
    } else if (historyResponse.data?.history && Array.isArray(historyResponse.data.history)) {
      console.log('✅ Case 4: data.history array');
      historyData = historyResponse.data.history;
    } else if (historyResponse.data?.items && Array.isArray(historyResponse.data.items)) {
      console.log('✅ Case 5: data.items array');
      historyData = historyResponse.data.items;
    } else {
      console.log('⚠️ Unknown structure, checking all keys...');
      for (const key in historyResponse.data) {
        if (Array.isArray(historyResponse.data[key])) {
          console.log(`✅ Found array in key: "${key}"`);
          historyData = historyResponse.data[key];
          break;
        }
      }
    }
    
    console.log(`✅ Extracted ${historyData.length} history items`);
    
    // FIX 1: Lọc bỏ các bản ghi không có idsong hoặc idsong = null
    historyData = historyData.filter(item => {
      const hasSongId = item.idsong !== null && item.idsong !== undefined;
      if (!hasSongId) {
        console.log('⚠️ Filtered out history item with null idsong:', item);
      }
      return hasSongId;
    });
    
    console.log(`✅ After filtering null idsong: ${historyData.length} valid history items`);
    
    if (historyData.length > 0) {
      console.log('🔍 First valid item sample:', {
        keys: Object.keys(historyData[0]),
        values: historyData[0]
      });
    } else {
      console.log('ℹ️ No valid history data found');
      return [];
    }
    
    // FIX 2: Lọc duplicate idsong - chỉ giữ bản ghi mới nhất cho mỗi bài hát
    const uniqueSongsMap = new Map();
    
    historyData.forEach(item => {
      const songId = item.idsong;
      const listenDate = new Date(item.listen_date || item.listenDate || item.listenedAt || item.date);
      
      if (!uniqueSongsMap.has(songId) || listenDate > uniqueSongsMap.get(songId).listenDate) {
        uniqueSongsMap.set(songId, {
          item,
          listenDate
        });
      }
    });
    
    // Convert map back to array
    historyData = Array.from(uniqueSongsMap.values()).map(entry => entry.item);
    
    console.log(`✅ After removing duplicates: ${historyData.length} unique songs`);
    
    // Sắp xếp theo thời gian gần nhất
    historyData.sort((a, b) => {
      const getDate = (item) => {
        return item.listen_date || 
               item.listenDate || 
               item.listenedAt || 
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
    
    // Lấy 15 bài gần nhất để đảm bảo không duplicate
    return historyData.slice(0, 15);
  } catch (error) {
    console.error('❌ Error fetching user history:', error);
    throw error;
  }
};

// Format một history item thành song object - FIXED TRIỆT ĐỂ
export const formatHistoryToSong = async (historyItem, artistsMap, artistSongMap, albumsMap) => {
  try {
    console.log('🔍 Processing history item:', historyItem);
    
    // ================ FIX 1: EXTRACT SONG ID CHÍNH XÁC ================
    let songId = null;
    let sourceField = '';
    
    // ƯU TIÊN THEO ĐÚNG LOGIC DATABASE:
    // 1. idsong từ listenhistories table (CHÍNH XÁC NHẤT)
    if (historyItem.idsong !== undefined && historyItem.idsong !== null) {
      songId = Number(historyItem.idsong);
      sourceField = 'idsong';
    } 
    // 2. Nếu không có, có thể history trả về trực tiếp song object
    else if (historyItem.song && historyItem.song.id) {
      songId = Number(historyItem.song.id);
      sourceField = 'song.id';
    }
    // 3. id (fallback)
    else if (historyItem.id !== undefined && historyItem.id !== null) {
      songId = Number(historyItem.id);
      sourceField = 'id';
    }
    // 4. Kiểm tra thêm các field khác
    else if (historyItem.song_id !== undefined && historyItem.song_id !== null) {
      songId = Number(historyItem.song_id);
      sourceField = 'song_id';
    }
    else if (historyItem.songId !== undefined && historyItem.songId !== null) {
      songId = Number(historyItem.songId);
      sourceField = 'songId';
    }
    else if (historyItem.id_song !== undefined && historyItem.id_song !== null) {
      songId = Number(historyItem.id_song);
      sourceField = 'id_song';
    }
    
    if (!songId || isNaN(songId)) {
      console.error('❌ Cannot extract valid songId. History item:', historyItem);
      return null;
    }
    
    console.log(`✅ Extracted songId: ${songId} (from ${sourceField})`);
    
    // ================ FIX 2: TẠO UNIQUE KEY ĐỂ TRÁNH DUPLICATE ================
    const listenDateField = historyItem.listen_date || 
                           historyItem.listenDate || 
                           historyItem.listenedAt || 
                           historyItem.date;
    const uniqueKey = `${songId}_${listenDateField}`;
    
    // Kiểm tra cache để tránh xử lý duplicate
    if (processedSongsCache.has(uniqueKey)) {
      console.log(`⏭️ Skipping duplicate song ${songId} with date ${listenDateField}`);
      return null;
    }
    processedSongsCache.add(uniqueKey);
    
    // ================ FIX 3: FETCH SONG DATA ================
    const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
    
    let song = null;
    if (songResponse.data?.result) {
      song = songResponse.data.result;
    } else if (songResponse.data?.data) {
      song = songResponse.data.data;
    } else {
      song = songResponse.data;
    }
    
    if (!song) {
      console.error(`❌ No song data found for ID: ${songId}`);
      processedSongsCache.delete(uniqueKey); // Xóa khỏi cache nếu fail
      return null;
    }
    
    console.log(`✅ Song data loaded: ${song.title || 'Unknown'} (ID: ${song.id || song.songId})`);
    
    // ================ FIX 4: GET CORRECT SONG ID FROM RESPONSE ================
    const actualSongId = song.songId || song.id || songId;
    console.log(`✅ Actual song ID to use: ${actualSongId}`);
    
    // ================ FIX 5: MAP ARTISTS ================
    const artistIds = artistSongMap[actualSongId] || [];
    const artistNames = artistIds
      .map(id => artistsMap[id] || 'Unknown Artist')
      .filter(name => name)
      .join(', ');

    const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';
    
    // ================ FIX 6: GET ALBUM ================
    let albumName = song.album || song.albumname || null;
    const albumId = song.idalbum;

    if (!albumName && albumId) {
      const cachedName = albumsMap[albumId];
      if (cachedName) {
        albumName = cachedName;
      } else {
        try {
          const albumData = await getAlbumById(albumId);
          albumName = albumData.albumname || albumData.title || `Album ${albumId}`;
          albumsMap[albumId] = albumName;
        } catch (fetchErr) {
          console.error(`Error fetching album ${albumId}:`, fetchErr);
          albumName = `Album ${albumId}`;
        }
      }
    }

    if (!albumName) {
      albumName = 'Single';
    }
    
    // ================ FIX 7: GET LISTEN DATE ================
    const getListenDate = (item) => {
      // Ưu tiên theo listenhistories table structure
      return item.listen_date || 
             item.listenDate || 
             item.listenedAt || 
             item.listen_time || 
             item.date || 
             item.created_at ||
             item.time;
    };
    
    const listenDateFieldRaw = getListenDate(historyItem);
    
    if (!listenDateFieldRaw) {
      console.warn(`⚠️ No listen date for song ${actualSongId}`);
      processedSongsCache.delete(uniqueKey);
      return null;
    }
    
    const listenedAt = new Date(listenDateFieldRaw);
    
    if (isNaN(listenedAt.getTime())) {
      console.warn(`⚠️ Invalid date "${listenDateFieldRaw}" for song ${actualSongId}`);
      processedSongsCache.delete(uniqueKey);
      return null;
    }
    
    const timeAgo = getTimeAgo(listenedAt);
    
    // ================ FIX 8: GET PLAY COUNT ================
    const playCount = historyItem.playCount || 
                     historyItem.play_count || 
                     historyItem.count || 
                     1;
    
    // ================ FIX 9: RETURN UNIFIED SONG OBJECT ================
    const formattedSong = {
      id: actualSongId, // Luôn dùng actualSongId
      title: song.title || song.name || 'Unknown Title',
      artist: artistName,
      album: albumName,
      duration: song.duration || 0,
      coverUrl: song.avatar || song.cover || song.image || '/default-cover.png',
      audioUrl: song.path || song.url || song.audio_url || '',
      listenedAt: timeAgo,
      rawListenDate: listenedAt,
      playCount: playCount,
      views: song.views || song.listens || 0,
      releaseDate: song.releasedate || song.release_date,
      genreId: song.genreId || song.idgenre || song.genre_id,
      // Thêm uniqueKey để tránh duplicate trong React
      uniqueKey: uniqueKey,
    };
    
    console.log(`✅ Formatted song: ${formattedSong.title} by ${formattedSong.artist} (Key: ${uniqueKey})`);
    return formattedSong;
    
  } catch (error) {
    console.error('❌ Error formatting history item:', error);
    console.error('History item was:', historyItem);
    
    // Clean up cache on error
    const songId = historyItem.idsong || historyItem.id;
    const listenDateField = historyItem.listen_date || historyItem.listenDate;
    if (songId && listenDateField) {
      processedSongsCache.delete(`${songId}_${listenDateField}`);
    }
    
    return null;
  }
};

// Fetch full recent songs - FIXED TRIỆT ĐỂ
export const fetchRecentSongs = async () => {
  try {
    console.log('🚀 START fetchRecentSongs');
    
    // Reset cache mỗi lần fetch
    processedSongsCache.clear();
    
    const userId = await getUserId();
    if (!userId) {
      console.error('❌ No user ID available');
      return [];
    }
    
    console.log(`👤 User ID: ${userId}`);
    
    const history = await fetchUserHistory(userId);
    console.log(`📊 Raw history items (after filtering): ${history.length}`);
    
    if (history.length === 0) {
      console.log('ℹ️ No history found');
      return [];
    }
    
    // Load all maps in parallel
    const [artistsMap, artistSongMap, albumsMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap(),
      loadAlbumsMap()
    ]);
    
    console.log('🗺️ Maps loaded:', {
      artists: Object.keys(artistsMap).length,
      artistSongs: Object.keys(artistSongMap).length,
      albums: Object.keys(albumsMap).length
    });
    
    // Process each history item
    const recentSongsPromises = history.map(historyItem => 
      formatHistoryToSong(historyItem, artistsMap, artistSongMap, albumsMap)
    );
    
    let songs = (await Promise.all(recentSongsPromises)).filter(Boolean);
    
    console.log(`✅ Successfully formatted ${songs.length} songs`);
    
    // FIX: Remove duplicates by song ID (đảm bảo chắc chắn)
    const uniqueSongsMap = new Map();
    songs.forEach(song => {
      if (!uniqueSongsMap.has(song.id)) {
        uniqueSongsMap.set(song.id, song);
      } else {
        console.log(`🔄 Removing duplicate song ID: ${song.id}`);
      }
    });
    
    songs = Array.from(uniqueSongsMap.values());
    
    // Sort theo thời gian nghe gần nhất
    songs.sort((a, b) => b.rawListenDate - a.rawListenDate);
    
    // Debug final result
    if (songs.length > 0) {
      console.log('🎯 Final unique songs:');
      songs.forEach((song, i) => {
        console.log(`${i + 1}. ${song.title} (ID: ${song.id}) - ${song.listenedAt} - Key: ${song.uniqueKey}`);
      });
    }
    
    return songs;
    
  } catch (error) {
    console.error('❌ Error in fetchRecentSongs:', error);
    return [];
  }
};

// Utility: Get time ago string - FIXED để hiển thị "Vừa xong"
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffSecs < 10) {
    return 'Vừa xong';
  } else if (diffSecs < 60) {
    return `${diffSecs} giây trước`;
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