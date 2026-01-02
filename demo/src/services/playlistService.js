// FILE: demo/src/services/playlistService.js (updated with detail fetch)
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Existing CRUD...
export const getUserPlaylists = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PLAYLIST_MY_INFO);
    return response.data;
  } catch (error) {
    console.error('Error getting user playlists:', error);
    throw error;
  }
};

export const getAllPlaylists = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PLAYLISTS);
    return response.data;
  } catch (error) {
    console.error('Error getting all playlists:', error);
    throw error;
  }
};

export const createPlaylist = async (data) => {
  try {
    const response = await api.post(API_ENDPOINTS.PLAYLISTS, data);
    return response.data;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

export const getPlaylistById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.PLAYLIST_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error getting playlist ${id}:`, error);
    throw error;
  }
};

export const getPlaylistSongs = async (playlistId) => {
  try {
    const response = await api.get(API_ENDPOINTS.PLAYLIST_SONGS(playlistId));
    return response.data;
  } catch (error) {
    console.error(`Error getting songs for playlist ${playlistId}:`, error);
    throw error;
  }
};

export const addSongToPlaylist = async (playlistId, songId) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.ADD_SONG_TO_PLAYLIST(playlistId, songId)
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding song ${songId} to playlist ${playlistId}:`, error);
    throw error;
  }
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    const response = await api.delete(
      API_ENDPOINTS.REMOVE_SONG_FROM_PLAYLIST(playlistId, songId)
    );
    return response.data;
  } catch (error) {
    console.error(`Error removing song ${songId} from playlist ${playlistId}:`, error);
    throw error;
  }
};

export const updatePlaylist = async (id, data) => {
  try {
    const response = await api.put(API_ENDPOINTS.PLAYLIST_BY_ID(id), data);
    return response.data;
  } catch (error) {
    console.error(`Error updating playlist ${id}:`, error);
    throw error;
  }
};

