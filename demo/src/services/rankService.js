// FILE: demo/src/services/rankService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getAllSongs } from './songService'; // Tái sử dụng hàm fetch bài hát sẵn có

/**
 * Tải danh sách nghệ sĩ và chuyển đổi thành Map tra cứu
 * Mục đích: Tối ưu hóa việc tìm tên nghệ sĩ theo ID với độ phức tạp O(1)
 */
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let artistsData = [];

    // Hỗ trợ nhiều cấu trúc phản hồi khác nhau từ phía Server
    if (Array.isArray(response.data)) {
      artistsData = response.data;
    } else if (response.data.result && Array.isArray(response.data.result)) {
      artistsData = response.data.result;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      artistsData = response.data.data;
    }

    // Ánh xạ ID sang tên nghệ sĩ
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
 * Tải bảng quan hệ Nghệ sĩ - Bài hát
 * Trả về Map tra cứu: { idsong: [idartist1, idartist2, ...] }
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

    // Nhóm các ID nghệ sĩ theo từng ID bài hát
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
 * Chuẩn hóa dữ liệu bài hát kết hợp với thông tin nghệ sĩ
 * Chuyển đổi format dữ liệu từ Backend sang chuẩn hiển thị của Frontend
 */
export const processSongsWithArtists = async (allSongs, artistsMap, artistSongMap) => {
  const processedSongs = allSongs.map(song => {
    const songId = song.songId || song.id;
    const artistIds = artistSongMap[songId] || [];

    // Chuyển đổi mảng ID nghệ sĩ thành chuỗi tên (ví dụ: "Sơn Tùng M-TP, SlimV")
    const artistNames = artistIds
      .map(id => artistsMap[id] || 'Unknown Artist')
      .filter(name => name)
      .join(', ');

    const artistName = artistNames || song.artist || 'Unknown Artist';

    // Xử lý lượt xem: Nếu dữ liệu trống, tạm thời giả lập số ngẫu nhiên cho bảng xếp hạng
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
      color: getRandomColor() // Gán màu sắc ngẫu nhiên cho UI bảng xếp hạng
    };
  });

  return processedSongs;
};

/**
 * Lấy dữ liệu tổng hợp cho trang Xếp hạng (Rank)
 * Bao gồm: Top 12 Trending (Xem nhiều nhất) và Top 6 New Releases (Mới nhất)
 */
export const fetchRankData = async () => {
  try {
    // 1. Tải danh sách bài hát thô
    const response = await getAllSongs();
    const allSongs = Array.isArray(response) ? response :
      response.result || response.data || [];

    if (allSongs.length === 0) {
      return { trendingSongs: [], newReleases: [] };
    }

    // 2. Tải song song thông tin nghệ sĩ và bảng quan hệ để tối ưu thời gian chờ
    const [artistsMap, artistSongMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap()
    ]);

    // 3. Xử lý logic ánh xạ tên nghệ sĩ vào từng bài hát
    const processedSongs = await processSongsWithArtists(allSongs, artistsMap, artistSongMap);

    // 4. Phân loại Trending: Sắp xếp theo lượt xem giảm dần, lấy 12 bài đầu
    const trendingSongs = [...processedSongs]
      .sort((a, b) => b.views - a.views)
      .slice(0, 12);

    // 5. Phân loại Mới phát hành: Sắp xếp theo ngày phát hành giảm dần, lấy 6 bài đầu
    const newReleases = [...processedSongs]
      .sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 6);

    return { trendingSongs, newReleases };
  } catch (error) {
    return { trendingSongs: [], newReleases: [] };
  }
};

/**
 * Định dạng thời lượng bài hát (Duration)
 * Chuyển đổi giây sang định dạng MM:SS hoặc làm đẹp chuỗi HH:MM:SS
 */
const formatDuration = (duration) => {
  if (!duration) return '00:00';

  if (typeof duration === 'string') {
    if (duration.includes(':')) {
      const parts = duration.split(':');
      // Nếu là HH:MM:SS, lược bỏ HH (giờ) chỉ lấy MM:SS
      if (parts.length === 3) {
        return `${parts[1]}:${parts[2]}`;
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

/**
 * Tạo màu sắc ngẫu nhiên cho nền của bài hát trong bảng xếp hạng
 */
const getRandomColor = () => {
  const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2', '#FFD166'];
  return colors[Math.floor(Math.random() * colors.length)];
};