import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getAlbumById } from './albumService';

// Cache để lưu trữ thông tin album, tránh gọi API lặp lại
let albumsCache = {};

// Cache để đánh dấu các bài hát đã xử lý, tránh hiển thị trùng lặp
let processedSongsCache = new Set();

/**
 * Lấy danh sách nghệ sĩ và tạo bản đồ tra cứu (Map)
 * Giúp lấy tên nghệ sĩ nhanh chóng thông qua ID
 */
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let artistsData = [];

    // Xử lý linh hoạt các cấu trúc dữ liệu trả về khác nhau từ API
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
    return {};
  }
};

/**
 * Lấy danh sách album và lưu vào cache
 * Trả về bản đồ tra cứu (ID -> Tên Album)
 */
export const loadAlbumsMap = async () => {
  try {
    // Trả về dữ liệu từ cache nếu đã có để tối ưu tốc độ
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
    return {};
  }
};

/**
 * Lấy quan hệ giữa nghệ sĩ và bài hát
 * Tạo bản đồ tra cứu: { idsong: [idartist1, idartist2, ...] }
 */
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
    return {};
  }
};

/**
 * Lấy ID người dùng từ LocalStorage hoặc API
 * Tự động chuyển hướng đến trang login nếu hết hạn phiên làm việc (401)
 */
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
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return null;
    }
  }
  return currentUserId ? Number(currentUserId) : null;
};

/**
 * Lấy lịch sử nghe nhạc của người dùng
 * Thực hiện lọc bản ghi lỗi, xóa trùng lặp và sắp xếp theo thời gian mới nhất
 */
export const fetchUserHistory = async (userId) => {
  try {
    const historyResponse = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
    let historyData = [];
    
    // Trích xuất dữ liệu mảng từ các cấu trúc phản hồi API phức tạp
    if (Array.isArray(historyResponse.data)) {
      historyData = historyResponse.data;
    } else if (historyResponse.data?.result) {
      const res = historyResponse.data.result;
      if (Array.isArray(res)) {
        historyData = res;
      } else {
        historyData = res.history || res.data || res.items || [];
      }
    } else if (historyResponse.data?.data && Array.isArray(historyResponse.data.data)) {
      historyData = historyResponse.data.data;
    } else if (historyResponse.data?.history && Array.isArray(historyResponse.data.history)) {
      historyData = historyResponse.data.history;
    } else if (historyResponse.data?.items && Array.isArray(historyResponse.data.items)) {
      historyData = historyResponse.data.items;
    } else {
      for (const key in historyResponse.data) {
        if (Array.isArray(historyResponse.data[key])) {
          historyData = historyResponse.data[key];
          break;
        }
      }
    }
    
    // Lọc bỏ các bản ghi thiếu ID bài hát
    historyData = historyData.filter(item => item.idsong !== null && item.idsong !== undefined);
    
    if (historyData.length === 0) return [];
    
    // Loại bỏ trùng lặp: Nếu nghe một bài nhiều lần, chỉ giữ lại mốc thời gian mới nhất
    const uniqueSongsMap = new Map();
    historyData.forEach(item => {
      const songId = item.idsong;
      const listenDate = new Date(item.listen_date || item.listenDate || item.listenedAt || item.date);
      
      if (!uniqueSongsMap.has(songId) || listenDate > uniqueSongsMap.get(songId).listenDate) {
        uniqueSongsMap.set(songId, { item, listenDate });
      }
    });
    
    historyData = Array.from(uniqueSongsMap.values()).map(entry => entry.item);
    
    // Sắp xếp danh sách theo thời gian nghe giảm dần
    historyData.sort((a, b) => {
      const getDate = (item) => new Date(item.listen_date || item.listenDate || item.listenedAt || item.listen_time || item.date || item.created_at || item.time || 0);
      return getDate(b) - getDate(a);
    });
    
    // Giới hạn kết quả trả về 15 bài gần nhất
    return historyData.slice(0, 15);
  } catch (error) {
    throw error;
  }
};

/**
 * Chuyển đổi dữ liệu lịch sử thô thành đối tượng bài hát chuẩn cho giao diện
 * Kết hợp thông tin từ các Map tra cứu để bổ sung tên nghệ sĩ và album
 */
