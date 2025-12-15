// FILE: demo/src/pages/admin/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Eye, Search, Filter, 
  Music, Users, Disc, Tag, BarChart3, 
  Download, Upload, RefreshCw, AlertCircle 
} from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './DashboardPage.css';

function DashboardPage() {
  // State cho các tabs
  const [activeTab, setActiveTab] = useState('songs');
  const [loading, setLoading] = useState(false);
  
  // State cho data
  const [songs, setSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  
  // State cho search và filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    totalArtists: 0,
    totalAlbums: 0,
    totalGenres: 0
  });

  useEffect(() => {
    if (activeTab === 'songs') loadSongs();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'artists') loadArtists();
    if (activeTab === 'albums') loadAlbums();
    if (activeTab === 'genres') loadGenres();
  }, [activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSongs(),
        loadUsers(),
        loadArtists(),
        loadAlbums(),
        loadGenres()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SONGS);
      let songsData = [];
      
      if (Array.isArray(response.data)) {
        songsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        songsData = response.data.result;
      }
      
      setSongs(songsData);
      setStats(prev => ({ ...prev, totalSongs: songsData.length }));
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS);
      let usersData = [];
      
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        usersData = response.data.result;
      }
      
      setUsers(usersData);
      setStats(prev => ({ ...prev, totalUsers: usersData.length }));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadArtists = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ARTISTS);
      let artistsData = [];
      
      if (Array.isArray(response.data)) {
        artistsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        artistsData = response.data.result;
      }
      
      setArtists(artistsData);
      setStats(prev => ({ ...prev, totalArtists: artistsData.length }));
    } catch (error) {
      console.error('Error loading artists:', error);
    }
  };

  const loadAlbums = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ALBUMS);
      let albumsData = [];
      
      if (Array.isArray(response.data)) {
        albumsData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        albumsData = response.data.result;
      }
      
      setAlbums(albumsData);
      setStats(prev => ({ ...prev, totalAlbums: albumsData.length }));
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const loadGenres = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.GENRES);
      let genresData = [];
      
      if (Array.isArray(response.data)) {
        genresData = response.data;
      } else if (response.data.result && Array.isArray(response.data.result)) {
        genresData = response.data.result;
      }
      
      setGenres(genresData);
      setStats(prev => ({ ...prev, totalGenres: genresData.length }));
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  // CRUD Operations
  const handleCreate = async (type, data) => {
    try {
      let endpoint = '';
      switch(type) {
        case 'song': endpoint = API_ENDPOINTS.SONGS; break;
        case 'user': endpoint = API_ENDPOINTS.USERS; break;
        case 'artist': endpoint = API_ENDPOINTS.ARTISTS; break;
        case 'album': endpoint = API_ENDPOINTS.ALBUMS; break;
        case 'genre': endpoint = API_ENDPOINTS.GENRES; break;
        default: return;
      }
      
      await api.post(endpoint, data);
      setShowCreateModal(false);
      loadAllData();
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
    }
  };

  const handleEdit = async (type, id, data) => {
    try {
      let endpoint = '';
      switch(type) {
        case 'song': endpoint = API_ENDPOINTS.SONG_BY_ID(id); break;
        case 'user': endpoint = API_ENDPOINTS.USER_BY_ID(id); break;
        case 'artist': endpoint = API_ENDPOINTS.ARTIST_BY_ID(id); break;
        case 'album': endpoint = API_ENDPOINTS.ALBUM_BY_ID(id); break;
        case 'genre': endpoint = API_ENDPOINTS.GENRE_BY_ID(id); break;
        default: return;
      }
      
      await api.put(endpoint, data);
      setShowEditModal(false);
      setSelectedItem(null);
      loadAllData();
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${type} này?`)) return;
    
    try {
      let endpoint = '';
      switch(type) {
        case 'song': endpoint = API_ENDPOINTS.SONG_BY_ID(id); break;
        case 'user': endpoint = API_ENDPOINTS.USER_BY_ID(id); break;
        case 'artist': endpoint = API_ENDPOINTS.ARTIST_BY_ID(id); break;
        case 'album': endpoint = API_ENDPOINTS.ALBUM_BY_ID(id); break;
        case 'genre': endpoint = API_ENDPOINTS.GENRE_BY_ID(id); break;
        default: return;
      }
      
      await api.delete(endpoint);
      loadAllData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  // Filter data based on search
  const getFilteredData = () => {
    const data = {
      songs,
      users,
      artists,
      albums,
      genres
    }[activeTab] || [];
    
    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      switch(activeTab) {
        case 'songs':
          return (item.title || '').toLowerCase().includes(searchLower) ||
                 (item.artist || '').toLowerCase().includes(searchLower);
        case 'users':
          return (item.username || '').toLowerCase().includes(searchLower) ||
                 (item.email || '').toLowerCase().includes(searchLower);
        case 'artists':
          return (item.artistname || item.name || '').toLowerCase().includes(searchLower);
        case 'albums':
          return (item.title || '').toLowerCase().includes(searchLower);
        case 'genres':
          return (item.genrename || item.name || '').toLowerCase().includes(searchLower);
        default:
          return true;
      }
    });
  };

  const getTableColumns = () => {
    switch(activeTab) {
      case 'songs':
        return ['ID', 'Tiêu đề', 'Nghệ sĩ', 'Album', 'Thời lượng', 'Lượt nghe', 'Actions'];
      case 'users':
        return ['ID', 'Username', 'Email', 'Vai trò', 'Ngày tạo', 'Actions'];
      case 'artists':
        return ['ID', 'Tên nghệ sĩ', 'Mô tả', 'Số bài hát', 'Actions'];
      case 'albums':
        return ['ID', 'Tiêu đề', 'Nghệ sĩ', 'Năm', 'Số bài hát', 'Actions'];
      case 'genres':
        return ['ID', 'Tên thể loại', 'Số bài hát', 'Actions'];
      default:
        return [];
    }
  };

  const renderTableRow = (item) => {
    switch(activeTab) {
      case 'songs':
        return (
          <tr key={item.songId || item.id}>
            <td>{item.songId || item.id}</td>
            <td className="title-cell">
              <div className="item-title">
                {item.title || 'Không có tiêu đề'}
              </div>
            </td>
            <td>{item.artist || 'Unknown'}</td>
            <td>{item.idalbum || 'Single'}</td>
            <td>{item.duration || '00:00'}</td>
            <td>{item.views || 0}</td>
            <td className="actions-cell">
              <button className="btn-action view" title="Xem">
                <Eye size={14} />
              </button>
              <button 
                className="btn-action edit" 
                title="Sửa"
                onClick={() => {
                  setSelectedItem(item);
                  setShowEditModal(true);
                }}
              >
                <Edit size={14} />
              </button>
              <button 
                className="btn-action delete" 
                title="Xóa"
                onClick={() => handleDelete('song', item.songId || item.id)}
              >
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );
      
      case 'users':
        return (
          <tr key={item.iduser || item.id}>
            <td>{item.iduser || item.id}</td>
            <td className="title-cell">
              <div className="item-title">
                {item.username || 'Unknown'}
              </div>
            </td>
            <td>{item.email || 'No email'}</td>
            <td>
              <span className={`role-badge ${(item.role || 'USER').toLowerCase()}`}>
                {item.role || 'USER'}
              </span>
            </td>
            <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}</td>
            <td className="actions-cell">
              <button className="btn-action view" title="Xem">
                <Eye size={14} />
              </button>
              <button 
                className="btn-action edit" 
                title="Sửa"
                onClick={() => {
                  setSelectedItem(item);
                  setShowEditModal(true);
                }}
              >
                <Edit size={14} />
              </button>
              {item.role !== 'ADMIN' && (
                <button 
                  className="btn-action delete" 
                  title="Xóa"
                  onClick={() => handleDelete('user', item.iduser || item.id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </td>
          </tr>
        );
      
      case 'artists':
        return (
          <tr key={item.idartist || item.id}>
            <td>{item.idartist || item.id}</td>
            <td className="title-cell">
              <div className="item-title">
                {item.artistname || item.name || 'Unknown Artist'}
              </div>
            </td>
            <td>{item.description || 'No description'}</td>
            <td>{item.songCount || 0}</td>
            <td className="actions-cell">
              <button className="btn-action view" title="Xem">
                <Eye size={14} />
              </button>
              <button 
                className="btn-action edit" 
                title="Sửa"
                onClick={() => {
                  setSelectedItem(item);
                  setShowEditModal(true);
                }}
              >
                <Edit size={14} />
              </button>
              <button 
                className="btn-action delete" 
                title="Xóa"
                onClick={() => handleDelete('artist', item.idartist || item.id)}
              >
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );
      
      // ... similar for albums and genres
      
      default:
        return null;
    }
  };

  if (loading && activeTab === 'songs' && songs.length === 0) {
    return (
      <div className="dashboard-page loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <p>Quản lý toàn bộ dữ liệu hệ thống</p>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={loadAllData}>
            <RefreshCw size={16} />
            Tải lại
          </button>
          <button className="btn-export">
            <Download size={16} />
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#1DB95420', color: '#1DB954' }}>
            <Music size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalSongs}</h3>
            <p>Bài hát</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FF6B6B20', color: '#FF6B6B' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Người dùng</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#4ECDC420', color: '#4ECDC4' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalArtists}</h3>
            <p>Nghệ sĩ</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FF9F1C20', color: '#FF9F1C' }}>
            <Disc size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalAlbums}</h3>
            <p>Albums</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#9D4EDD20', color: '#9D4EDD' }}>
            <Tag size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalGenres}</h3>
            <p>Thể loại</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            <Music size={16} />
            Bài hát
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            Người dùng
          </button>
          <button 
            className={`tab-btn ${activeTab === 'artists' ? 'active' : ''}`}
            onClick={() => setActiveTab('artists')}
          >
            <Users size={16} />
            Nghệ sĩ
          </button>
          <button 
            className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
            onClick={() => setActiveTab('albums')}
          >
            <Disc size={16} />
            Albums
          </button>
          <button 
            className={`tab-btn ${activeTab === 'genres' ? 'active' : ''}`}
            onClick={() => setActiveTab('genres')}
          >
            <Tag size={16} />
            Thể loại
          </button>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-container">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={`Tìm kiếm ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clear-btn"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="toolbar-actions">
            <button className="btn-filter">
              <Filter size={16} />
              Lọc
            </button>
            <button 
              className="btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Thêm mới
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {getTableColumns().map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getFilteredData().length > 0 ? (
                getFilteredData().map(item => renderTableRow(item))
              ) : (
                <tr>
                  <td colSpan={getTableColumns().length} className="no-data">
                    <div className="empty-state">
                      <AlertCircle size={32} />
                      <p>Không có dữ liệu</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-footer">
          <div className="pagination-info">
            Hiển thị 1-{Math.min(getFilteredData().length, 10)} của {getFilteredData().length} kết quả
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled>
              Trước
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Thêm mới {activeTab}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Form sẽ tùy thuộc vào activeTab */}
              <p>Form thêm mới sẽ ở đây...</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button className="btn-save">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Sửa {activeTab}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Form chỉnh sửa sẽ ở đây...</p>
              <p>Đang chỉnh sửa: {selectedItem.title || selectedItem.username || selectedItem.artistname}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
              >
                Hủy
              </button>
              <button className="btn-save">
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;