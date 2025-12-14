// FILE: demo/src/components/music/VolumeControl.jsx

import { usePlayer } from '../../context/PlayerContext';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useState, useRef } from 'react';
import './VolumeControl.css';

function VolumeControl() {
  const { volume, isMuted, changeVolume, toggleMute } = usePlayer();
  const [isHovering, setIsHovering] = useState(false);
  const volumeSliderRef = useRef(null);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX size={20} />;
    } else if (volume < 0.5) {
      return <Volume1 size={20} />;
    } else {
      return <Volume2 size={20} />;
    }
  };

  const handleVolumeChange = (e) => {
    const slider = e.target;
    const newVolume = parseFloat(slider.value);
    changeVolume(newVolume);
  };

  const handleSliderClick = (e) => {
    if (!volumeSliderRef.current) return;
    
    const rect = volumeSliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newVolume = percentage;
    
    changeVolume(newVolume);
  };

  return (
    <div 
      className="volume-control"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button 
        className="volume-btn"
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {getVolumeIcon()}
      </button>
      
      <div 
        className={`volume-slider-container ${isHovering ? 'visible' : ''}`}
        onClick={handleSliderClick}
      >
        <div className="volume-slider-background" ref={volumeSliderRef}>
          <div 
            className="volume-slider-fill"
            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
}

export default VolumeControl;