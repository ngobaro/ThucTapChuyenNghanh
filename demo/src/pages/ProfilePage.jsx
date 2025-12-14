import { useState, useEffect } from 'react';
import api from '../services/api'; // Import api để fetch /users/myInfo
import { getMySongs } from '../services/songService'; // Import getMySongs
import { getUserPlaylists } from '../services/playlistService'; // Import getUserPlaylists
import SongCard from '../components/music/SongCard';
import SongList from '../components/music/SongList';
import './ProfilePage.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [mySongs, setMySongs] = useState([]); // Fallback empty array
  const [myPlaylists, setMyPlaylists] = useState([]); // Fallback empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch parallel, catch individual errors
      const userRes = await api.get('/users/myInfo').catch(() => ({ data: { result: null } })); // Fallback if fail
      const songsRes = await getMySongs().catch(() => ({ data: { result: [] } })); // Fallback empty
      const playlistsRes = await getUserPlaylists().catch(() => ({ data: { result: [] } })); // Fallback empty
      
      setUser(userRes.data.result || userRes.data || null);
      setMySongs(songsRes.data.result || songsRes.data || []);
      setMyPlaylists(playlistsRes.data.result || playlistsRes.data || []);
      console.log('Profile data loaded:', { user, mySongs, myPlaylists }); // Debug
    } catch (err) {
      setError('Không thể tải dữ liệu profile: ' + err.message);
      console.error('Fetch profile error:', err.response?.data || err);
      setMySongs([]); // Fallback
      setMyPlaylists([]); // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải profile...</div>;
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchProfileData}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src="https://via.placeholder.com/150" alt="Avatar" className="avatar" />
        <div className="profile-info">
          <h1>{user?.username || 'User'}</h1>
          <p>{user?.email || 'email@example.com'}</p>
          <p>Tham gia từ {user?.createdAt || '2024'}</p>
        </div>
      </div>

      <section className="section">
        <h2>My Playlists</h2>
        <div className="playlist-grid">
          {myPlaylists.length > 0 ? (
            myPlaylists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                <img src="https://via.placeholder.com/200" alt={playlist.name} />
                <h3>{playlist.name}</h3>
                <p>{playlist.songs?.length || 0} bài hát</p>
              </div>
            ))
          ) : (
            <p>Chưa có playlist</p>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Bài hát phổ biến</h2>
        {mySongs.length > 0 ? (
          <SongList songs={mySongs} />
        ) : (
          <p>Chưa có bài hát phổ biến</p>
        )}
      </section>

      <section className="section">
        <h2>Giỏ hàng</h2>
        <div className="song-grid">
          {mySongs.length > 0 ? (
            mySongs.map(song => (
              <SongCard key={song.id} song={song} />
            ))
          ) : (
            <p>Giỏ hàng trống</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;