// FILE: demo/src/components/music/SongList.jsx

import { Play, Heart, MoreVertical, Loader2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../utils/formatTime';
import { useAudioDuration } from '../../hooks/useAudioDuration';
import './SongList.css';

function SongList({ songs, title }) {
  const { playQueue, currentSong } = usePlayer();

  const handlePlaySong = (song, index) => {
    playQueue(songs, index);
  };

  if (!songs || songs.length === 0) {
    return (
      <div className="song-list-empty">
        <p>Chưa có bài hát nào</p>
      </div>
    );
  }

  return (
    <div className="song-list-container">
      {title && <h2 className="song-list-title">{title}</h2>}
      
      <div className="song-list">
        {/* Table Header */}
        <div className="song-list-header">
          <span className="col-number">#</span>
          <span className="col-title">Tiêu đề</span>
          <span className="col-artist">Nghệ sĩ</span>
          <span className="col-album">Album</span>
          <span className="col-duration">Thời lượng</span>
          <span className="col-actions"></span>
        </div>
        
        {/* Table Rows */}
        {songs.map((song, index) => {
          const isCurrentSong = currentSong && currentSong.id === song.id;
          // Sử dụng hook để lấy duration thực tế
          const { duration: actualDuration, loading } = useAudioDuration(song.audioUrl);
          
          // Ưu tiên duration thực tế, nếu không có thì dùng từ database
          const displayDuration = actualDuration > 0 ? actualDuration : 
                                (song.duration ? parseDuration(song.duration) : 0);

          return (
            <div 
              key={song.id || index} 
              className={`song-list-item ${isCurrentSong ? 'playing' : ''}`}
              onClick={() => handlePlaySong(song, index)}
            >
              <span className="col-number">
                {isCurrentSong ? '🎵' : index + 1}
              </span>
              
              <div className="col-title">
                <img 
                  src={song.coverUrl || '/default-cover.png'} 
                  alt={song.title}
                  onError={(e) => {
                    e.target.src = '/default-cover.png';
                  }}
                />
                <div>
                  <h4>{song.title}</h4>
                  <p>{song.artist || 'Unknown Artist'}</p>
                </div>
              </div>
              
              <span className="col-artist">
                {song.artist || 'Unknown Artist'}
              </span>
              
              <span className="col-album">
                {song.album || 'Single'}
              </span>
              
              <span className="col-duration">
                {loading ? (
                  <Loader2 size={14} className="spinner" />
                ) : (
                  formatTime(displayDuration)
                )}
              </span>
              
              <div className="col-actions" onClick={(e) => e.stopPropagation()}>
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
          );
        })}
      </div>
    </div>
  );
}

// Helper function để parse duration từ database
const parseDuration = (duration) => {
  if (typeof duration === 'number') {
    return duration; // Đã là seconds
  }
  
  if (typeof duration === 'string') {
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
      }
    }
    // Nếu là string số
    return parseFloat(duration) || 0;
  }
  
  return 0;
};

export default SongList;