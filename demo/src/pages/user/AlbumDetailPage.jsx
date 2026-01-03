// FILE: demo/src/pages/AlbumDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, MoreVertical, Clock, User } from 'lucide-react';
import SongList from '../../components/music/SongList';
import { fetchAlbumData } from '../../services/albumService';
import './AlbumDetailPage.css';

function AlbumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAlbumData(id)
        .then(({ album: fetchedAlbum, songs: fetchedSongs }) => {
          setAlbum(fetchedAlbum);
          setSongs(fetchedSongs);
        })
        .catch(() => {
          navigate('/albums');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, navigate]);

 

  if (loading) {
    return (
      <div className="album-detail-page loading">
        <div className="spinner"></div>
        <p>Đang tải album...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="album-detail-page not-found">
        <h2>Album không tồn tại</h2>
        <button onClick={() => navigate('/albums')}>
          Quay lại danh sách album
        </button>
      </div>
    );
  }

  return (
    <div className="album-detail-page">
      <div className="album-header">
        <div className="album-cover-large">
          {album.cover && album.cover !== '/default-album.jpg' ? (
            <img
              src={album.cover}
              alt={`${album.title} cover`}
              className="album-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          {!album.cover || album.cover === '/default-album.jpg' ? (
            <div
              className="album-fallback-cover"
              style={{ backgroundColor: album.color }}
            >
              <span className="album-icon">A</span>
            </div>
          ) : null}
        </div>

        <div className="album-info">
          <div className="album-badge">ALBUM</div>
          <h1 className="album-title">{album.title}</h1>
          <h2 className="album-artist">{album.artist}</h2>
          <div className="album-meta">
         
          </div>
          <p className="album-description">{album.description}</p>
          <div className="album-actions">
          </div>
        </div>
      </div>

      <div className="album-content">
        <div className="section-header">
          <h2>Danh sách bài hát</h2>
          <span className="song-count">{songs.length} bài hát</span>
        </div>

        {songs.length > 0 ? (
          <SongList 
            songs={songs} 
            title="Danh sách bài hát"
            showGenre={true}
          />
        ) : (
          <div className="no-songs">
            <p>Chưa có bài hát nào trong album này</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlbumDetailPage;