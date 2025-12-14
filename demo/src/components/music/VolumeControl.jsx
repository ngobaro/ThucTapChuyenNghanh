import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Volume2, VolumeX } from 'lucide-react';
import './VolumeControl.css';

function VolumeControl() {
  const { volume, changeVolume } = usePlayer();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    changeVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      changeVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      changeVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="volume-control">
      <button onClick={toggleMute} className="btn-volume">
        {isMuted || volume === 0 ? (
          <VolumeX size={20} />
        ) : (
          <Volume2 size={20} />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="volume-slider"
      />
    </div>
  );
}

export default VolumeControl;