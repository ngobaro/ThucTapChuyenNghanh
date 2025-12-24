// FILE: demo/src/utils/constants.js

// =======================
// API & APP CONFIG
// =======================

// Base URL cho toàn bộ API
// Ưu tiên lấy từ biến môi trường VITE_API_BASE_URL
// Nếu không có thì dùng mặc định localhost:8080/music
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/music';

// Tên ứng dụng hiển thị (title, header, v.v.)
// Có thể cấu hình qua biến môi trường
export const APP_NAME =
  import.meta.env.VITE_APP_NAME || 'Music Web';


// =======================
// API ENDPOINTS
// Nơi định nghĩa toàn bộ đường dẫn API backend
// =======================

export const API_ENDPOINTS = {

  // ===== AUTH (Xác thực) =====

  // Đăng nhập -> trả về access token
  LOGIN: '/auth/token',

  // Kiểm tra token còn hợp lệ không
  INTROSPECT: '/auth/introspect',

  // Refresh access token
  REFRESH: '/auth/refresh',

  // Đăng xuất (thu hồi token)
  LOGOUT: '/auth/logout',


  // ===== USERS =====

  // Lấy danh sách user (admin)
  USERS: '/users',

  // Lấy user theo ID
  USER_BY_ID: (id) => `/users/${id}`,

  // Danh sách bài hát yêu thích của user
  USER_FAVORITES: (userId) => `/users/${userId}/favorites`,

  // Thêm bài hát vào yêu thích
  ADD_FAVORITE: (userId, songId) =>
    `/users/${userId}/favorites/${songId}`,

  // Xóa bài hát khỏi yêu thích
  REMOVE_FAVORITE: (userId, songId) =>
    `/users/${userId}/favorites/${songId}`,

  // Lấy thông tin user đang đăng nhập
  MY_INFO: '/users/myInfo',


  // ===== SONGS =====

  // Lấy danh sách bài hát
  SONGS: '/songs',

  // Lấy chi tiết bài hát theo ID
  SONG_BY_ID: (id) => `/songs/${id}`,

  // Lấy thông tin bài hát theo user (vd: đã like chưa)
  SONG_MY_INFO: '/songs/myInfo',


  // ===== PLAYLISTS =====

  // Danh sách playlist
  PLAYLISTS: '/playlists',

  // Chi tiết playlist theo ID
  PLAYLIST_BY_ID: (id) => `/playlists/${id}`,

  // Danh sách bài hát trong playlist
  PLAYLIST_SONGS: (playlistId) =>
    `/playlists/${playlistId}/songs`,

  // Thêm bài hát vào playlist
  ADD_SONG_TO_PLAYLIST: (playlistId, songId) =>
    `/playlists/${playlistId}/songs/${songId}`,

  // Xóa bài hát khỏi playlist
  REMOVE_SONG_FROM_PLAYLIST: (playlistId, songId) =>
    `/playlists/${playlistId}/songs/${songId}`,

  // Playlist của user đang đăng nhập (nếu backend hỗ trợ)
  PLAYLIST_MY_INFO: '/playlists/myInfo',


  // ===== ALBUMS =====

  // Danh sách album
  ALBUMS: '/albums',

  // Chi tiết album
  ALBUM_BY_ID: (id) => `/albums/${id}`,


  // ===== ARTISTS =====

  // Danh sách nghệ sĩ
  ARTISTS: '/artists',

  // Chi tiết nghệ sĩ
  ARTIST_BY_ID: (id) => `/artists/${id}`,


  // ===== ARTIST - SONG RELATION =====
  // Bảng trung gian giữa nghệ sĩ và bài hát

  ARTIST_SONGS: {
    // Base endpoint
    BASE: '/artistsongs',

    // Lấy bài hát theo nghệ sĩ
    BY_ARTIST: (artistId) =>
      `/artistsongs/artist/${artistId}`,

    // Lấy nghệ sĩ theo bài hát
    BY_SONG: (songId) =>
      `/artistsongs/song/${songId}`,
  },


  // ===== GENRES =====

  // Danh sách thể loại
  GENRES: '/genres',

  // Chi tiết thể loại
  GENRE_BY_ID: (id) => `/genres/${id}`,

  // Danh sách bài hát theo thể loại
  GENRE_SONGS: (genreId) =>
    `/genres/${genreId}/songs`,

  // Thêm bài hát vào thể loại (Admin)
  ADD_SONG_TO_GENRE: (genreId, songId) =>
    `/genres/${genreId}/songs/${songId}`,

  // Xóa bài hát khỏi thể loại (Admin)
  REMOVE_SONG_FROM_GENRE: (genreId, songId) =>
    `/genres/${genreId}/songs/${songId}`,


  // ===== LISTEN HISTORY =====

  // Danh sách lịch sử nghe nhạc
  LISTEN_HISTORIES: '/listenhistories',

  // Lịch sử nghe nhạc của user
  USER_HISTORY: (userId) =>
    `/listenhistories/${userId}`,
};


// =======================
// AUDIO CONFIG
// =======================

// Các định dạng audio được hỗ trợ
export const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a'];


// =======================
// PLAYER CONFIG
// =======================

// Các chế độ lặp bài hát
export const REPEAT_MODES = {
  // Không lặp
  OFF: false,

  // Lặp 1 bài
  ONE: 'one',

  // Lặp toàn bộ playlist
  ALL: 'all'
};


// =======================
// ROUTES (React Router)
// =======================

// Định nghĩa toàn bộ route frontend
export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LIBRARY: '/library',
  PLAYLIST: '/playlist/:id',
  ALBUM: '/album/:id',
  ARTIST: '/artist/:id',
  FAVORITES: '/favorites',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard', // Trang admin
  LOGIN: '/login',
  REGISTER: '/register'
};
