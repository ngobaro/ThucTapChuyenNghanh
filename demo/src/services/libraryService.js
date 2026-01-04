// FILE: demo/src/services/libraryService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * ============================================================
 * LOAD MAP NGHỆ SĨ (ARTIST ID -> ARTIST NAME)
 * ============================================================
 */
export const loadArtistsMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTISTS);
    const artistsMap = {};
    let artistsData = [];

    if (Array.isArray(response.data)) {
      artistsData = response.data;
    } else if (Array.isArray(response.data?.result)) {
      artistsData = response.data.result;
    } else if (Array.isArray(response.data?.data)) {
      artistsData = response.data.data;
    }

    artistsData.forEach(artist => {
      const artistId = artist.idartist || artist.id;
      const artistName = artist.artistname || artist.name || 'Unknown Artist';
      artistsMap[artistId] = artistName;
    });

    return artistsMap;
  } catch (_) {
    return {};
  }
};

/**
 * ============================================================
 * LOAD MAP QUAN HỆ NGHỆ SĨ - BÀI HÁT (SONG ID -> [ARTIST IDs])
 * ============================================================
 */
export const loadArtistSongMap = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
    const artistSongMap = {};
    let data = [];

    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response.data?.result)) {
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
  } catch (_) {
    return {};
  }
};

/**
 * ============================================================
 * LẤY USER ID (CACHE LOCALSTORAGE)
 * ============================================================
 */
export const getUserId = async () => {
  let currentUserId = localStorage.getItem('userId');

  if (!currentUserId) {
    try {
      const userRes = await api.get(API_ENDPOINTS.MY_INFO);
      const userData = userRes.data?.result || userRes.data;
      currentUserId =
        userData?.id ||
        userData?.userId ||
        userData?.id_user;

      if (currentUserId) {
        localStorage.setItem('userId', currentUserId.toString());
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return null;
    }
  }

  return Number(currentUserId);
};

/**
 * ============================================================
 * LẤY TOÀN BỘ LỊCH SỬ NGHE NHẠC CỦA USER
 * ============================================================
 */
export const fetchUserHistory = async (userId) => {
  try {
    const response = await api.get(API_ENDPOINTS.USER_HISTORY(userId));
    let historyData = [];

    if (Array.isArray(response.data)) {
      historyData = response.data;
    } else if (Array.isArray(response.data?.result)) {
      historyData = response.data.result;
    } else if (Array.isArray(response.data?.data)) {
      historyData = response.data.data;
    } else if (Array.isArray(response.data?.history)) {
      historyData = response.data.history;
    }

    // Sắp xếp lịch sử theo thời gian nghe (mới nhất trước)
    const getDate = (item) =>
      item.listen_date ||
      item.listenedAt ||
      item.listenDate ||
      item.listen_time ||
      item.date ||
      item.created_at ||
      item.time;

    historyData.sort((a, b) => {
      const dateA = getDate(a);
      const dateB = getDate(b);
      if (!dateA || !dateB) return 0;
      return new Date(dateB) - new Date(dateA);
    });

    return historyData;
  } catch (error) {
    throw error;
  }
};

/**
 * ============================================================
 * CHUYỂN 1 ITEM HISTORY -> OBJECT BÀI HÁT
 * ============================================================
 */
export const processHistoryToSong = async (
  historyItem,
  artistsMap,
  artistSongMap
) => {
  try {
    const songId =
      historyItem.idsong ||
      historyItem.songId ||
      historyItem.id_song ||
      historyItem.diêten ||
      historyItem.song_id ||
      historyItem.id;

    if (!songId) return null;

    const songResponse = await api.get(API_ENDPOINTS.SONG_BY_ID(songId));
    const song = songResponse.data.result || songResponse.data;
    if (!song) return null;

    const artistIds = artistSongMap[songId] || [];
    const artistName =
      artistIds
        .map(id => artistsMap[id])
        .filter(Boolean)
        .join(', ') ||
      song.artist ||
      song.artistname ||
      'Unknown Artist';

    const getListenDate = (item) =>
      item.listen_date ||
      item.listenedAt ||
      item.listenDate ||
      item.listen_time ||
      item.date ||
      item.created_at ||
      item.time;

    let listenedAt = new Date(getListenDate(historyItem) || Date.now());
    if (isNaN(listenedAt.getTime())) listenedAt = new Date();

    const playCount =
      historyItem.playCount ||
      historyItem.play_count ||
      historyItem.count ||
      song.views ||
      song.listens ||
      1;

    return {
      id: song.songId || song.id || songId,
      title: song.title || song.name || 'Unknown Title',
      artist: artistName,
      album: song.idalbum
        ? `Album ${song.idalbum}`
        : song.album || song.albumname || 'Single',
      duration: song.duration || 0,
      coverUrl:
        song.avatar ||
        song.cover ||
        song.image ||
        '/default-cover.png',
      audioUrl:
        song.path ||
        song.url ||
        song.audio_url ||
        '',
      listenedAt: getTimeAgo(listenedAt),
      rawListenDate: listenedAt,
      playCount,
      views: song.views || song.listens || 0,
      releaseDate:
        song.releasedate || song.release_date,
      genreId:
        song.genreId ||
        song.idgenre ||
        song.genre_id,
    };
  } catch (_) {
    return null;
  }
};

/**
 * ============================================================
 * LẤY DANH SÁCH BÀI HÁT NGHE NHIỀU (TỐI ĐA 18 BÀI)
 * ============================================================
 */
export const fetchOftenSongs = async () => {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('No user ID');

    const history = await fetchUserHistory(userId);
    if (history.length === 0) return [];

    // Trộn lịch sử và chọn 18 bài khác nhau theo songId
    const shuffledHistory = [...history].sort(() => 0.5 - Math.random());
    const selectedHistory = [];
    const seenSongIds = new Set();

    for (const item of shuffledHistory) {
      const songId =
        item.idsong ||
        item.songId ||
        item.id_song ||
        item.diêten ||
        item.song_id ||
        item.id;

      if (songId && !seenSongIds.has(songId)) {
        selectedHistory.push(item);
        seenSongIds.add(songId);
      }
      if (selectedHistory.length === 18) break;
    }

    // Load map nghệ sĩ song song
    const [artistsMap, artistSongMap] = await Promise.all([
      loadArtistsMap(),
      loadArtistSongMap(),
    ]);

    const songs = (
      await Promise.all(
        selectedHistory.map(item =>
          processHistoryToSong(item, artistsMap, artistSongMap)
        )
      )
    ).filter(Boolean);

    return songs;
  } catch (error) {
    throw error;
  }
};