export const formatHistoryToSong = async (historyItem, artistsMap, artistSongMap, albumsMap) => {
  try {
    // Xác định ID bài hát từ nhiều trường tiềm năng trong dữ liệu trả về
    let songId = historyItem.idsong ?? historyItem.song?.id ?? historyItem.id ?? historyItem.song_id ?? historyItem.songId ?? historyItem.id_song;
    
    if (!songId || isNaN(songId)) return null;
    songId = Number(songId);
    
    // Tạo khóa duy nhất kết hợp ID và ngày nghe để kiểm soát cache xử lý
    const listenDateField = historyItem.listen_date || historyItem.listenDate || historyItem.listenedAt || historyItem.date;
    const uniqueKey = `${songId}_${listenDateField}`;
    
    if (processedSongsCache.has(uniqueKey)) return null;
    processedSongsCache.add(uniqueKey);
    
    // Gọi API lấy thông tin chi tiết của bài hát
    const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
    let song = songResponse.data?.result || songResponse.data?.data || songResponse.data;
    
    if (!song) {
      processedSongsCache.delete(uniqueKey);
      return null;
    }
    
    const actualSongId = song.songId || song.id || songId;
    
    // Tìm và gộp tên các nghệ sĩ tham gia bài hát
    const artistIds = artistSongMap[actualSongId] || [];
    const artistNames = artistIds
      .map(id => artistsMap[id] || 'Unknown Artist')
      .filter(name => name)
      .join(', ');

    const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';
    
    // Xử lý thông tin album (ưu tiên cache trước khi gọi API bổ sung)
    let albumName = song.album || song.albumname || null;
    const albumId = song.idalbum;

    if (!albumName && albumId) {
      if (albumsMap[albumId]) {
        albumName = albumsMap[albumId];
      } else {
        try {
          const albumData = await getAlbumById(albumId);
          albumName = albumData.albumname || albumData.title || `Album ${albumId}`;
          albumsMap[albumId] = albumName;
        } catch {
          albumName = `Album ${albumId}`;
        }
      }
    }

    // Chuẩn hóa thời gian nghe
    const getListenDate = (item) => item.listen_date || item.listenDate || item.listenedAt || item.listen_time || item.date || item.created_at || item.time;
    const listenDateFieldRaw = getListenDate(historyItem);
    
    if (!listenDateFieldRaw) {
      processedSongsCache.delete(uniqueKey);
      return null;
    }
    
    const listenedAt = new Date(listenDateFieldRaw);
    if (isNaN(listenedAt.getTime())) {
      processedSongsCache.delete(uniqueKey);
      return null;
    }
    
    // Trả về đối tượng bài hát thống nhất cho UI
    return {
      id: actualSongId,
      title: song.title || song.name || 'Unknown Title',
      artist: artistName,
      album: albumName || 'Single',
      duration: song.duration || 0,
      coverUrl: song.avatar || song.cover || song.image || '/default-cover.png',
      audioUrl: song.path || song.url || song.audio_url || '',
      listenedAt: getTimeAgo(listenedAt),
      rawListenDate: listenedAt,
      playCount: historyItem.playCount || historyItem.play_count || historyItem.count || 1,
      views: song.views || song.listens || 0,
      releaseDate: song.releasedate || song.release_date,
      genreId: song.genreId || song.idgenre || song.genre_id,
      uniqueKey: uniqueKey,
    };
    
  } catch (error) {
    const sId = historyItem.idsong || historyItem.id;
    const lDate = historyItem.listen_date || historyItem.listenDate;
    if (sId && lDate) processedSongsCache.delete(`${sId}_${lDate}`);
    return null;
  }
};

/**
 * Hàm chính để lấy toàn bộ danh sách bài hát gần đây đã được định dạng
 * Quy trình: Lấy UserID -> Lấy Lịch sử -> Tải Maps tra cứu -> Định dạng từng bài hát
 */
export const fetchRecentSongs = async () => {
  try {
    processedSongsCache.clear();
    
    const userId = await getUserId();
    if (!userId) return [];
    
    const history = await fetchUserHistory(userId);
    if (history.length === 0) return [];
    
    // Tải các bản đồ dữ liệu bổ trợ song song để tối ưu hiệu suất
    const [artistsMap, artistSongMap, albumsMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap(),
      loadAlbumsMap()
    ]);
    
    const recentSongsPromises = history.map(item => 
      formatHistoryToSong(item, artistsMap, artistSongMap, albumsMap)
    );
    
    let songs = (await Promise.all(recentSongsPromises)).filter(Boolean);
    
    // Kiểm tra cuối cùng để đảm bảo tính duy nhất của bài hát theo ID
    const uniqueSongsMap = new Map();
    songs.forEach(song => {
      if (!uniqueSongsMap.has(song.id)) uniqueSongsMap.set(song.id, song);
    });
    
    songs = Array.from(uniqueSongsMap.values());
    songs.sort((a, b) => b.rawListenDate - a.rawListenDate);
    
    return songs;
  } catch (error) {
    return [];
  }
};

/**
 * Công cụ chuyển đổi đối tượng Date sang chuỗi thời gian tương đối
 * @param {Date} date - Thời điểm cần so sánh
 */
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffSecs < 10) return 'Vừa xong';
  if (diffSecs < 60) return `${diffSecs} giây trước`;
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};