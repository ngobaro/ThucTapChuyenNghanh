// FILE: demo/src/services/songService.js

import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Lấy tất cả bài hát
export const getAllSongs = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.SONGS, { params });
    console.log('getAllSongs response:', response.data); // Debug
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
    // Kiểm tra xem endpoint nào phù hợp
    const response = await api.get(API_ENDPOINTS.SONGS, {
      params: { genre: genreId }
    });
    console.log(`getGenreSongs for genre ${genreId}:`, response.data);
    
    // Nếu API trả về định dạng khác, điều chỉnh ở đây
    return response.data;
  } catch (error) {
    console.error(`Error getting songs for genre ${genreId}:`, error);
    
    // Nếu endpoint không tồn tại, trả về dữ liệu mẫu
    console.warn('Using mock data for genre songs');
    
    // Dữ liệu mẫu dựa trên genreId
    const genreData = {
      1: { name: 'Pop', color: '#1DB954' },
      2: { name: 'Hip Hop', color: '#FF6B6B' },
      3: { name: 'Rock', color: '#4ECDC4' },
      4: { name: 'R&B', color: '#FF9F1C' },
      5: { name: 'Jazz', color: '#9D4EDD' },
      6: { name: 'Electronic', color: '#06D6A0' },
    };
    
    const currentGenre = genreData[genreId] || { name: 'Unknown', color: '#666' };
    
    const mockSongs = [
      {
        id: 1,
        title: `Bài hát ${currentGenre.name} 1`,
        artist: 'Nghệ sĩ 1',
        genre: currentGenre.name,
        duration: '3:45',
        cover: 'https://picsum.photos/100/100',
        likes: 1245,
        plays: 45000,
        color: currentGenre.color
      },
      {
        id: 2,
        title: `Bài hát ${currentGenre.name} 2`,
        artist: 'Nghệ sĩ 2',
        genre: currentGenre.name,
        duration: '4:20',
        cover: 'https://picsum.photos/100/100',
        likes: 987,
        plays: 32000,
        color: currentGenre.color
      },
      {
        id: 3,
        title: `Bài hát ${currentGenre.name} 3`,
        artist: 'Nghệ sĩ 3',
        genre: currentGenre.name,
        duration: '3:15',
        cover: 'https://picsum.photos/100/100',
        likes: 654,
        plays: 21000,
        color: currentGenre.color
      },
      {
        id: 4,
        title: `Bài hát ${currentGenre.name} 4`,
        artist: 'Nghệ sĩ 4',
        genre: currentGenre.name,
        duration: '5:10',
        cover: 'https://picsum.photos/100/100',
        likes: 321,
        plays: 15000,
        color: currentGenre.color
      },
      {
        id: 5,
        title: `Bài hát ${currentGenre.name} 5`,
        artist: 'Nghệ sĩ 5',
        genre: currentGenre.name,
        duration: '3:55',
        cover: 'https://picsum.photos/100/100',
        likes: 210,
        plays: 9800,
        color: currentGenre.color
      }
    ];
    
    return {
      result: mockSongs,
      total: mockSongs.length,
      genre: currentGenre
    };
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