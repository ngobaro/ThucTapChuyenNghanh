import { usePlayer } from '../../context/PlayerContext';
import './ProgressBar.css';

function ProgressBar() {
  const { currentTime, duration, seekTo } = usePlayer();

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    seekTo(time);
  };

  return (
    <div className="progress-bar" onClick={handleSeek}>
      <div 
        className="progress-fill" 
        style={{ width: `${percentage}%` }}
      >
        <div className="progress-handle"></div>
      </div>
    </div>
  );
}

export default ProgressBar;