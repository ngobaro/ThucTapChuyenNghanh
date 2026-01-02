// FILE: demo/src/services/genreService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Load artists map
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let artistsData = [];

    if (Array.isArray(response.data)) {
      artistsData = response.data;
    } else if (response.data.result && Array.isArray(response.data.result)) {
      artistsData = response.data.result;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      artistsData = response.data.data;
    }

    artistsData.forEach(artist => {
      const artistId = artist.idartist || artist.id;
      const artistName = artist.artistname || artist.name || 'Unknown Artist';
      artistsMap[artistId] = artistName;
    });

    return artistsMap;
  } catch (error) {
    console.warn('Error loading artists:', error);
    return {};
  }
};

// Load artist-song map
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
    console.warn('Error loading artist songs:', error);
    return {};
  }
};

// Fetch genre details with processed songs
export const fetchGenreDetails = async (genreId) => {
  try {
    // Parallel fetches
    const [genreRes, songsRes, artistsMap, artistSongMap] = await Promise.all([
      api.get(API_ENDPOINTS.GENRE_BY_ID(genreId)),
      api.get(API_ENDPOINTS.GENRE_SONGS(genreId)),
      loadArtistsMap(),
      loadArtistSongMap()
    ]);

    const genreData = genreRes.data.result || genreRes.data;
    if (!genreData) throw new Error('Genre not found');

    let songsData = [];
    if (Array.isArray(songsRes.data)) {
      songsData = songsRes.data;
    } else if (songsRes.data.result && Array.isArray(songsRes.data.result)) {
      songsData = songsRes.data.result;
    } else if (songsRes.data.data && Array.isArray(songsRes.data.data)) {
      songsData = songsRes.data.data;
    }

    // Process songs with multi-artist mapping
    const processedSongs = songsData.map((song) => {
      const songId = song.songId || song.id;
      const artistIds = artistSongMap[songId] || [];

      const artistNames = artistIds
        .map(aId => artistsMap[aId] || 'Unknown Artist')
        .filter(name => name)
        .join(', ');

      const artistName = artistNames || song.artist || 'Unknown Artist';

      return {
        id: songId,
        title: song.title || 'Unknown Title',
        artist: artistName,
        album: song.idalbum || 'Single',
        duration: formatDuration(song.duration),
        coverUrl: song.avatar || '/default-cover.png',
        audioUrl: song.path || '',
        views: song.views || 0,
        releaseDate: song.releasedate,
        genreId: song.genreId || parseInt(genreId),
        color: getColorByGenre(parseInt(genreId))
      };
    });

    const genre = {
      id: parseInt(genreId),
      name: genreData.genrename || genreData.name || 'Thể loại',
      description: getDescription(genreData.genrename || genreData.name),
      color: getColorByGenre(parseInt(genreId)),
      songCount: processedSongs.length
    };

    return { genre, songs: processedSongs };
  } catch (error) {
    console.error('Error fetching genre details:', error);
    throw error;
  }
};

// Fetch genres list with song counts
export const fetchGenresList = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.GENRES);
    let genresData = [];

    if (Array.isArray(response.data)) {
      genresData = response.data;
    } else if (response.data.result && Array.isArray(response.data.result)) {
      genresData = response.data.result;
    }

    // Get song count for each genre parallel
    const genresWithCounts = await Promise.all(
      genresData.map(async (genre) => {
        try {
          const songsResponse = await api.get(API_ENDPOINTS.GENRE_SONGS(genre.idgenre || genre.id));
          let songs = [];

          if (Array.isArray(songsResponse.data)) {
            songs = songsResponse.data;
          } else if (songsResponse.data.result && Array.isArray(songsResponse.data.result)) {
            songs = songsResponse.data.result;
          } else if (songsResponse.data.data && Array.isArray(songsResponse.data.data)) {
            songs = songsResponse.data.data;
          }

          return {
            id: genre.idgenre || genre.id,
            name: genre.genrename || genre.name || 'Unknown Genre',
            count: songs.length,
            color: getColorByGenreId(genre.idgenre || genre.id),
            description: getDescriptionByGenre(genre.genrename || genre.name)
          };
        } catch (error) {
          console.error(`Error loading songs for genre ${genre.idgenre}:`, error);
          return {
            id: genre.idgenre || genre.id,
            name: genre.genrename || genre.name || 'Unknown Genre',
            count: 0,
            color: getColorByGenreId(genre.idgenre || genre.id),
            description: getDescriptionByGenre(genre.genrename || genre.name)
          };
        }
      })
    );

    return genresWithCounts;
  } catch (error) {
    console.error('Error loading genres list:', error);
    return []; // No mock, return empty
  }
};

// Utility functions
const getColorByGenre = (genreId) => {
  const colors = {
    1: '#1DB954',
    2: '#FF6B6B',
    3: '#4ECDC4',
    4: '#FF9F1C',
    5: '#9D4EDD',
    6: '#06D6A0',
    7: '#118AB2',
    8: '#FFD166',
  };
  return colors[genreId] || '#666';
};

const getDescription = (genreName) => {
  const descriptions = {
    'Pop': 'Nhạc Pop phổ biến nhất hiện nay với giai điệu bắt tai và dễ nghe.',
    'Hip Hop': 'Hip Hop đỉnh cao với những bản rap chất lượng và beat mạnh mẽ.',
    'Rock': 'Rock mạnh mẽ, cá tính với guitar điện và trống sôi động.',
    'R&B': 'R&B nhẹ nhàng, sâu lắng với giai điệu quyến rũ.',
    'Jazz': 'Jazz tinh tế với những giai điệu phức tạp và nghệ thuật.',
    'Electronic': 'Electronic Dance Music sôi động, hoàn hảo cho các bữa tiệc.',
    'Country': 'Country dân dã, gần gũi với cuộc sống và tình cảm chân thật.',
    'Indie': 'Indie độc lập và sáng tạo, mang hơi thở mới mẻ.'
  };
  return descriptions[genreName] || 'Khám phá những bài hát tuyệt vời trong thể loại này.';
};

const getColorByGenreId = (id) => {
  const colors = {
    1: '#1DB954',
    2: '#FF6B6B',
    3: '#4ECDC4',
    4: '#FF9F1C',
    5: '#9D4EDD',
    6: '#06D6A0',
    7: '#118AB2',
    8: '#FFD166'
  };
  return colors[id] || '#666';
};

const getDescriptionByGenre = (name) => {
  const descriptions = {
    'Pop': 'Nhạc Pop phổ biến nhất hiện nay',
    'Hip Hop': 'Hip Hop với beat mạnh mẽ',
    'Rock': 'Rock cá tính và sôi động',
    'R&B': 'R&B nhẹ nhàng, sâu lắng',
    'Jazz': 'Jazz tinh tế và nghệ thuật',
    'Electronic': 'EDM sôi động cho các bữa tiệc',
    'Country': 'Country dân dã, gần gũi',
    'Indie': 'Indie độc lập và sáng tạo'
  };
  return descriptions[name] || 'Khám phá âm nhạc theo thể loại này';
};

const formatDuration = (duration) => {
  if (!duration) return '00:00';

  if (typeof duration === 'string') {
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 3) {
        return `${parts[0]}:${parts[1]}`;
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