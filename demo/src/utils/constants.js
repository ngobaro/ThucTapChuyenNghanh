export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/music';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Music Web';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/token',
  INTROSPECT: '/auth/introspect',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  USER_FAVORITES: (userId) => `/users/${userId}/favorites`,
  ADD_FAVORITE: (userId, songId) => `/users/${userId}/favorites/${songId}`,
  REMOVE_FAVORITE: (userId, songId) => `/users/${userId}/favorites/${songId}`,
  MY_INFO: '/users/myInfo',
  
  // Songs
  SONGS: '/songs',
  SONG_BY_ID: (id) => `/songs/${id}`,
  SONG_MY_INFO: '/songs/myInfo',
  
  // Playlists
  PLAYLISTS: '/playlists',
  PLAYLIST_BY_ID: (id) => `/playlists/${id}`,
  PLAYLIST_SONGS: (playlistId) => `/playlists/${playlistId}/songs`,
  ADD_SONG_TO_PLAYLIST: (playlistId, songId) => `/playlists/${playlistId}/songs/${songId}`,
  REMOVE_SONG_FROM_PLAYLIST: (playlistId, songId) => `/playlists/${playlistId}/songs/${songId}`,
  PLAYLIST_MY_INFO: '/playlists/myInfo',
  
  // Albums
  ALBUMS: '/albums',
  ALBUM_BY_ID: (id) => `/albums/${id}`,
  
  // Artists
  ARTISTS: '/artists',
  ARTIST_BY_ID: (id) => `/artists/${id}`,
  
  // Genres
  GENRES: '/genres',
  GENRE_BY_ID: (id) => `/genres/${id}`,
  GENRE_SONGS: (genreId) => `/genres/${genreId}/songs`,
  
  // Listen History
  LISTEN_HISTORIES: '/listenhistories',
  USER_HISTORY: (userId) => `/listenhistories/${userId}`,
};

export const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a'];

export const REPEAT_MODES = {
  OFF: false,
  ONE: 'one',
  ALL: 'all'
};

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LIBRARY: '/library',
  PLAYLIST: '/playlist/:id',
  ALBUM: '/album/:id',
  ARTIST: '/artist/:id',
  FAVORITES: '/favorites',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard', // Admin route
  LOGIN: '/login',
  REGISTER: '/register'
};