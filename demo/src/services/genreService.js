// FILE: demo/src/services/genreService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Random 1 trong 7 màu
 */
const getRandomColor = () => {
  const colors = [
    '#1DB954',
    '#FF6B6B',
    '#4ECDC4',
    '#FF9F1C',
    '#9D4EDD',
    '#06D6A0',
    '#118AB2'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Load artists map
 * { artistId: artistName }
 */
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let data = [];

    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response.data?.result)) {
      data = response.data.result;
    } else if (Array.isArray(response.data?.data)) {
      data = response.data.data;
    }

    data.forEach(artist => {
      const id = artist.idartist || artist.id;
      const name = artist.artistname || artist.name || 'Unknown Artist';
      if (id) artistsMap[id] = name;
    });

    return artistsMap;
  } catch {
    return {};
  }
};

/**
 * Load artist–song map
 * { songId: [artistId] }
 */
export const loadArtistSongMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
    const map = {};
    let data = [];

    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response.data?.result)) {
      data = response.data.result;
    }

    data.forEach(item => {
      if (!item.idsong || !item.idartist) return;
      if (!map[item.idsong]) map[item.idsong] = [];
      map[item.idsong].push(item.idartist);
    });

    return map;
  } catch {
    return {};
  }
};

/**
 * Fetch genre details + songs
 */
export const fetchGenreDetails = async (genreId) => {
  const [genreRes, songsRes, artistsMap, artistSongMap] = await Promise.all([
    api.get(API_ENDPOINTS.GENRE_BY_ID(genreId)),
    api.get(API_ENDPOINTS.GENRE_SONGS(genreId)),
    loadArtistsMap(),
    loadArtistSongMap()
  ]);

  const genreData = genreRes.data?.result || genreRes.data;
  if (!genreData) throw new Error();

  let songsData = [];
  if (Array.isArray(songsRes.data)) {
    songsData = songsRes.data;
  } else if (Array.isArray(songsRes.data?.result)) {
    songsData = songsRes.data.result;
  } else if (Array.isArray(songsRes.data?.data)) {
    songsData = songsRes.data.data;
  }

  const songs = songsData.map(song => {
    const songId = song.songId || song.id;
    const artistIds = artistSongMap[songId] || [];

    const artistName =
      artistIds.map(id => artistsMap[id] || 'Unknown Artist').join(', ') ||
      song.artist ||
      'Unknown Artist';

    return {
      id: songId,
      title: song.title || song.name || 'Unknown Title',
      artist: artistName,
      album: song.album || song.albumname || song.idalbum || 'Single',
      duration: formatDuration(song.duration),
      coverUrl: song.avatar || song.cover || '/default-cover.png',
      audioUrl: song.path || song.url || '',
      views: song.views || song.listens || 0,
      releaseDate: song.releasedate || song.release_date,
      genreId: song.genreId || Number(genreId),
      color: getRandomColor()
    };
  });

  return {
    genre: {
      id: Number(genreId),
      name: genreData.genrename || genreData.name || 'Thể loại',
      songCount: songs.length,
      color: getRandomColor()
    },
    songs
  };
};

/**
 * Fetch genres list + song count
 */
export const fetchGenresList = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.GENRES);
    let genresData = [];

    if (Array.isArray(response.data)) {
      genresData = response.data;
    } else if (Array.isArray(response.data?.result)) {
      genresData = response.data.result;
    }

    const genres = await Promise.all(
      genresData.map(async genre => {
        try {
          const songsRes = await api.get(
            API_ENDPOINTS.GENRE_SONGS(genre.idgenre || genre.id)
          );

          let songs = [];
          if (Array.isArray(songsRes.data)) {
            songs = songsRes.data;
          } else if (Array.isArray(songsRes.data?.result)) {
            songs = songsRes.data.result;
          } else if (Array.isArray(songsRes.data?.data)) {
            songs = songsRes.data.data;
          }

          return {
            id: genre.idgenre || genre.id,
            name: genre.genrename || genre.name || 'Unknown Genre',
            count: songs.length,
            color: getRandomColor()
          };
        } catch {
          return {
            id: genre.idgenre || genre.id,
            name: genre.genrename || genre.name || 'Unknown Genre',
            count: 0,
            color: getRandomColor()
          };
        }
      })
    );

    return genres;
  } catch {
    return [];
  }
};

/**
 * Format duration
 */
const formatDuration = (duration) => {
  if (!duration) return '00:00';

  if (typeof duration === 'string') return duration;

  if (typeof duration === 'number') {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return '00:00';
};
