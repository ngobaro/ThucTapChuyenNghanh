// FILE: demo/src/components/layout/PlayerBar.jsx

import { Heart, MoreVertical } from 'lucide-react'; // Thêm import icons
import { usePlayer } from '../../context/PlayerContext';
import PlayerControls from '../music/PlayerControls';
import ProgressBar from '../music/ProgressBar';
import VolumeControl from '../music/VolumeControl';
import './PlayerBar.css';

function PlayerBar() {
  const { currentSong, isPlaying } = usePlayer();

  if (!currentSong) {
    return (
      <div className="player-bar empty">
        <div className="player-bar-content">
          <p className="empty-message">Select a song to play</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`player-bar ${isPlaying ? 'playing' : ''}`}>
      <div className="player-bar-content">
        {/* Left side: Song info */}
        <div className="player-left">
          <div className="song-info">
            <div className="song-cover-container">
              <img 
                src={currentSong.coverUrl || '/default-cover.png'} 
                alt={currentSong.title}
                className="song-cover"
              />
            </div>
            <div className="song-details">
              <h4 className="song-title">{currentSong.title}</h4>
              <p className="song-artist">{currentSong.artist || 'Unknown Artist'}</p>
            </div>
            {/* Hai nút action */}
            <div className="song-actions">
              <button 
                className="btn-action"
                title="Yêu thích"
              >
                <Heart size={18} />
              </button>
              <button 
                className="btn-action"
                title="Tùy chọn"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Controls and progress */}
        <div className="player-center">
          <PlayerControls />
          <ProgressBar />
        </div>

        {/* Right side: Volume */}
        <div className="player-right">
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

export default PlayerBar;