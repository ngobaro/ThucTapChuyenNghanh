// FILE: demo/src/services/songService.js

import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Lấy tất cả bài hát
export const getAllSongs = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.SONGS, { params });
    return response.data;
  } catch (error) {
    console.error('Error in getAllSongs:', error);
    throw error;
  }
};

// Lấy bài hát theo ID
export const getSongById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.SONG_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error getting song ${id}:`, error);
    throw error;
  }
};

// Lấy bài hát theo thể loại
export const getGenreSongs = async (genreId) => {
  try {
    const response = await api.get(API_ENDPOINTS.SONGS, {
      params: { genre: genreId }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error getting songs for genre ${genreId}:`, error);
    throw error;
  }
};

// Tìm kiếm bài hát
export const searchSongs = async (query) => {
  try {
    const response = await api.get(API_ENDPOINTS.SONGS, {
      params: { search: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching songs:', error);
    throw error;
  }
};

// Tạo bài hát mới
export const createSong = async (data) => {
  try {
    const response = await api.post(API_ENDPOINTS.SONGS, data);
    return response.data;
  } catch (error) {
    console.error('Error creating song:', error);
    throw error;
  }
};

// Cập nhật bài hát
export const updateSong = async (id, data) => {
  try {
    const response = await api.put(API_ENDPOINTS.SONG_BY_ID(id), data);
    return response.data;
  } catch (error) {
    console.error(`Error updating song ${id}:`, error);
    throw error;
  }
};

// Xóa bài hát
export const deleteSong = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.SONG_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting song ${id}:`, error);
    throw error;
  }
};

// Lấy thông tin bài hát của tôi
export const getMySongs = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.SONG_MY_INFO);
    return response.data;
  } catch (error) {
    console.error('Error getting my songs:', error);
    throw error;
  }
};

// Lấy artist của bài hát (nếu endpoint tồn tại)
export const getSongArtists = async (songId) => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BY_SONG(songId));
    return response.data;
  } catch (error) {
    console.error(`Error getting artists for song ${songId}:`, error);
    
    // Nếu endpoint không tồn tại, trả về mảng rỗng
    if (error.response?.status === 404) {
      console.warn(`Endpoint ${API_ENDPOINTS.ARTIST_SONGS.BY_SONG(songId)} not found`);
      return { result: [] };
    }
    throw error;
  }
};