// FILE: demo/src/services/profileService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getMySongs } from './songService'; // Tái sử dụng hàm lấy danh sách bài hát cá nhân

/**
 * Tải dữ liệu tổng hợp cho trang Hồ sơ (Profile)
 * Bao gồm: Thông tin người dùng (User) và danh sách bài hát đã tải lên (My Songs)
 */
export const fetchProfileData = async () => {
  try {
    // ============================================================
    // BƯỚC 1: TRUY VẤN DỮ LIỆU SONG SONG
    // Sử dụng Promise.all để tối ưu hóa thời gian tải bằng cách gọi 
    // tất cả các API cần thiết cùng một lúc.
    // ============================================================
    const [resArt, resArtSong, resAlb, userRes] = await Promise.all([
      api.get(API_ENDPOINTS.ARTISTS),
      api.get(API_ENDPOINTS.ARTIST_SONGS.BASE),
      api.get(API_ENDPOINTS.ALBUMS),
      api.get(API_ENDPOINTS.MY_INFO)
    ]);

    // ============================================================
    // BƯỚC 2: XỬ LÝ BẢN ĐỒ TRA CỨU (MAPPING)
    // Chuyển đổi dữ liệu mảng thô thành các Object (Key-Value) để
    // truy xuất thông tin nhanh chóng khi duyệt danh sách bài hát.
    // ============================================================

    // Xử lý bản đồ Nghệ sĩ (ID -> Tên)
    const aMap = {};
    const artistsData = resArt.data.result || resArt.data || [];
    artistsData.forEach(a => {
      const artistId = a.idartist || a.id;
      aMap[artistId] = a.artistname || a.name || 'Unknown Artist';
    });

    // Xử lý bản đồ Quan hệ Nghệ sĩ - Bài hát (Song ID -> [Artist IDs])
    const asMap = {};
    const artSongData = resArtSong.data.result || resArtSong.data || [];
    artSongData.forEach(item => {
      const songId = item.idsong;
      const artistId = item.idartist;
      if (songId && artistId) {
        if (!asMap[songId]) asMap[songId] = [];
        asMap[songId].push(artistId);
      }
    });

    // Xử lý bản đồ Album (ID -> Tên Album)
    const albMap = {};
    const albumsData = resAlb.data.result || resAlb.data || [];
    albumsData.forEach(al => {
      const albumId = al.idalbum || al.id;
      albMap[albumId] = al.albumname || al.title || 'Single';
    });

    // Trích xuất thông tin người dùng hiện tại
    const user = userRes.data.result || userRes.data || null;

    // ============================================================
    // BƯỚC 3: XỬ LÝ DANH SÁCH BÀI HÁT CỦA TÔI
    // Định dạng lại dữ liệu bài hát kết hợp với các bản đồ đã tạo ở Bước 2.
    // ============================================================
    let mySongs = [];
    try {
      const songsRes = await getMySongs();
      const rawSongs = songsRes.data.result || songsRes.data || [];
      
      mySongs = rawSongs.map(song => {
        const sId = song.songId || song.id;
        
        // Tìm và nối tên các nghệ sĩ tham gia bài hát từ Map
        const artistNames = (asMap[sId] || [])
          .map(id => aMap[id])
          .filter(name => name)
          .join(', ') || song.artist || 'Unknown Artist';

        return {
          ...song,
          id: sId,
          artist: artistNames,
          album: albMap[song.idalbum] || song.album || 'Single',
          coverUrl: song.avatar || '/default-cover.png',
        };
      });
    } catch (songErr) {
      // Nếu có lỗi khi lấy danh sách bài hát, trả về mảng rỗng thay vì làm lỗi cả trang Profile
      mySongs = [];
    }

    // Trả về kết quả cuối cùng cho Component xử lý hiển thị
    return { user, mySongs };
    
  } catch (error) {
    // Chuyển tiếp lỗi để Component có thể hiển thị thông báo lỗi (UI error boundary)
    throw error;
  }
};