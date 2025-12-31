import { usePlayer } from '../../context/PlayerContext';
import { useState, useRef } from 'react';
import './ProgressBar.css';

function ProgressBar() {
  const { currentTime, duration, seekTo } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);

  const progressBarRef = useRef(null);
  const fillRef = useRef(null);
  const dragTimeRef = useRef(0);
  const rafRef = useRef(null);

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const updateUI = (event) => {
    if (!progressBarRef.current || duration <= 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;

    dragTimeRef.current = time;

    if (fillRef.current) {
      fillRef.current.style.width = `${percent * 100}%`;
    }
  };

  const onMove = (e) => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      updateUI(e);
      rafRef.current = null;
    });
  };

  const onUp = () => {
    setIsDragging(false);
    seekTo(dragTimeRef.current);

    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  const onDown = (e) => {
    setIsDragging(true);
    updateUI(e);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="progress-container">
      <span className="time-current">
        {formatTime(isDragging ? dragTimeRef.current : currentTime)}
      </span>

      <div
        className="progress-bar"
        ref={progressBarRef}
        onMouseDown={onDown}
      >
        <div className="progress-background" />
        <div
          className="progress-fill"
          ref={fillRef}
          style={{ width: `${percentage}%` }}
        >
          <div className={`progress-handle ${isDragging ? 'dragging' : ''}`} />
        </div>
      </div>

      <span className="time-duration">{formatTime(duration)}</span>
    </div>
  );
}

export default ProgressBar;
