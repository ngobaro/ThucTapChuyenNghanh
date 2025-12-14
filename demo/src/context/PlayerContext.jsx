// FILE: demo/src/context/PlayerContext.jsx

import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8); // Thay đổi từ 1 xuống 0.8
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeat, setRepeat] = useState(false); // false | 'one' | 'all'
  const [shuffle, setShuffle] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState([]);
  const [originalQueue, setOriginalQueue] = useState([]);

  // Khởi tạo audio
  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    
    const handleEnded = () => {
      console.log('Song ended, repeat mode:', repeat);
      if (repeat === 'one') {
        // Lặp lại 1 bài
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        // Chuyển bài tiếp theo
        nextSong();
      }
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Set volume ban đầu
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, [repeat]);

  // Cập nhật volume khi thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Toggle shuffle và tạo queue shuffled
  const toggleShuffle = useCallback(() => {
    const newShuffle = !shuffle;
    setShuffle(newShuffle);
    
    if (newShuffle && queue.length > 0) {
      // Lưu queue gốc nếu chưa có
      if (originalQueue.length === 0) {
        setOriginalQueue([...queue]);
      }
      
      // Tạo shuffled queue (loại trừ bài đang phát)
      const indices = Array.from({ length: queue.length }, (_, i) => i);
      const shuffled = indices
        .filter(i => i !== queueIndex) // Loại bài đang phát
        .sort(() => Math.random() - 0.5);
      
      // Thêm bài đang phát vào đầu
      shuffled.unshift(queueIndex);
      setShuffledQueue(shuffled);
      console.log('Shuffled queue created:', shuffled);
    } else if (!newShuffle && originalQueue.length > 0) {
      // Khôi phục queue gốc
      setQueue(originalQueue);
      setOriginalQueue([]);
      setShuffledQueue([]);
    }
  }, [shuffle, queue, queueIndex, originalQueue]);

  // Play một bài hát
  const playSong = useCallback((song, songList = [], index = 0) => {
    console.log('🎵 Play song:', song);

    if (!song?.audioUrl) {
      console.error('❌ audioUrl undefined');
      return;
    }

    const audio = audioRef.current;
    
    // Dừng bài hiện tại nếu đang phát
    if (audio.src && !audio.paused) {
      audio.pause();
    }

    // Set bài mới
    audio.src = song.audioUrl;
    setCurrentSong(song);
    setCurrentTime(0);

    // Set queue nếu có
    if (songList.length > 0) {
      const actualIndex = index !== undefined ? index : songList.findIndex(s => s.id === song.id);
      setQueue(songList);
      setQueueIndex(actualIndex >= 0 ? actualIndex : 0);
    }

    // Play bài mới
    audio.play()
      .then(() => {
        setIsPlaying(true);
        console.log('✅ Song started playing');
      })
      .catch(err => {
        console.error('❌ Play error:', err);
        setIsPlaying(false);
      });
  }, []);

  // Pause
  const pauseSong = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!currentSong) {
      console.warn('⚠️ No song to play');
      return;
    }

    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src && currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
      }
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Play error:', err);
          setIsPlaying(false);
        });
    }
  }, [currentSong, isPlaying]);

  // Next song với shuffle support
  const nextSong = useCallback(() => {
    if (queue.length === 0) {
      console.log('⚠️ Queue is empty');
      return;
    }

    let nextIndex;
    
    if (shuffle && shuffledQueue.length > 0) {
      // Tìm vị trí hiện tại trong shuffled queue
      const currentPos = shuffledQueue.indexOf(queueIndex);
      if (currentPos !== -1) {
        nextIndex = shuffledQueue[(currentPos + 1) % shuffledQueue.length];
      } else {
        nextIndex = (queueIndex + 1) % queue.length;
      }
    } else {
      nextIndex = (queueIndex + 1) % queue.length;
    }

    console.log('Next song index:', nextIndex, 'shuffle:', shuffle);

    // Kiểm tra repeat mode
    if (repeat === false && nextIndex <= queueIndex && !shuffle) {
      // Dừng nếu không repeat và đến cuối queue
      console.log('⏹ End of queue, stopping');
      pauseSong();
      return;
    }

    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      playSong(queue[nextIndex], queue, nextIndex);
    }
  }, [queue, queueIndex, shuffle, shuffledQueue, repeat, pauseSong, playSong]);

  // Previous song với shuffle support
  const prevSong = useCallback(() => {
    if (queue.length === 0) return;

    // Nếu đã phát > 3s, restart bài hiện tại
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    let prevIndex;
    
    if (shuffle && shuffledQueue.length > 0) {
      const currentPos = shuffledQueue.indexOf(queueIndex);
      if (currentPos !== -1) {
        prevIndex = shuffledQueue[
          (currentPos - 1 + shuffledQueue.length) % shuffledQueue.length
        ];
      } else {
        prevIndex = (queueIndex - 1 + queue.length) % queue.length;
      }
    } else {
      prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    }

    console.log('Previous song index:', prevIndex, 'shuffle:', shuffle);

    if (prevIndex < queue.length) {
      setQueueIndex(prevIndex);
      playSong(queue[prevIndex], queue, prevIndex);
    }
  }, [queue, queueIndex, currentTime, shuffle, shuffledQueue, playSong]);

  // Seek to time
  const seekTo = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Change volume
  const changeVolume = useCallback((vol) => {
    const newVolume = Math.max(0, Math.min(1, vol));
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  // Play queue (danh sách bài hát)
  const playQueue = useCallback((songs, startIndex = 0) => {
    console.log('🎵 Play queue:', songs, 'start at:', startIndex);
    
    if (!songs || songs.length === 0) {
      console.error('❌ Empty songs array');
      return;
    }

    if (startIndex >= songs.length) {
      console.warn('⚠️ Start index out of bounds, using 0');
      startIndex = 0;
    }

    setQueue(songs);
    setQueueIndex(startIndex);
    
    // Reset shuffle khi có queue mới
    if (shuffle) {
      setShuffle(false);
      setShuffledQueue([]);
      setOriginalQueue([]);
    }
    
    playSong(songs[startIndex], songs, startIndex);
  }, [shuffle, playSong]);

  // Toggle repeat mode
  const toggleRepeat = useCallback(() => {
    const modes = [false, 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    console.log('Repeat mode changed to:', newMode);
    setRepeat(newMode);
  }, [repeat]);

  // Thêm bài hát vào queue
  const addToQueue = useCallback((song) => {
    if (!song) return;
    
    setQueue(prev => {
      // Kiểm tra xem bài hát đã có trong queue chưa
      if (prev.some(s => s.id === song.id)) {
        return prev;
      }
      return [...prev, song];
    });
  }, []);

  // Xóa bài hát khỏi queue
  const removeFromQueue = useCallback((songId) => {
    setQueue(prev => prev.filter(song => song.id !== songId));
  }, []);

  // Xóa toàn bộ queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
    setCurrentSong(null);
    setIsPlaying(false);
    setShuffledQueue([]);
    setOriginalQueue([]);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        // State
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
        
        // Actions
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
        
        // Setters
        setRepeat,
        setShuffle,
        setQueue,
        setQueueIndex,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}