export const deletePlaylist = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.PLAYLIST_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting playlist ${id}:`, error);
    throw error;
  }
};

// NEW: Fetch full playlist details with processed songs
export const fetchPlaylistDetails = async (playlistId) => {
  try {
    // Parallel fetches
    const [playlistRes, songsRes, artistsRes, artistSongsRes, albumsRes] = await Promise.all([
      api.get(API_ENDPOINTS.PLAYLIST_BY_ID(playlistId)),
      api.get(API_ENDPOINTS.PLAYLIST_SONGS(playlistId)),
      api.get(API_ENDPOINTS.ARTISTS),
      api.get(API_ENDPOINTS.ARTIST_SONGS.BASE),
      api.get(API_ENDPOINTS.ALBUMS)
    ]);

    // Process artists map
    const artistsMap = {};
    const artistsData = artistsRes.data.result || artistsRes.data || [];
    artistsData.forEach(artist => {
      const artistId = artist.idartist || artist.id;
      artistsMap[artistId] = artist.artistname || artist.name || 'Unknown Artist';
    });

    // Process artist-song map
    const artistSongMap = {};
    const artSongData = artistSongsRes.data.result || artistSongsRes.data || [];
    artSongData.forEach(item => {
      const songId = item.idsong;
      const artistId = item.idartist;
      if (songId && artistId) {
        if (!artistSongMap[songId]) artistSongMap[songId] = [];
        artistSongMap[songId].push(artistId);
      }
    });

    // Process albums map
    const albumMap = {};
    const albumsData = albumsRes.data.result || albumsRes.data || [];
    albumsData.forEach(album => {
      const albumId = album.idalbum || album.id;
      albumMap[albumId] = album.albumname || album.title || 'Unknown Album';
    });

    // Playlist data
    const playlistData = playlistRes.data.result || playlistRes.data;
    if (!playlistData) throw new Error('Playlist not found');

    // Creator name
    let creatorName = 'Unknown User';
    if (playlistData.iduser) {
      try {
        const userRes = await api.get(API_ENDPOINTS.USER_BY_ID(playlistData.iduser));
        const user = userRes.data.result || userRes.data;
        creatorName = user.username || 'Unknown User';
      } catch (e) {
        console.warn('Creator fetch failed:', e);
      }
    }

    // Raw songs
    let rawSongs = songsRes.data.result || songsRes.data.data || songsRes.data || [];
    if (!Array.isArray(rawSongs)) rawSongs = [];

    // Process detailed songs
    const detailedSongs = await Promise.all(
      rawSongs.map(async (item) => {
        const songId = item.idsong || item.songId;
        if (!songId) return null;

        try {
          const songRes = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
          const song = songRes.data.result || songRes.data;
          if (!song) return null;

          const genreId = song.idgenre || song.genreId || song.genre_id || 1;
          const genreName = getGenreName(genreId);
          const genreColor = getGenreColor(genreId);

          const artistIds = artistSongMap[songId] || [];
          const artistNames = artistIds
            .map(aId => artistsMap[aId] || 'Unknown Artist')
            .filter(name => name)
            .join(', ');
          const artistName = artistNames || song.artist || song.artistname || 'Unknown Artist';

          const albumId = song.idalbum || song.albumId;
          const albumName = albumMap[albumId] || null;
          const finalAlbum = albumName || `${song.title || 'Unknown'} (${artistName})`;

          return {
            id: song.songId || song.id || songId,
            title: song.title || 'Unknown Title',
            artist: artistName,
            album: finalAlbum,
            duration: song.duration,
            coverUrl: song.avatar || song.cover || song.image || '/default-cover.png',
            audioUrl: song.path || song.url || song.audio_url || '',
            views: song.views || song.listens || 0,
            genreId,
            genreName,
            genreColor,
            releaseDate: song.releasedate || song.release_date,
          };
        } catch (err) {
          console.error(`Song ${songId} fetch error:`, err);
          return null;
        }
      })
    );

    const validSongs = detailedSongs.filter(Boolean);
    const totalDuration = calculateTotalDuration(validSongs);

    const playlist = {
      id: playlistData.idplaylist || playlistData.id,
      name: playlistData.nameplaylist || playlistData.name || 'Playlist',
      description: playlistData.description || 'Khám phá playlist này',
      creator: creatorName,
      createdDate: formatDate(playlistData.createdDate || playlistData.createdAt || new Date()),
      songCount: validSongs.length,
      duration: totalDuration,
      color: getPlaylistColor(playlistId)
    };

    return { playlist, songs: validSongs };
  } catch (error) {
    console.error('Error fetching playlist details:', error);
    throw error;
  }
};

// Utility functions (moved from page)
const getGenreName = (id) => {
  const map = { 1: 'Pop', 2: 'Hip Hop', 3: 'Rock', 4: 'R&B', 5: 'Jazz', 6: 'Electronic', 7: 'Country', 8: 'Indie' };
  return map[id] || 'Khác';
};

const getGenreColor = (id) => {
  const colors = { 1: '#1DB954', 2: '#FF6B6B', 3: '#4ECDC4', 4: '#FF9F1C', 5: '#9D4EDD', 6: '#06D6A0', 7: '#118AB2', 8: '#FFD166' };
  return colors[id] || '#888';
};

const getPlaylistColor = (id) => {
  const colors = ['#1DB954', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#9D4EDD', '#06D6A0', '#118AB2'];
  const index = id ? parseInt(id.toString().slice(-1)) % colors.length : 0;
  return colors[index];
};

const calculateTotalDuration = (songsList) => {
  let totalSeconds = 0;
  songsList.forEach(s => {
    const raw = s.duration;
    if (typeof raw === 'number') totalSeconds += raw;
    else if (typeof raw === 'string' && raw.includes(':')) {
      const parts = raw.split(':').map(Number);
      if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
      else if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  });
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
};

const formatDate = (d) => {
  if (!d) return 'Không rõ';
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
};