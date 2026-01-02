// FILE: demo/src/components/music/SongItem.jsx
import { Loader2, Heart, Trash2, MoreVertical } from 'lucide-react';
import { useAudioDuration } from '../../hooks/useAudioDuration';
import { formatTime } from '../../utils/formatTime';

function SongItem({
    song,
    index,
    isCurrent,
    isFavorited,
    isFavLoading,
    showGenre,
    userId,
    playlistId,
    onPlay,
    onToggleFavorite,
    onOpenPlaylistModal,
    onRemoveSong
}) {
    // ✅ Hook ở top-level
    const { duration, loading } = useAudioDuration(song.audioUrl);
    const displayDuration = duration > 0 ? duration : parseDuration(song.duration);

    // ===== FALLBACK ALBUM LOGIC (SỬA: Nếu album = artist name hoặc 'Single', ghi chữ 'singer' literal) =====
    const getDisplayAlbum = () => {
      let album = song.album || '';
      // Đảm bảo album là string trước khi check
      if (typeof album !== 'string') album = String(album);
      // Nếu rỗng, 'Single', album = artist name, hoặc format "Title (Artist)", dùng chữ 'singer' literal
      if (!album.trim() || album === 'Single' || album === song.artist || (album.includes('(') && album.includes(')'))) {
        return 'singer'; // ← CHỮ 'singer' literal
      }
      return album; // Giữ tên album thật nếu có
    };

    return (
        <div
            className={`song-list-item ${isCurrent ? 'playing' : ''}`}
            onClick={onPlay}
        >
            <span className="col-number">
                {isCurrent ? '🎵' : index + 1}
            </span>

            <div className="col-title">
                <img
                    src={song.coverUrl || '/default-cover.png'}
                    alt={song.title}
                    onError={(e) => (e.target.src = '/default-cover.png')}
                />
                <div>
                    <h4>{song.title}</h4>
                    <p>{song.artist}</p>
                </div>
            </div>

            <span className="col-artist">{song.artist}</span>
            {/* SỬA: Dùng hàm fallback cho col-album */}
            <span className="col-album">{getDisplayAlbum()}</span>

            <span className="col-duration">
                {loading ? <Loader2 size={14} className="spinner" /> : formatTime(displayDuration)}
            </span>

            {showGenre && (
                <span className="col-genre" style={{ color: song.genreColor }}>
                    {song.genreName}
                </span>
            )}

            <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                {/* Favorite */}
                <button
                    className={`btn-action ${isFavorited ? 'active' : ''}`}
                    onClick={() => onToggleFavorite(song.id)}
                    disabled={isFavLoading || !userId}
                >
                    {isFavLoading ? (
                        <Loader2 size={18} className="spinner" />
                    ) : (
                        <Heart
                            size={18}
                            fill={isFavorited ? 'currentColor' : 'none'}
                        />
                    )}
                </button>

                {/* Add to playlist */}
                <button
                    className="btn-action"
                    onClick={(e) => onOpenPlaylistModal(song.id, e)}
                    disabled={!userId}
                >
                    <MoreVertical size={18} />
                </button>

                {/* Remove from playlist */}
                {playlistId && userId && (
                    <button
                        className="btn-action delete-btn"
                        onClick={() => onRemoveSong(song.id)}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

const parseDuration = (duration) => {
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string' && duration.includes(':')) {
        const [m, s] = duration.split(':').map(Number);
        return m * 60 + (s || 0);
    }
    return Number(duration) || 0;
};

export default SongItem;