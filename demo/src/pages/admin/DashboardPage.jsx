// FILE: demo/src/pages/admin/DashboardPage.jsx
import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, X,
  Music, Users, Disc, Tag,
  RefreshCw, AlertCircle,
  Save, Loader2,
  Home, LogOut
} from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './DashboardPage.css';

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('songs');
  const [loading, setLoading] = useState(false);

  const [songs, setSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (artists.length > 0 && songs.length > 0) {
      const songsWithArtists = songs.map(song => {
        const artist = artists.find(a =>
          (a.idartist || a.id) === (song.idartist || song.artistId)
        );
        return {
          ...song,
          artist: artist ? {
            artistname: artist.artistname || artist.name,
            idartist: artist.idartist || artist.id
          } : null
        };
      });
      setSongs(songsWithArtists);
    }
  }, [artists, songs]);

  useEffect(() => {
    if (artists.length > 0 && albums.length > 0) {
      const albumsWithArtists = albums.map(album => {
        const artist = artists.find(a =>
          (a.idartist || a.id) === (album.idartist || album.artistId)
        );
        return {
          ...album,
          artist: artist ? {
            name: artist.artistname || artist.name,
            idartist: artist.idartist || artist.id
          } : null
        };
      });
      setAlbums(albumsWithArtists);
    }
  }, [artists, albums]);

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
      if (Array.isArray(response.data)) songsData = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) songsData = response.data.result;
      else if (response.data) songsData = [response.data];

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
      if (Array.isArray(response.data)) usersData = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) usersData = response.data.result;
      else if (response.data) usersData = [response.data];

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
      if (Array.isArray(response.data)) artistsData = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) artistsData = response.data.result;
      else if (response.data) artistsData = [response.data];

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
      if (Array.isArray(response.data)) albumsData = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) albumsData = response.data.result;
      else if (response.data) albumsData = [response.data];

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
      if (Array.isArray(response.data)) genresData = response.data;
      else if (response.data.result && Array.isArray(response.data.result)) genresData = response.data.result;
      else if (response.data) genresData = [response.data];

      setGenres(genresData);
      setStats(prev => ({ ...prev, totalGenres: genresData.length }));
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleCreate = () => {
    setFormData(getEmptyFormData());
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData(getFormDataFromItem(item));
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa?`)) return;

    try {
      let endpoint = '';
      switch (type) {
        case 'song': endpoint = API_ENDPOINTS.SONG_BY_ID(id); break;
        case 'user': endpoint = API_ENDPOINTS.USER_BY_ID(id); break;
        case 'artist': endpoint = API_ENDPOINTS.ARTIST_BY_ID(id); break;
        case 'album': endpoint = API_ENDPOINTS.ALBUM_BY_ID(id); break;
        case 'genre': endpoint = API_ENDPOINTS.GENRE_BY_ID(id); break;
        default: return;
      }

      await api.delete(endpoint);
      alert('Xóa thành công!');
      loadAllData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert('Xóa thất bại!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (showCreateModal) {
        const endpoint = getEndpoint('create');
        const data = prepareFormData();
        await api.post(endpoint, data);
        alert('Tạo mới thành công!');
        setShowCreateModal(false);
      } else if (showEditModal) {
        const endpoint = getEndpoint('update');
        const data = prepareFormData();
        await api.put(endpoint, data);
        alert('Cập nhật thành công!');
        setShowEditModal(false);
        setSelectedItem(null);
      }

      loadAllData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Lưu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const getEmptyFormData = () => {
    switch (activeTab) {
      case 'songs':
        return {
          title: '',
          idartist: '',
          idalbum: '',
          duration: '',
          releasedate: new Date().toISOString().split('T')[0],
          views: '0',
          avatar: '',
          path: '',
          lyrics: ''
        };
      case 'users':
        return { username: '', email: '', password: '', role: 'USER' };
      case 'artists':
        return { artistname: '', description: '' };
      case 'albums':
        return { albumname: '', releaseyear: new Date().getFullYear(), idartist: '' };
      case 'genres':
        return { genrename: '' };
      default:
        return {};
    }
  };

  const getFormDataFromItem = (item) => {
    switch (activeTab) {
      case 'songs':
        return {
          title: item.title || '',
          idartist: item.idartist || item.artist?.idartist || item.artist?.id || '',
          idalbum: item.idalbum || '',
          duration: item.duration || '',
          releasedate: item.releasedate || '',
          views: item.views || '0',
          avatar: item.avatar || '',
          path: item.path || '',
          lyrics: item.lyrics || ''
        };
      case 'users':
        return {
          username: item.username || '',
          email: item.email || '',
          role: item.role || 'USER'
        };
      case 'artists':
        return {
          artistname: item.artistname || item.name || '',
          description: item.description || ''
        };
      case 'albums':
        return {
          albumname: item.albumname || item.title || '',
          releaseyear: item.releaseyear || item.year || new Date().getFullYear(),
          idartist: item.idartist || item.artist?.id || ''
        };
      case 'genres':
        return {
          genrename: item.genrename || item.name || ''
        };
      default:
        return {};
    }
  };

  const validateForm = () => {
    const errors = {};

    switch (activeTab) {
      case 'songs':
        if (!formData.title?.trim()) errors.title = 'Tiêu đề không được để trống';
        if (!formData.idartist) errors.idartist = 'Nghệ sĩ không được để trống';
        if (!formData.path?.trim()) errors.path = 'Đường dẫn không được để trống';
        if (!formData.duration?.trim()) errors.duration = 'Thời lượng không được để trống';
        if (!formData.views?.trim()) errors.views = 'Lượt xem không được để trống';
        if (!formData.lyrics?.trim()) errors.lyrics = 'Lời bài hát không được để trống';
        break;
      case 'users':
        if (!formData.username?.trim()) errors.username = 'Username không được để trống';
        if (!formData.email?.trim()) errors.email = 'Email không được để trống';
        if (showCreateModal && !formData.password?.trim()) errors.password = 'Password không được để trống';
        break;
      case 'artists':
        if (!formData.artistname?.trim()) errors.artistname = 'Tên nghệ sĩ không được để trống';
        break;
      case 'albums':
        if (!formData.albumname?.trim()) errors.albumname = 'Tên album không được để trống';
        break;
      case 'genres':
        if (!formData.genrename?.trim()) errors.genrename = 'Tên thể loại không được để trống';
        break;
    }

    return errors;
  };

  const prepareFormData = () => {
    const data = { ...formData };

    if (data.idalbum && data.idalbum !== '') data.idalbum = Number(data.idalbum);
    if (data.releaseyear) data.releaseyear = Number(data.releaseyear);

    if (data.duration) {
      let dur = data.duration.trim();
      if (!dur.includes(':')) dur = '00:' + dur;
      if (dur.split(':').length === 2) dur += ':00';
      data.duration = dur;
    }

    ['avatar', 'releasedate'].forEach(key => {
      if (data[key] === '' || data[key] == null) delete data[key];
    });

    console.log('Prepared data:', data);
    return data;
  };

  const getEndpoint = (action) => {
    switch (activeTab) {
      case 'songs':
        return action === 'create' ? API_ENDPOINTS.SONGS : API_ENDPOINTS.SONG_BY_ID(selectedItem.songId || selectedItem.id);
      case 'users':
        return action === 'create' ? API_ENDPOINTS.USERS : API_ENDPOINTS.USER_BY_ID(selectedItem.iduser || selectedItem.id);
      case 'artists':
        return action === 'create' ? API_ENDPOINTS.ARTISTS : API_ENDPOINTS.ARTIST_BY_ID(selectedItem.idartist || selectedItem.id);
      case 'albums':
        return action === 'create' ? API_ENDPOINTS.ALBUMS : API_ENDPOINTS.ALBUM_BY_ID(selectedItem.idalbum || selectedItem.id);
      case 'genres':
        return action === 'create' ? API_ENDPOINTS.GENRES : API_ENDPOINTS.GENRE_BY_ID(selectedItem.idgenre || selectedItem.id);
      default:
        return '';
    }
  };

  const getItemId = (item) => {
    switch (activeTab) {
      case 'songs': return item.songId || item.id;
      case 'users': return item.iduser || item.id;
      case 'artists': return item.idartist || item.id;
      case 'albums': return item.idalbum || item.id;
      case 'genres': return item.idgenre || item.id;
      default: return item.id;
    }
  };

  const getFilteredData = () => {
    const data = { songs, users, artists, albums, genres }[activeTab] || [];
    if (!searchTerm) return data;

    const lower = searchTerm.toLowerCase();
    return data.filter(item => {
      switch (activeTab) {
        case 'songs':
          return (item.title || '').toLowerCase().includes(lower) ||
                 (item.artist?.artistname || '').toLowerCase().includes(lower);
        case 'users':
          return (item.username || '').toLowerCase().includes(lower) || (item.email || '').toLowerCase().includes(lower);
        case 'artists':
          return (item.artistname || item.name || '').toLowerCase().includes(lower);
        case 'albums':
          return (item.albumname || item.title || '').toLowerCase().includes(lower);
        case 'genres':
          return (item.genrename || item.name || '').toLowerCase().includes(lower);
        default:
          return true;
      }
    });
  };

  const getTableColumns = () => {
    switch (activeTab) {
      case 'songs':
        return ['ID', 'Tiêu đề', 'Nghệ sĩ', 'Album', 'Thời lượng', 'Lượt nghe', 'Actions'];
      case 'users':
        return ['ID', 'Username', 'Email', 'Vai trò', 'Ngày tạo', 'Actions'];
      case 'artists':
        return ['ID', 'Tên nghệ sĩ', 'Mô tả', 'Actions'];
      case 'albums':
        return ['ID', 'Tên album', 'Nghệ sĩ', 'Năm', 'Actions'];
      case 'genres':
        return ['ID', 'Tên thể loại', 'Actions'];
      default:
        return [];
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'songs':
        return (
          <>
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Nhập tiêu đề bài hát" className={formErrors.title ? 'error' : ''} />
              {formErrors.title && <div className="error-text">{formErrors.title}</div>}
            </div>

            <div className="form-group">
              <label>Nghệ sĩ *</label>
              <select value={formData.idartist || ''} onChange={e => setFormData({...formData, idartist: e.target.value})} className={formErrors.idartist ? 'error' : ''}>
                <option value="">-- Chọn nghệ sĩ --</option>
                {artists.map(artist => (
                  <option key={artist.idartist || artist.id} value={artist.idartist || artist.id}>
                    {artist.artistname || artist.name || 'Unknown'}
                  </option>
                ))}
              </select>
              {formErrors.idartist && <div className="error-text">{formErrors.idartist}</div>}
            </div>

            <div className="form-group">
              <label>Album (tùy chọn)</label>
              <select value={formData.idalbum || ''} onChange={e => setFormData({...formData, idalbum: e.target.value})}>
                <option value="">-- Không thuộc album --</option>
                {albums.map(album => (
                  <option key={album.idalbum || album.id} value={album.idalbum || album.id}>
                    {album.albumname || album.title || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Thời lượng *</label>
              <input type="text" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="VD: 04:12" className={formErrors.duration ? 'error' : ''} />
              {formErrors.duration && <div className="error-text">{formErrors.duration}</div>}
            </div>

            <div className="form-group">
              <label>Ngày phát hành (tùy chọn)</label>
              <input type="date" value={formData.releasedate || ''} onChange={e => setFormData({...formData, releasedate: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Lượt xem *</label>
              <input type="text" value={formData.views || '0'} onChange={e => setFormData({...formData, views: e.target.value})} placeholder="VD: 0" className={formErrors.views ? 'error' : ''} />
              {formErrors.views && <div className="error-text">{formErrors.views}</div>}
            </div>

            <div className="form-group">
              <label>Ảnh bìa (tùy chọn)</label>
              <input type="text" value={formData.avatar || ''} onChange={e => setFormData({...formData, avatar: e.target.value})} placeholder="URL ảnh bìa" />
            </div>

            <div className="form-group">
              <label>Đường dẫn file *</label>
              <input type="text" value={formData.path || ''} onChange={e => setFormData({...formData, path: e.target.value})} placeholder="URL file mp3" className={formErrors.path ? 'error' : ''} />
              {formErrors.path && <div className="error-text">{formErrors.path}</div>}
            </div>

            <div className="form-group">
              <label>Lời bài hát *</label>
              <textarea value={formData.lyrics || ''} onChange={e => setFormData({...formData, lyrics: e.target.value})} placeholder="Nhập lời bài hát" rows={4} className={formErrors.lyrics ? 'error' : ''} />
              {formErrors.lyrics && <div className="error-text">{formErrors.lyrics}</div>}
            </div>
          </>
        );

      case 'users':
        return (
          <>
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Nhập username" className={formErrors.username ? 'error' : ''} disabled={showEditModal} />
              {formErrors.username && <div className="error-text">{formErrors.username}</div>}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Nhập email" className={formErrors.email ? 'error' : ''} />
              {formErrors.email && <div className="error-text">{formErrors.email}</div>}
            </div>

            {showCreateModal && (
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Nhập mật khẩu" className={formErrors.password ? 'error' : ''} />
                {formErrors.password && <div className="error-text">{formErrors.password}</div>}
              </div>
            )}

            <div className="form-group">
              <label>Vai trò</label>
              <select value={formData.role || 'USER'} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </>
        );

      case 'artists':
        return (
          <>
            <div className="form-group">
              <label>Tên nghệ sĩ *</label>
              <input type="text" value={formData.artistname || ''} onChange={e => setFormData({...formData, artistname: e.target.value})} placeholder="Nhập tên nghệ sĩ" className={formErrors.artistname ? 'error' : ''} />
              {formErrors.artistname && <div className="error-text">{formErrors.artistname}</div>}
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Nhập mô tả về nghệ sĩ" rows={3} />
            </div>
          </>
        );

      case 'albums':
        return (
          <>
            <div className="form-group">
              <label>Tên album *</label>
              <input type="text" value={formData.albumname || ''} onChange={e => setFormData({...formData, albumname: e.target.value})} placeholder="Nhập tên album" className={formErrors.albumname ? 'error' : ''} />
              {formErrors.albumname && <div className="error-text">{formErrors.albumname}</div>}
            </div>

            <div className="form-group">
              <label>Năm phát hành</label>
              <input type="number" value={formData.releaseyear || new Date().getFullYear()} onChange={e => setFormData({...formData, releaseyear: parseInt(e.target.value) || ''})} placeholder="2024" />
            </div>

            <div className="form-group">
              <label>Nghệ sĩ</label>
              <select value={formData.idartist || ''} onChange={e => setFormData({...formData, idartist: e.target.value})}>
                <option value="">-- Chọn nghệ sĩ --</option>
                {artists.map(artist => (
                  <option key={artist.idartist || artist.id} value={artist.idartist || artist.id}>
                    {artist.artistname || artist.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case 'genres':
        return (
          <div className="form-group">
            <label>Tên thể loại *</label>
            <input type="text" value={formData.genrename || ''} onChange={e => setFormData({...formData, genrename: e.target.value})} placeholder="Nhập tên thể loại" className={formErrors.genrename ? 'error' : ''} />
            {formErrors.genrename && <div className="error-text">{formErrors.genrename}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  const renderTableRow = (item) => {
    switch (activeTab) {
      case 'songs':
        return (
          <tr key={item.songId || item.id}>
            <td>{item.songId || item.id}</td>
            <td>{item.title || 'Không có tiêu đề'}</td>
            <td>{item.artist?.artistname || item.artist || 'Unknown'}</td>
            <td>{item.album?.albumname || '-'}</td>
            <td>{item.duration || '00:00'}</td>
            <td>{item.views || 0}</td>
            <td className="actions-cell">
              <button className="btn-action edit" title="Sửa" onClick={() => handleEdit(item)}>
                <Edit size={14} />
              </button>
              <button className="btn-action delete" title="Xóa" onClick={() => handleDelete('song', getItemId(item))}>
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );

      case 'users':
        return (
          <tr key={item.iduser || item.id}>
            <td>{item.iduser || item.id}</td>
            <td>{item.username || 'Unknown'}</td>
            <td>{item.email || 'No email'}</td>
            <td>
              <span className={`role-badge ${(item.role || 'USER').toLowerCase()}`}>
                {item.role || 'USER'}
              </span>
            </td>
            <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}</td>
            <td className="actions-cell">
              <button className="btn-action edit" title="Sửa" onClick={() => handleEdit(item)}>
                <Edit size={14} />
              </button>
              {item.role !== 'ADMIN' && (
                <button className="btn-action delete" title="Xóa" onClick={() => handleDelete('user', getItemId(item))}>
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
            <td>{item.artistname || item.name || 'Unknown Artist'}</td>
            <td>{item.description || 'No description'}</td>
            <td className="actions-cell">
              <button className="btn-action edit" title="Sửa" onClick={() => handleEdit(item)}>
                <Edit size={14} />
              </button>
              <button className="btn-action delete" title="Xóa" onClick={() => handleDelete('artist', getItemId(item))}>
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );

      case 'albums':
        return (
          <tr key={item.idalbum || item.id}>
            <td>{item.idalbum || item.id}</td>
            <td>{item.albumname || item.title || 'Unknown'}</td>
            <td>{item.artist?.name || item.artistname || '-'}</td>
            <td>{item.releaseyear || item.year || '-'}</td>
            <td className="actions-cell">
              <button className="btn-action edit" title="Sửa" onClick={() => handleEdit(item)}>
                <Edit size={14} />
              </button>
              <button className="btn-action delete" title="Xóa" onClick={() => handleDelete('album', getItemId(item))}>
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );

      case 'genres':
        return (
          <tr key={item.idgenre || item.id}>
            <td>{item.idgenre || item.id}</td>
            <td>{item.genrename || item.name || 'Unknown'}</td>
            <td className="actions-cell">
              <button className="btn-action edit" title="Sửa" onClick={() => handleEdit(item)}>
                <Edit size={14} />
              </button>
              <button className="btn-action delete" title="Xóa" onClick={() => handleDelete('genre', getItemId(item))}>
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <p>Quản lý toàn bộ dữ liệu hệ thống</p>
        </div>
        <div className="header-right">
          <button className="header-btn header-btn-refresh" onClick={loadAllData} title="Tải lại dữ liệu">
            <RefreshCw size={16} />
            <span>Tải lại</span>
          </button>

          <button className="header-btn header-btn-home" onClick={() => window.location.href = '/'} title="Về trang chủ">
            <Home size={16} />
            <span>Trang chủ</span>
          </button>

          <button className="header-btn header-btn-logout" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

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

      <div className="dashboard-content">
        <div className="tabs-navigation">
          <button className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`} onClick={() => setActiveTab('songs')}>
            <Music size={16} />
            Bài hát
          </button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={16} />
            Người dùng
          </button>
          <button className={`tab-btn ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => setActiveTab('artists')}>
            <Users size={16} />
            Nghệ sĩ
          </button>
          <button className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => setActiveTab('albums')}>
            <Disc size={16} />
            Albums
          </button>
          <button className={`tab-btn ${activeTab === 'genres' ? 'active' : ''}`} onClick={() => setActiveTab('genres')}>
            <Tag size={16} />
            Thể loại
          </button>
        </div>

        <div className="table-toolbar">
          <div className="search-container">
            <Search size={18} />
            <input type="text" placeholder={`Tìm kiếm ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-actions">
            <button className="btn-create" onClick={handleCreate}>
              <Plus size={16} />
              Thêm mới
            </button>
          </div>
        </div>

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
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Thêm mới {activeTab}</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {renderFormFields()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="spinner-small" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Sửa {activeTab}</h3>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                setSelectedItem(null);
              }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {renderFormFields()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}>
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="spinner-small" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Cập nhật
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;