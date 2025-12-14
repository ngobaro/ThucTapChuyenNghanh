// FILE: demo/src/components/music/PlayerControls.jsx

import { usePlayer } from '../../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Repeat1 } from 'lucide-react';
import './PlayerControls.css';

function PlayerControls() {
  const { 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong,
    repeat,
    shuffle,
    toggleRepeat,
    toggleShuffle,
    currentSong
  } = usePlayer();

  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one': return <Repeat1 size={20} />;
      case 'all': return <Repeat size={20} />;
      default: return <Repeat size={20} />;
    }
  };

  const getRepeatTitle = () => {
    switch (repeat) {
      case 'one': return 'Repeat One';
      case 'all': return 'Repeat All';
      default: return 'Repeat Off';
    }
  };

  if (!currentSong) {
    return (
      <div className="player-controls disabled">
        <p className="no-song-text">No song selected</p>
      </div>
    );
  }

  return (
    <div className="player-controls">
      <button 
        className={`btn-control ${shuffle ? 'active' : ''}`}
        onClick={toggleShuffle}
        title={shuffle ? 'Shuffle On' : 'Shuffle Off'}
        disabled={!currentSong}
      >
        <Shuffle size={20} />
        {shuffle && <span className="active-indicator"></span>}
      </button>

      <button 
        className="btn-control btn-prev" 
        onClick={prevSong}
        title="Previous"
        disabled={!currentSong}
      >
        <SkipBack size={24} />
      </button>

      <button 
        className="btn-control btn-play-pause" 
        onClick={togglePlay}
        title={isPlaying ? 'Pause' : 'Play'}
        disabled={!currentSong}
      >
        {isPlaying ? <Pause size={28} /> : <Play size={28} />}
      </button>

      <button 
        className="btn-control btn-next" 
        onClick={nextSong}
        title="Next"
        disabled={!currentSong}
      >
        <SkipForward size={24} />
      </button>

      <button 
        className={`btn-control ${repeat ? 'active' : ''}`}
        onClick={toggleRepeat}
        title={getRepeatTitle()}
        disabled={!currentSong}
      >
        {getRepeatIcon()}
        {repeat && <span className="active-indicator"></span>}
      </button>
    </div>
  );
}

export default PlayerControls;