/**
 * ============================================================
 * LẤY DANH SÁCH PLAYLIST TRONG THƯ VIỆN (KÈM SỐ BÀI HÁT)
 * ============================================================
 */
export const fetchLibraryPlaylists = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PLAYLISTS);
    const playlistData = response.data.result || response.data || [];

    const playlistsWithCount = await Promise.all(
      playlistData.map(async (p) => {
        try {
          const songsRes = await api.get(
            API_ENDPOINTS.PLAYLIST_SONGS(p.idplaylist || p.id)
          );
          const songCount =
            (songsRes.data.result || songsRes.data || []).length;
          return { ...p, songCount };
        } catch (_) {
          return { ...p, songCount: 0 };
        }
      })
    );

    const colors = [
      '#1DB954',
      '#FF6B6B',
      '#4ECDC4',
      '#FF9F1C',
      '#9D4EDD',
      '#06D6A0',
      '#118AB2',
      '#FFD166',
    ];

    return playlistsWithCount.map((p, i) => ({
      id: p.idplaylist || p.id,
      name: p.nameplaylist || p.name || 'Playlist không tên',
      songCount: p.songCount || 0,
      color: colors[i % colors.length],
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * ============================================================
 * FETCH TOÀN BỘ DỮ LIỆU THƯ VIỆN (PLAYLIST + OFTEN SONGS)
 * ============================================================
 */
export const fetchLibraryData = async () => {
  try {
    const [playlists, oftenSongs] = await Promise.all([
      fetchLibraryPlaylists(),
      fetchOftenSongs(),
    ]);

    return { playlists, oftenSongs };
  } catch (error) {
    throw error;
  }
};

/**
 * ============================================================
 * TIỆN ÍCH: TÍNH THỜI GIAN "BAO LÂU TRƯỚC"
 * ============================================================
 */
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};
