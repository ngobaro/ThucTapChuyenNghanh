import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Lấy playlists của user
export const getUserPlaylists = async () => {
  const response = await api.get(API_ENDPOINTS.PLAYLIST_MY_INFO);
  return response.data;
};

// Lấy tất cả playlists
export const getAllPlaylists = async () => {
  const response = await api.get(API_ENDPOINTS.PLAYLISTS);
  return response.data;
};

// Tạo playlist mới
export const createPlaylist = async (data) => {
  const response = await api.post(API_ENDPOINTS.PLAYLISTS, data);
  return response.data;
};

// Lấy chi tiết playlist
export const getPlaylistById = async (id) => {
  const response = await api.get(API_ENDPOINTS.PLAYLIST_BY_ID(id));
  return response.data;
};

// Lấy danh sách bài hát trong playlist
export const getPlaylistSongs = async (playlistId) => {
  const response = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(playlistId));
  return response.data;
};

// Thêm bài hát vào playlist
export const addSongToPlaylist = async (playlistId, songId) => {
  const response = await api.post(
    API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, songId)
  );
  return response.data;
};

// Xóa bài hát khỏi playlist
export const removeSongFromPlaylist = async (playlistId, songId) => {
  const response = await api.delete(
    API_ENDPOINTS.REMOVE_SONG_FROM_PLAYLIST(playlistId, songId)
  );
  return response.data;
};

// Cập nhật playlist
export const updatePlaylist = async (id, data) => {
  const response = await api.put(API_ENDPOINTS.PLAYLIST_BY_ID(id), data);
  return response.data;
};

// Xóa playlist
export const deletePlaylist = async (id) => {
  const response = await api.delete(API_ENDPOINTS.PLAYLIST_BY_ID(id));
  return response.data;
};