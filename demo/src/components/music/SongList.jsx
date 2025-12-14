import SongCard from './SongCard';
import './SongList.css';

function SongList({ songs, title = "Bài hát" }) {
  return (
    <div className="song-list-container">
      <h1 className="song-list-title">{title}</h1>
      <div className="song-grid">
        {songs.map(song => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}

export default SongList;