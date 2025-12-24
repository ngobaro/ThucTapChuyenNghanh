// FILE: demo/src/context/PlayerContext.jsx
import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedSongId, setLastSavedSongId] = useState(null);

  // ==================== FAVORITES STATE ====================
  const [favoriteStates, setFavoriteStates] = useState({});
  const [userId, setUserId] = useState(null);
  const [favoritesInitialized, setFavoritesInitialized] = useState(false);

  // SỬA: THÊM state throttle ở đây (top-level, trước functions)
  const [lastListenIncrement, setLastListenIncrement] = useState(null);  // Timestamp cuối +1

  // ==================== FETCH USER ID ====================
  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const parsedId = Number(storedUserId);
        if (!isNaN(parsedId)) {
          setUserId(parsedId);
          return;
        }
      }

      try {
        const res = await api.get(API_ENDPOINTS.MY_INFO);
        const userData = res.data?.result || res.data;
        const fetchedId = userData?.id || userData?.userId;
        if (fetchedId) {
          const id = Number(fetchedId);
          setUserId(id);
          localStorage.setItem('userId', id.toString());
        }
      } catch (err) {
        console.error('Fetch userId error:', err);
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    };

    fetchUserId();
  }, []);

  // ==================== LOAD FAVORITES ====================
  useEffect(() => {
    if (userId && !favoritesInitialized) {
      loadFavorites();
    }
  }, [userId, favoritesInitialized]);

  const loadFavorites = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await api.get(API_ENDPOINTS.USER_FAVORITES(userId));
      const favSongs = res.data?.result || [];
      const favMap = {};
      favSongs.forEach(song => {
        const id = song.songId || song.id;
        if (id) favMap[id] = true;
      });
      setFavoriteStates(favMap);
      setFavoritesInitialized(true);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoritesInitialized(true);
    }
  }, [userId]);

  const toggleFavorite = useCallback(async (songId) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để sử dụng chức năng này');
      return false;
    }

    const isFavorited = !!favoriteStates[songId];

    setFavoriteStates(prev => ({
      ...prev,
      [songId]: !isFavorited
    }));

    try {
      if (isFavorited) {
        await api.delete(API_ENDPOINTS.REMOVE_FAVORITE(userId, songId));
      } else {
        await api.post(API_ENDPOINTS.ADD_FAVORITE(userId, songId), {});
      }
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavoriteStates(prev => ({
        ...prev,
        [songId]: isFavorited
      }));
      alert('Có lỗi xảy ra khi cập nhật danh sách yêu thích: ' + (error.response?.data?.message || error.message));
      return false;
    }
  }, [userId, favoriteStates]);

  const isFavorite = useCallback((songId) => {
    return !!favoriteStates[songId];
  }, [favoriteStates]);

  const refreshFavorites = useCallback(() => {
    if (userId) {
      setFavoritesInitialized(false);
    }
  }, [userId]);

  const forceRefreshFavorites = useCallback(() => {
    setFavoritesInitialized(false);
    if (userId) {
      loadFavorites();
    }
  }, [userId, loadFavorites]);

  // SỬA: Reorder - Định nghĩa incrementListenCount TRƯỚC saveListenHistory
  // THÊM: Hàm riêng incrementListenCount (PUT +1 views/listen count)
  const incrementListenCount = useCallback(async (songId) => {
    if (!songId || lastSavedSongId === songId) return;  // Skip nếu vừa save history (tránh double call)

    const accessToken = localStorage.getItem('token');
    if (!accessToken) return;  // Chỉ logged in mới +1

    // Throttle: Chỉ +1 mỗi 30s cho cùng song (tránh spam)
    const now = Date.now();
    if (lastListenIncrement && now - lastListenIncrement < 30000) {
      console.log('Throttle: Skip increment for song', songId);
      return;
    }
    setLastListenIncrement(now);

    try {
      // Dùng api.put (nếu api.js có interceptor token); fallback fetch nếu cần
      const response = await api.put(`/songs/${songId}/listen`);
      console.log('Listen count (views) incremented for song:', songId, response.data);
    } catch (err) {
      console.error('Lỗi cập nhật lượt nghe:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      // Reset throttle nếu error
      setLastListenIncrement(null);
    }
  }, [lastSavedSongId, lastListenIncrement]);  // Dependencies

  // ==================== LISTEN HISTORY ====================
  const saveListenHistory = useCallback(async (songId) => {
    if (!songId || lastSavedSongId === songId) return;

    const userIdLocal = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('token');

    if (!userIdLocal || !accessToken) return;

    try {
      const response = await fetch('http://localhost:8080/music/listenhistories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          iduser: Number(userIdLocal),
          idsong: Number(songId),
        }),
      });

      if (response.ok || (response.status === 400 && (await response.json()).message?.includes('exist'))) {
        setLastSavedSongId(songId);
        // SỬA: Gọi incrementListenCount riêng sau history success (nếu muốn tách; nếu gộp, comment dòng này)
        await incrementListenCount(songId);
      }
    } catch (err) {
      console.error('Lỗi lưu lịch sử nghe:', err);
    }
  }, [lastSavedSongId, incrementListenCount]);  // SỬA: Dependency OK (incrementListenCount đã định nghĩa trước)

  const resetSavedHistoryFlag = useCallback(() => {
    setLastSavedSongId(null);
  }, []);

  // ==================== NEXT / PREV SONG ====================
  const nextSong = useCallback(() => {
    if (queue.length === 0) return;

    if (queue.length === 1) {
      if (repeat === 'one' || repeat === 'all') {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
      return;
    }

    let nextIndex = (queueIndex + 1) % queue.length;

    if (shuffle && queue.length > 2) {
      const available = queue.map((_, i) => i).filter(i => i !== queueIndex);
      nextIndex = available[Math.floor(Math.random() * available.length)];
    }

    setQueueIndex(nextIndex);
    playSong(queue[nextIndex], queue, nextIndex);
  }, [queue, queueIndex, repeat, shuffle]);

  const prevSong = useCallback(() => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length === 1) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIndex);
    playSong(queue[prevIndex], queue, prevIndex);
  }, [queue, queueIndex, currentTime]);

  // ==================== AUDIO EVENT LISTENERS ====================
  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = updateDuration;
    const handleCanPlay = () => {
      setIsLoading(false);
      updateDuration();
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }

      if (repeat === 'all' || queueIndex < queue.length - 1) {
        nextSong();
      } else {
        setIsPlaying(false);
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [repeat, queueIndex, queue.length, volume, isMuted, nextSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  // ==================== SHUFFLE ====================
  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const newShuffle = !prev;
      if (newShuffle && queue.length > 1) {
        const current = queue[queueIndex];
        const remaining = queue.filter((_, i) => i !== queueIndex);
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        setQueue([current, ...shuffled]);
        setQueueIndex(0);
      }
      return newShuffle;
    });
  }, [queue, queueIndex]);

  // ==================== PLAY SONG ====================
  const playSong = useCallback((song, songList = [], index = 0) => {
    if (!song?.audioUrl) {
      console.log('No audio URL');
      return;
    }

    const audio = audioRef.current;

    resetSavedHistoryFlag();
    setDuration(0);
    setIsLoading(true);

    if (audio.src && !audio.paused) audio.pause();

    audio.src = song.audioUrl;
    audio.load();

    setCurrentSong(song);
    setCurrentTime(0);

    if (songList.length > 0) {
      setQueue(songList);
      const actualIndex = index >= 0 ? index : songList.findIndex(s => s.id === song.id);
      setQueueIndex(actualIndex >= 0 ? actualIndex : 0);
      console.log('Queue updated:', songList.length, 'songs, index:', actualIndex >= 0 ? actualIndex : 0);
    } else {
      console.log('No song list, creating single-song queue');
      setQueue([song]);
      setQueueIndex(0);
    }

    audio.play().then(() => {
      console.log('Playing successfully');
      setIsPlaying(true);
      saveListenHistory(song.id);  // Tự động gọi history + increment (nếu gộp)
    }).catch(err => {
      console.error('Play error:', err);
      setIsPlaying(false);
      setIsLoading(false);
    });
  }, [saveListenHistory, resetSavedHistoryFlag]);  // SỬA: Dependency OK

  const pauseSong = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src && currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
        audio.load();
      }
      audio.play().then(() => {
        setIsPlaying(true);
        saveListenHistory(currentSong.id);  // Tự động gọi history + increment (nếu gộp)
      }).catch(err => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
    }
  }, [currentSong, isPlaying, saveListenHistory]);  // SỬA: Dependency OK

  const seekTo = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((vol) => {
    const newVol = Math.max(0, Math.min(1, vol));
    setVolume(newVol);
    setIsMuted(newVol === 0);
  }, []);

  const playQueue = useCallback((songs, startIndex = 0) => {
    if (!songs || songs.length === 0) return;

    setQueue(songs);
    const index = startIndex >= songs.length ? 0 : startIndex;
    setQueueIndex(index);
    playSong(songs[index], songs, index);
  }, [playSong]);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      if (prev === false) return 'all';
      if (prev === 'all') return 'one';
      return false;
    });
  }, []);

  const addToQueue = useCallback((song) => {
    setQueue(prev => {
      if (prev.some(s => s.id === song.id)) return prev;
      return [...prev, song];
    });
  }, []);

  const removeFromQueue = useCallback((songId) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
    setCurrentSong(null);
    setIsPlaying(false);
    setDuration(0);
    setLastSavedSongId(null);
    audioRef.current.pause();
    audioRef.current.src = '';
  }, []);

  // ==================== PROVIDER VALUE ====================
  return (
    <PlayerContext.Provider value={{
      audioRef,
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      queue,
      queueIndex,
      repeat,
      shuffle,
      isLoading,

      playSong,
      pauseSong,
      togglePlay,
      nextSong,
      prevSong,
      seekTo,
      changeVolume,
      toggleMute,
      playQueue,
      toggleRepeat,
      toggleShuffle,
      addToQueue,
      removeFromQueue,
      clearQueue,
      setRepeat,
      setShuffle,
      setQueue,
      setQueueIndex,

      favoriteStates,
      userId,
      favoritesInitialized,
      toggleFavorite,
      isFavorite,
      refreshFavorites,
      forceRefreshFavorites,

      refreshDuration: () => {
        const d = audioRef.current.duration;
        if (d && !isNaN(d)) setDuration(d);
        return d || 0;
      },
// 
      // THÊM: Expose hàm increment riêng (dùng từ component khác nếu cần)
      incrementListenCount,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}