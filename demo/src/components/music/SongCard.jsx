import { usePlayer } from '../../context/PlayerContext';
import { Play } from 'lucide-react';
import './SongCard.css';

function SongCard({ song, isPlaying = false }) {
  const { playSong, currentSong } = usePlayer();

  // Kiểm tra xem bài hát này có đang được phát không
  const playing = isPlaying || (currentSong && currentSong.id === song.id);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    playSong(song);
  };

  return (
    <div className={`song-card ${playing ? 'playing' : ''}`}>
      <div className="song-card-image-container">
        <img
          src={song.coverUrl || '/default-cover.png'}
          alt={song.title}
          className="song-card-image"
          onError={(e) => {
            e.target.src = '/default-cover.png';
          }}
        />

        <button
          className="play-button"
          onClick={handlePlayClick}
          aria-label={`Phát bài hát ${song.title}`}
        >
          <Play size={20} fill="currentColor" />
        </button>
      </div>

      <div className="song-info">
        <h3 className="song-title">{song.title}</h3>
        <p className="song-artist">{song.artist || 'Nghệ sĩ không xác định'}</p>
      </div>
    </div>
  );
}

export default SongCard;