// FILE: src/components/music/SongList.jsx
// Thay thế toàn bộ nội dung file này

import { Play, Heart, MoreVertical } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../utils/formatTime';
import './SongList.css';

function SongList({ songs, title }) {
  const { playSong, playQueue, currentSong } = usePlayer();

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
                {formatTime(song.duration)}
              </span>
              
              <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="btn-action"
                  onClick={() => handlePlaySong(song, index)}
                  title="Phát"
                >
                  <Play size={18} />
                </button>
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

export default SongList;