import { usePlayer } from '../../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';
import './PlayerControls.css';

function PlayerControls() {
  const { 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong,
    repeat,
    shuffle,
    setRepeat,
    setShuffle
  } = usePlayer();

  const handleRepeat = () => {
    const modes = [false, 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  return (
    <div className="player-controls">
      <button 
        className={`btn-control ${shuffle ? 'active' : ''}`}
        onClick={() => setShuffle(!shuffle)}
        title="Shuffle"
      >
        <Shuffle size={20} />
      </button>

      <button 
        className="btn-control btn-prev" 
        onClick={prevSong}
        title="Previous"
      >
        <SkipBack size={24} />
      </button>

      <button 
        className="btn-control btn-play-pause" 
        onClick={togglePlay}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={32} /> : <Play size={32} />}
      </button>

      <button 
        className="btn-control btn-next" 
        onClick={nextSong}
        title="Next"
      >
        <SkipForward size={24} />
      </button>

      <button 
        className={`btn-control ${repeat ? 'active' : ''}`}
        onClick={handleRepeat}
        title={`Repeat: ${repeat || 'off'}`}
      >
        <Repeat size={20} />
      </button>
    </div>
  );
}

export default PlayerControls;