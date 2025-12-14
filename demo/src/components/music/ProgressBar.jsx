// FILE: demo/src/components/music/ProgressBar.jsx

import { usePlayer } from '../../context/PlayerContext';
import { useState, useRef, useEffect } from 'react';
import './ProgressBar.css';

function ProgressBar() {
  const { currentTime, duration, seekTo } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const progressBarRef = useRef(null);

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTime = isDragging ? dragTime : currentTime;
  const displayPercentage = isDragging ? (dragTime / duration) * 100 : percentage;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateDragTime(e);
    
    const handleMouseMove = (moveEvent) => {
      updateDragTime(moveEvent);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      if (duration > 0) {
        seekTo(dragTime);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    updateDragTime(e.touches[0]);
    
    const handleTouchMove = (moveEvent) => {
      updateDragTime(moveEvent.touches[0]);
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      if (duration > 0) {
        seekTo(dragTime);
      }
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const updateDragTime = (event) => {
    if (!progressBarRef.current || duration <= 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;
    
    setDragTime(time);
  };

  // Format time to MM:SS
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="progress-container">
      <span className="time-current">{formatTime(displayTime)}</span>
      
      <div 
        className="progress-bar" 
        ref={progressBarRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="progress-background"></div>
        <div 
          className="progress-fill" 
          style={{ width: `${displayPercentage}%` }}
        >
          <div className={`progress-handle ${isDragging ? 'dragging' : ''}`}></div>
        </div>
      </div>
      
      <span className="time-duration">{formatTime(duration)}</span>
    </div>
  );
}

export default ProgressBar;