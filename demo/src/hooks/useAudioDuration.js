// FILE: demo/src/hooks/useAudioDuration.js

import { useState, useEffect } from 'react';

export const useAudioDuration = (audioUrl) => {
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!audioUrl) {
      setDuration(0);
      return;
    }

    let audio = null;
    let isMounted = true;

    const loadDuration = async () => {
      try {
        setLoading(true);
        
        // Tạo audio element mới để không ảnh hưởng đến player
        audio = new Audio();
        audio.preload = 'metadata'; // Chỉ load metadata, không load toàn bộ file
        
        // Xử lý khi metadata được tải
        const handleLoadedMetadata = () => {
          if (isMounted && audio.duration && audio.duration > 0 && !isNaN(audio.duration)) {
            console.log(`Duration loaded for ${audioUrl}:`, audio.duration);
            setDuration(audio.duration);
            setLoading(false);
          }
        };

        // Xử lý lỗi
        const handleError = () => {
          if (isMounted) {
            console.warn(`Failed to load duration for ${audioUrl}`);
            setDuration(0);
            setLoading(false);
          }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);
        
        // Bắt đầu load metadata
        audio.src = audioUrl;
        audio.load();

        // Timeout sau 5s nếu không load được
        const timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.warn(`Timeout loading duration for ${audioUrl}`);
            setDuration(0);
            setLoading(false);
          }
        }, 5000);

        return () => {
          clearTimeout(timeoutId);
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError);
          audio = null;
        };

      } catch (error) {
        console.error('Error loading audio duration:', error);
        if (isMounted) {
          setDuration(0);
          setLoading(false);
        }
      }
    };

    loadDuration();

    return () => {
      isMounted = false;
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
        audio = null;
      }
    };
  }, [audioUrl]);

  return { duration, loading };
};