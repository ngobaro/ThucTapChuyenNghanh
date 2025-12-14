import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Lấy tất cả bài hát
export const getAllSongs = async (params = {}) => {
  const response = await api.get(API_ENDPOINTS.SONGS, { params });
  return response.data;
};

// Lấy bài hát theo ID
export const getSongById = async (id) => {
  const response = await api.get(API_ENDPOINTS.SONG_BY_ID(id));
  return response.data;
};

// Tìm kiếm bài hát (nếu backend support search param)
export const searchSongs = async (query) => {
  const response = await api.get(API_ENDPOINTS.SONGS, {
    params: { search: query }
  });
  return response.data;
};

// Tạo bài hát mới
export const createSong = async (data) => {
  const response = await api.post(API_ENDPOINTS.SONGS, data);
  return response.data;
};

// Cập nhật bài hát
export const updateSong = async (id, data) => {
  const response = await api.put(API_ENDPOINTS.SONG_BY_ID(id), data);
  return response.data;
};

// Xóa bài hát
export const deleteSong = async (id) => {
  const response = await api.delete(API_ENDPOINTS.SONG_BY_ID(id));
  return response.data;
};

// Lấy thông tin bài hát của tôi
export const getMySongs = async () => {
  const response = await api.get(API_ENDPOINTS.SONG_MY_INFO);
  return response.data;
};