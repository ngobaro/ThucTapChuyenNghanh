import { createContext, useContext, useRef, useState, useEffect } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeat, setRepeat] = useState(false); // false | 'one' | 'all'
  const [shuffle, setShuffle] = useState(false);

  // Play một bài hát
  const playSong = (song) => {
    console.log('🎵 Play song:', song);

    if (!song?.audioUrl) {
      console.error('❌ audioUrl undefined');
      return;
    }

    setCurrentSong(song);
    audioRef.current.src = song.audioUrl;

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(err => console.error('Play error:', err));
  };

  // Pause
  const pauseSong = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      if (currentSong) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Next song
  const nextSong = () => {
    if (queue.length === 0) return;
    
    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      nextIndex = repeat === 'all' ? 0 : queueIndex;
    }
    
    if (nextIndex !== queueIndex) {
      setQueueIndex(nextIndex);
      playSong(queue[nextIndex]);
    }
  };

  // Previous song
  const prevSong = () => {
    if (queue.length === 0) return;
    
    // Nếu đã phát > 3s, restart bài hiện tại
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    setQueueIndex(prevIndex);
    playSong(queue[prevIndex]);
  };

  // Seek to time
  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Change volume
  const changeVolume = (vol) => {
    const newVolume = Math.max(0, Math.min(1, vol));
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  // Play queue (danh sách bài hát)
  const playQueue = (songs, startIndex = 0) => {
    console.log('🎵 Play queue:', songs, 'start at:', startIndex);
    setQueue(songs);
    setQueueIndex(startIndex);
    playSong(songs[startIndex]);
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.play();
      } else {
        nextSong();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeat, queueIndex, queue]);

  return (
    <PlayerContext.Provider
      value={{
        audioRef,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        queueIndex,
        repeat,
        shuffle,
        playSong,
        pauseSong,
        togglePlay,
        nextSong,
        prevSong,
        seekTo,
        changeVolume,
        playQueue,
        setRepeat,
        setShuffle
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