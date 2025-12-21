import { usePlayer } from '../../context/PlayerContext';
import { Play, Pause } from 'lucide-react';
import './SongCard.css';

function SongCard({
  song,
  songs = [],   // ✅ queue
  index = 0,    // ✅ index trong queue
  isPlaying = false
}) {
  const { playSong, togglePlay, currentSong } = usePlayer();

  const isCurrent = currentSong && currentSong.id === song.id;
  const playing = isPlaying || isCurrent;

  const handlePlayClick = (e) => {
    e.stopPropagation();

    // Click lại bài đang phát → pause / resume
    if (isCurrent) {
      togglePlay();
      return;
    }

    // 🔥 QUAN TRỌNG: PHẢI TRUYỀN queue + index
    playSong(song, songs, index);
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
          {playing ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>
      </div>

      <div className="song-info">
        <h3 className="song-title">{song.title || 'Tiêu đề không xác định'}</h3>
        <p className="song-artist">
          {song.artist || 'Nghệ sĩ không xác định'}
        </p>
      </div>
    </div>
  );
}

export default SongCard;
