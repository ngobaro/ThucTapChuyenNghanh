import { usePlayer } from '../../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Heart } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';
import './PlayerBar.css';

function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    changeVolume,
    setRepeat,
    setShuffle
  } = usePlayer();

  const handleProgressClick = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    seekTo(time);
  };

  const handleVolumeChange = (e) => {
    changeVolume(parseFloat(e.target.value));
  };

  const handleRepeatClick = () => {
    const modes = [false, 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  if (!currentSong) {
    return (
      <div className="player-bar empty">
        <p>🎵 Chọn bài hát để phát</p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-bar">
      {/* Song Info */}
      <div className="player-song-info">
        <img
          src={currentSong.coverUrl || '/default-cover.png'}
          alt={currentSong.title}
          className="player-cover"
          onError={(e) => {
            e.target.src = '/default-cover.png';
          }}
        />
        <div className="player-text">
          <h4>{currentSong.title}</h4>
          <p>{currentSong.artist || 'Unknown Artist'}</p>
        </div>
        <button className="btn-favorite" title="Thêm vào yêu thích">
          <Heart size={20} />
        </button>
      </div>

      {/* Controls */}
      <div className="player-controls-section">
        <div className="player-controls">
          <button
            className={`btn-control ${shuffle ? 'active' : ''}`}
            onClick={() => setShuffle(!shuffle)}
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button className="btn-control" onClick={prevSong} title="Previous">
            <SkipBack size={22} />
          </button>

          <button className="btn-play-pause" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
          </button>

          <button className="btn-control" onClick={nextSong} title="Next">
            <SkipForward size={22} />
          </button>

          <button
            className={`btn-control ${repeat ? 'active' : ''}`}
            onClick={handleRepeatClick}
            title={`Repeat: ${repeat || 'off'}`}
          >
            <Repeat size={18} />
            {repeat === 'one' && <span className="repeat-badge">1</span>}
          </button>
        </div>

        <div className="player-progress">
          <span className="time">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleProgressClick}>
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              <div className="progress-handle"></div>
            </div>
          </div>
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="player-options">
        <button className="btn-volume" title="Volume">
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
    </div>
  );
}

export default PlayerBar;