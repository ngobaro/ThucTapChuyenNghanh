// src/pages/admin/DashboardPage.jsx
import { useState } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useDashboardData } from '../../hooks/useDashboardData';
import DashboardHeader from '../../components/admin/DashboardHeader';
import StatsGrid from '../../components/admin/StatsGrid';
import TabsNavigation from '../../components/admin/TabsNavigation';
import TableToolbar from '../../components/admin/TableToolbar';
import DataTable from '../../components/admin/DataTable';
import FormModal from '../../components/admin/FormModal';
import './DashboardPage.css';

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('songs');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const {
    loading,
    users,
    artists,
    genres,
    albums,
    songsWithDetails,
    albumsWithArtists,
    stats,
    loadAllData,
    artistSongMap,   // songId → [{ relationId, artistId }]
    songGenreMap,
  } = useDashboardData();

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
    const baseFormData = getFormDataFromItem(item);

    if (activeTab === 'songs') {
      const songId = item.songId || item.id;

      const currentRels = artistSongMap[songId] || [];
      const primaryArtistId = currentRels.length > 0 ? currentRels[0].artistId : '';

      let genreId = '';
      const currentGenreName = songGenreMap[songId];
      if (currentGenreName) {
        const found = genres.find(g => (g.genrename || g.name) === currentGenreName);
        genreId = found ? (found.idgenre || found.id || '') : '';
      }

      setFormData({
        ...baseFormData,
        idartist: primaryArtistId,
        idgenre: genreId
      });
    } else {
      setFormData(baseFormData);
    }

    setFormErrors({});
    setShowEditModal(true);
  };

  // ================== XÓA BÀI HÁT - XÓA QUAN HỆ TRƯỚC ==================
  const handleDelete = async (type, id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;

    if (type !== 'song') {
      try {
        let endpoint = '';
        switch (type) {
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
      return;
    }

    // XÓA BÀI HÁT
    const songId = id;

    try {
      // 1. Xóa quan hệ nghệ sĩ
      const artistRels = artistSongMap[songId] || [];
      for (const rel of artistRels) {
        if (rel.relationId) {
          await api.delete(`/artistsongs/${rel.relationId}`);
        }
      }

      // 2. Xóa quan hệ thể loại
      const currentGenreName = songGenreMap[songId];
      if (currentGenreName) {
        const foundGenre = genres.find(g => (g.genrename || g.name) === currentGenreName);
        const genreId = foundGenre ? (foundGenre.idgenre || foundGenre.id) : null;
        if (genreId) {
          await api.delete(`/genres/${genreId}/songs/${songId}`);
        }
      }

      // 3. Xóa bài hát
      await api.delete(API_ENDPOINTS.SONG_BY_ID(songId));

      alert('Xóa bài hát thành công!');
      loadAllData();
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Xóa bài hát thất bại! Vui lòng thử lại.');
    }
  };

  // ================== HANDLE SUBMIT - HOÀN CHỈNH CHO TẠO MỚI + SỬA ==================
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
        // TẠO MỚI BÀI HÁT
        const endpoint = getEndpoint('create');
        const data = prepareFormData();
        const createRes = await api.post(endpoint, data);

        // Thử lấy ID bài hát mới
        const newSongId = createRes.data?.songId ||
                          createRes.data?.id ||
                          createRes.data?.result?.id ||
                          createRes.data?.result?.songId ||
                          createRes.data?.data?.id ||
                          createRes.data?.data?.songId;

        let relationsSuccess = true;

        if (newSongId) {
          if (formData.idartist) {
            try {
              await api.post('/artistsongs', { idartist: Number(formData.idartist), idsong: newSongId });
            } catch (err) {
              relationsSuccess = false;
            }
          }
          if (formData.idgenre) {
            try {
              await api.post(`/genres/${formData.idgenre}/songs/${newSongId}`);
            } catch (err) {
              relationsSuccess = false;
            }
          }
        } else {
          relationsSuccess = false;
        }

        alert(relationsSuccess
          ? 'Tạo bài hát thành công với nghệ sĩ và thể loại!'
          : 'Tạo bài hát thành công!\nNghệ sĩ và thể loại chưa được thêm. Vui lòng sửa lại để cập nhật.');
        setShowCreateModal(false);
      } 
      else if (showEditModal && activeTab === 'songs') {
        // SỬA BÀI HÁT
        const songId = selectedItem.songId || selectedItem.id;
        const endpoint = getEndpoint('update');
        const data = prepareFormData();
        await api.put(endpoint, data);

        // Cập nhật nghệ sĩ
        const newArtistId = formData.idartist ? Number(formData.idartist) : null;
        const currentRels = artistSongMap[songId] || [];
        for (const rel of currentRels) {
  if (rel.relationId) {
            await api.delete(`/artistsongs/${rel.relationId}`);
          }
        }
        if (newArtistId) {
          await api.post('/artistsongs', { idartist: newArtistId, idsong: songId });
        }

        // Cập nhật thể loại
        const newGenreId = formData.idgenre ? Number(formData.idgenre) : null;
        let oldGenreId = null;
        const currentGenreName = songGenreMap[songId];
        if (currentGenreName) {
          const found = genres.find(g => (g.genrename || g.name) === currentGenreName);
          oldGenreId = found ? (found.idgenre || found.id) : null;
        }
        if (oldGenreId) {
          await api.delete(`/genres/${oldGenreId}/songs/${songId}`);
        }
        if (newGenreId) {
          await api.post(`/genres/${newGenreId}/songs/${songId}`);
        }

        alert('Cập nhật bài hát thành công!');
        setShowEditModal(false);
        setSelectedItem(null);
      } 
      else if (showEditModal) {
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
          idgenre: '',
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
        return { artistname: '', infomation: '' };
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
          title: item.title || item.name || '',
          idalbum: item.idalbum || item.albumId || '',
          duration: item.duration || '',
          releasedate: item.releasedate || '',
          views: item.views || item.listens || '0',
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
          artistname: item.artistname || '',
          infomation: item.infomation || ''
        };
      case 'albums':
        return {
          albumname: item.albumname || item.title || '',
          releaseyear: item.releaseyear || item.year || new Date().getFullYear(),
          idartist: item.idartist || item.artistId || ''
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
        if (!formData.idartist) errors.idartist = 'Nghệ sĩ không được để trống'; // Bắt buộc luôn
        if (!formData.path?.trim()) errors.path = 'Đường dẫn không được để trống';
        if (!formData.duration?.trim()) errors.duration = 'Thời lượng không được để trống';
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

    ['avatar', 'releasedate', 'idartist', 'idgenre'].forEach(key => {
      if (data[key] === '' || data[key] == null) delete data[key];
    });

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

  const getFilteredData = () => {
    let data;
    switch (activeTab) {
      case 'songs': data = songsWithDetails; break;
      case 'albums': data = albumsWithArtists; break;
      default:
        data = { users, artists, albums: albumsWithArtists, genres }[activeTab] || [];
    }

    if (!searchTerm) return data;

    const lower = searchTerm.toLowerCase();
    return data.filter(item => {
      switch (activeTab) {
        case 'songs':
          return (item.title || item.name || '').toLowerCase().includes(lower) ||
                 (item.artistName || '').toLowerCase().includes(lower) ||
                 (item.genreName || '').toLowerCase().includes(lower);
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
        return ['ID', 'Tiêu đề', 'Nghệ sĩ', 'Album', 'Thể loại', 'Thời lượng', 'Lượt nghe', 'Actions'];
      case 'users':
        return ['ID', 'Username', 'Email', 'Vai trò', 'Actions'];
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

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
    setFormData({});
    setFormErrors({});
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
      <DashboardHeader onRefresh={loadAllData} onLogout={handleLogout} />

      <StatsGrid stats={stats} />

      <div className="dashboard-content">
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <TableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm('')}
          onCreateNew={handleCreate}
          activeTab={activeTab}
        />

        <DataTable
          data={getFilteredData()}
          columns={getTableColumns()}
          onEdit={handleEdit}
          onDelete={handleDelete}
          activeTab={activeTab}
          onRefresh={loadAllData}
          searchTerm={searchTerm}
        />
      </div>

      <FormModal
        show={showCreateModal || showEditModal}
        isEdit={showEditModal}
        activeTab={activeTab}
        formData={formData}
        formErrors={formErrors}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        saving={saving}
        artists={artists}
        albumsWithArtists={albumsWithArtists}
        genres={genres}
      />
    </div>
  );
}

export default DashboardPage;