import { useState, useEffect } from 'react';
import api from '../../services/api';
import './DashboardPage.css'; // Import CSS

function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, songs: 0, playlists: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      // Fetch parallel cho stats (admin only APIs)
      const [usersRes, songsRes, playlistsRes] = await Promise.all([
        api.get('/users'), // GET /users (list users)
        api.get('/songs'), // GET /songs
        api.get('/playlists') // GET /playlists
      ]);
      setStats({
        users: usersRes.data.result?.length || usersRes.data.length || 0,
        songs: songsRes.data.result?.length || songsRes.data.length || 0,
        playlists: playlistsRes.data.result?.length || playlistsRes.data.length || 0
      });
      console.log('Admin stats loaded:', stats); // Debug
    } catch (error) {
      setError('Không thể tải dữ liệu admin: ' + error.message);
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-page">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Users</h3>
          <p>{stats.users}</p>
        </div>
        <div className="stat-card">
          <h3>Songs</h3>
          <p>{stats.songs}</p>
        </div>
        <div className="stat-card">
          <h3>Playlists</h3>
          <p>{stats.playlists}</p>
        </div>
      </div>
      {/* Thêm buttons để reload stats hoặc navigate */}
      <button onClick={fetchAdminStats} className="refresh-btn">Tải lại</button>
    </div>
  );
}

export default DashboardPage;