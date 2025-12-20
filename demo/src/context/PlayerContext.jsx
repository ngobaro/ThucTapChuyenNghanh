// FILE: demo/src/context/PlayerContext.jsx
import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

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
  const [repeat, setRepeat] = useState(false); // false (off) | 'all' | 'one'
  const [shuffle, setShuffle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Theo dõi bài hát đã lưu lịch sử để tránh lưu trùng
  const [lastSavedSongId, setLastSavedSongId] = useState(null);

  // Hàm lưu lịch sử nghe nhạc
  const saveListenHistory = useCallback(async (songId) => {
    if (!songId || lastSavedSongId === songId) return;

    const userId = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('token');

    if (!userId || !accessToken) return;

    try {
      const response = await fetch('http://localhost:8080/music/listenhistories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          iduser: Number(userId),
          idsong: Number(songId),
        }),
      });

      if (response.ok || (response.status === 400 && (await response.json()).message?.includes('exist'))) {
        setLastSavedSongId(songId);
      }
    } catch (err) {
      console.error('Lỗi lưu lịch sử nghe:', err);
    }
  }, [lastSavedSongId]);

  const resetSavedHistoryFlag = useCallback(() => {
    setLastSavedSongId(null);
  }, []);

  // ==================== NEXT / PREV - MOVED UP ====================
  const nextSong = useCallback(() => {
    console.log('Next Song - Queue:', queue.length, 'Index:', queueIndex, 'Repeat:', repeat);
    
    if (queue.length === 0) {
      console.log('Queue is empty, cannot go to next');
      return;
    }
    
    // Nếu chỉ có 1 bài trong queue
    if (queue.length === 1) {
      if (repeat === 'one' || repeat === 'all') {
        console.log('Only 1 song, replaying...');
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
      return;
    }
    
    const nextIndex = (queueIndex + 1) % queue.length;
    console.log('Moving to next index:', nextIndex);
    setQueueIndex(nextIndex);
    playSong(queue[nextIndex], queue, nextIndex);
  }, [queue, queueIndex, repeat]); // Temporarily remove playSong dependency

  const prevSong = useCallback(() => {
    console.log('Prev Song - Queue:', queue.length, 'Index:', queueIndex);
    
    if (queue.length === 0) {
      console.log('Queue is empty, cannot go to prev');
      return;
    }

    // Nếu đã nghe quá 3 giây, quay về đầu bài
    if (currentTime > 3) {
      console.log('More than 3s played, restarting current song');
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    // Nếu chỉ có 1 bài trong queue
    if (queue.length === 1) {
      console.log('Only 1 song, restarting...');
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    console.log('Moving to prev index:', prevIndex);
    setQueueIndex(prevIndex);
    playSong(queue[prevIndex], queue, prevIndex);
  }, [queue, queueIndex, currentTime]); // Temporarily remove playSong dependency

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
      console.log('Song ended - Repeat:', repeat, 'Queue:', queue.length, 'Index:', queueIndex);
      
      if (repeat === 'one') {
        console.log('Repeat one, replaying...');
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }

      // Nếu repeat 'all' hoặc chưa hết queue → next
      if (repeat === 'all' || queueIndex < queue.length - 1) {
        console.log('Moving to next song...');
        nextSong();
      } else {
        // Hết queue và repeat off → dừng
        console.log('End of queue, stopping...');
        setIsPlaying(false);
      }
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
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

  // Volume & mute
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
      console.log('Toggle shuffle:', newShuffle);

      if (newShuffle && queue.length > 1) {
        const current = queue[queueIndex];
        const remaining = queue.filter((_, i) => i !== queueIndex);
        const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);
        const newQueue = [current, ...shuffledRemaining];
        console.log('Shuffled queue:', newQueue.map(s => s.title));
        setQueue(newQueue);
        setQueueIndex(0);
      }
      // Khi tắt: giữ nguyên queue hiện tại (hành vi phổ biến)

      return newShuffle;
    });
  }, [queue, queueIndex]);

  // ==================== PLAY SONG ====================
  const playSong = useCallback((song, songList = [], index = 0) => {
    console.log('Play song:', song?.title, 'List:', songList.length, 'Index:', index);
    
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

      if (shuffle) setShuffle(false);
    } else {
      // Nếu không có songList, tạo queue với 1 bài hiện tại
      console.log('No song list, creating single-song queue');
      setQueue([song]);
      setQueueIndex(0);
    }

    audio.play().then(() => {
      console.log('Playing successfully');
      setIsPlaying(true);
      saveListenHistory(song.id);
    }).catch(err => {
      console.error('Play error:', err);
      setIsPlaying(false);
      setIsLoading(false);
    });
  }, [saveListenHistory, resetSavedHistoryFlag, shuffle]);

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
        saveListenHistory(currentSong.id);
      }).catch(err => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
    }
  }, [currentSong, isPlaying, saveListenHistory]);

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

    console.log('Play queue:', songs.length, 'songs, starting at:', startIndex);
    setQueue(songs);
    const index = startIndex >= songs.length ? 0 : startIndex;
    setQueueIndex(index);

    if (shuffle) setShuffle(false);

    playSong(songs[index], songs, index);
  }, [shuffle, playSong]);

  // Toggle repeat: false → 'all' → 'one' → false
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
      const newQueue = [...prev, song];
      console.log('Added to queue:', song.title, 'Total:', newQueue.length);
      return newQueue;
    });
  }, []);

  const removeFromQueue = useCallback((songId) => {
    setQueue(prev => {
      const newQueue = prev.filter(s => s.id !== songId);
      console.log('Removed from queue, remaining:', newQueue.length);
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    console.log('Clearing queue');
    setQueue([]);
    setQueueIndex(0);
    setCurrentSong(null);
    setIsPlaying(false);
    setDuration(0);
    setLastSavedSongId(null);
    audioRef.current.pause();
    audioRef.current.src = '';
  }, []);

  return (
    <PlayerContext.Provider value={{
      audioRef, currentSong, isPlaying, currentTime, duration, volume, isMuted,
      queue, queueIndex, repeat, shuffle, isLoading,

      playSong, pauseSong, togglePlay, nextSong, prevSong, seekTo, changeVolume,
      toggleMute, playQueue, toggleRepeat, toggleShuffle, addToQueue, removeFromQueue,
      clearQueue, setRepeat, setShuffle, setQueue, setQueueIndex,

      refreshDuration: () => {
        const d = audioRef.current.duration;
        if (d && !isNaN(d)) setDuration(d);
        return d || 0;
      }
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}