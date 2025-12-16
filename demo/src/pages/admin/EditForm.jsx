// FILE: demo/src/components/admin/EditForm.jsx
import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './EditForm.css';

function EditForm({ 
  activeTab, 
  selectedItem, 
  onClose, 
  onSuccess,
  artists // Truyền thêm dữ liệu cần thiết
}) {
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load dữ liệu khi component mount
  useEffect(() => {
    if (selectedItem) {
      loadItemData();
    }
  }, [selectedItem]);

  const loadItemData = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    try {
      // Nếu cần load thêm dữ liệu chi tiết
      const endpoint = getEndpoint('detail');
      if (endpoint) {
        const response = await api.get(endpoint);
        setFormData(getFormDataFromItem(response.data));
      } else {
        setFormData(getFormDataFromItem(selectedItem));
      }
    } catch (error) {
      console.error('Error loading item data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormDataFromItem = (item) => {
    switch(activeTab) {
      case 'songs':
        return {
          title: item.title || '',
          artist: item.artist || '',
          duration: item.duration || '',
          path: item.path || '',
          avatar: item.avatar || '',
          idalbum: item.idalbum || '',
          views: item.views || 0
        };
      case 'users':
        return {
          username: item.username || '',
          email: item.email || '',
          role: item.role || 'USER',
          createdAt: item.createdAt || ''
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
    
    switch(activeTab) {
      case 'songs':
        if (!formData.title?.trim()) errors.title = 'Tiêu đề không được để trống';
        if (!formData.path?.trim()) errors.path = 'Đường dẫn không được để trống';
        break;
      case 'users':
        if (!formData.username?.trim()) errors.username = 'Username không được để trống';
        if (!formData.email?.trim()) errors.email = 'Email không được để trống';
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

  const getEndpoint = (action) => {
    const id = getItemId();
    
    switch(activeTab) {
      case 'songs':
        if (action === 'detail') return API_ENDPOINTS.SONG_BY_ID(id);
        if (action === 'update') return API_ENDPOINTS.SONG_BY_ID(id);
        break;
      case 'users':
        if (action === 'detail') return API_ENDPOINTS.USER_BY_ID(id);
        if (action === 'update') return API_ENDPOINTS.USER_BY_ID(id);
        break;
      case 'artists':
        if (action === 'detail') return API_ENDPOINTS.ARTIST_BY_ID(id);
        if (action === 'update') return API_ENDPOINTS.ARTIST_BY_ID(id);
        break;
      case 'albums':
        if (action === 'detail') return API_ENDPOINTS.ALBUM_BY_ID(id);
        if (action === 'update') return API_ENDPOINTS.ALBUM_BY_ID(id);
        break;
      case 'genres':
        if (action === 'detail') return API_ENDPOINTS.GENRE_BY_ID(id);
        if (action === 'update') return API_ENDPOINTS.GENRE_BY_ID(id);
        break;
    }
    
    return '';
  };

  const getItemId = () => {
    if (!selectedItem) return null;
    
    switch(activeTab) {
      case 'songs': return selectedItem.songId || selectedItem.id;
      case 'users': return selectedItem.iduser || selectedItem.id;
      case 'artists': return selectedItem.idartist || selectedItem.id;
      case 'albums': return selectedItem.idalbum || selectedItem.id;
      case 'genres': return selectedItem.idgenre || selectedItem.id;
      default: return selectedItem.id;
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
      const endpoint = getEndpoint('update');
      const data = prepareFormData();
      
      await api.put(endpoint, data);
      alert('Cập nhật thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating:', error);
      alert('Lưu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const prepareFormData = () => {
    const data = { ...formData };
    
    // Remove fields that shouldn't be sent
    delete data.createdAt;
    
    // Remove empty fields
    Object.keys(data).forEach(key => {
      if (data[key] === '' || data[key] == null) {
        delete data[key];
      }
    });
    
    return data;
  };

  const renderFormFields = () => {
    if (loading) {
      return (
        <div className="loading-form">
          <Loader2 className="spinner" size={32} />
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    switch(activeTab) {
      case 'songs':
        return (
          <>
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Nhập tiêu đề bài hát"
                className={formErrors.title ? 'error' : ''}
              />
              {formErrors.title && <div className="error-text">{formErrors.title}</div>}
            </div>
            
            <div className="form-group">
              <label>Nghệ sĩ</label>
              <input
                type="text"
                value={formData.artist || ''}
                onChange={e => setFormData({...formData, artist: e.target.value})}
                placeholder="Nhập tên nghệ sĩ"
              />
            </div>
            
            <div className="form-group">
              <label>Album ID</label>
              <input
                type="text"
                value={formData.idalbum || ''}
                onChange={e => setFormData({...formData, idalbum: e.target.value})}
                placeholder="ID album"
              />
            </div>
            
            <div className="form-group">
              <label>Thời lượng</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                placeholder="VD: 3:45"
              />
            </div>
            
            <div className="form-group">
              <label>Đường dẫn file *</label>
              <input
                type="text"
                value={formData.path || ''}
                onChange={e => setFormData({...formData, path: e.target.value})}
                placeholder="URL file mp3"
                className={formErrors.path ? 'error' : ''}
              />
              {formErrors.path && <div className="error-text">{formErrors.path}</div>}
            </div>
            
            <div className="form-group">
              <label>Ảnh bìa</label>
              <input
                type="text"
                value={formData.avatar || ''}
                onChange={e => setFormData({...formData, avatar: e.target.value})}
                placeholder="URL ảnh bìa"
              />
            </div>
            
            <div className="form-group">
              <label>Lượt nghe</label>
              <input
                type="number"
                value={formData.views || 0}
                onChange={e => setFormData({...formData, views: parseInt(e.target.value) || 0})}
              />
            </div>
          </>
        );

      case 'users':
        return (
          <>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={formData.username || ''}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Nhập username"
                className={formErrors.username ? 'error' : ''}
                disabled
              />
              {formErrors.username && <div className="error-text">{formErrors.username}</div>}
              <small className="form-hint">Username không thể thay đổi</small>
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="Nhập email"
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <div className="error-text">{formErrors.email}</div>}
            </div>
            
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Để trống nếu không đổi"
              />
              <small className="form-hint">Chỉ nhập nếu muốn thay đổi mật khẩu</small>
            </div>
            
            <div className="form-group">
              <label>Vai trò</label>
              <select
                value={formData.role || 'USER'}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Ngày tạo</label>
              <input
                type="text"
                value={formData.createdAt ? new Date(formData.createdAt).toLocaleString() : ''}
                disabled
              />
            </div>
          </>
        );

      case 'artists':
        return (
          <>
            <div className="form-group">
              <label>Tên nghệ sĩ *</label>
              <input
                type="text"
                value={formData.artistname || ''}
                onChange={e => setFormData({...formData, artistname: e.target.value})}
                placeholder="Nhập tên nghệ sĩ"
                className={formErrors.artistname ? 'error' : ''}
              />
              {formErrors.artistname && <div className="error-text">{formErrors.artistname}</div>}
            </div>
            
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Nhập mô tả về nghệ sĩ"
                rows={4}
              />
            </div>
          </>
        );

      case 'albums':
        return (
          <>
            <div className="form-group">
              <label>Tên album *</label>
              <input
                type="text"
                value={formData.albumname || ''}
                onChange={e => setFormData({...formData, albumname: e.target.value})}
                placeholder="Nhập tên album"
                className={formErrors.albumname ? 'error' : ''}
              />
              {formErrors.albumname && <div className="error-text">{formErrors.albumname}</div>}
            </div>
            
            <div className="form-group">
              <label>Năm phát hành</label>
              <input
                type="number"
                value={formData.releaseyear || new Date().getFullYear()}
                onChange={e => setFormData({...formData, releaseyear: parseInt(e.target.value) || ''})}
                placeholder="2024"
              />
            </div>
            
            <div className="form-group">
              <label>Nghệ sĩ</label>
              <select
                value={formData.idartist || ''}
                onChange={e => setFormData({...formData, idartist: e.target.value})}
              >
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
            <input
              type="text"
              value={formData.genrename || ''}
              onChange={e => setFormData({...formData, genrename: e.target.value})}
              placeholder="Nhập tên thể loại"
              className={formErrors.genrename ? 'error' : ''}
            />
            {formErrors.genrename && <div className="error-text">{formErrors.genrename}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'songs': return `Sửa bài hát: ${selectedItem?.title || ''}`;
      case 'users': return `Sửa người dùng: ${selectedItem?.username || ''}`;
      case 'artists': return `Sửa nghệ sĩ: ${selectedItem?.artistname || selectedItem?.name || ''}`;
      case 'albums': return `Sửa album: ${selectedItem?.albumname || selectedItem?.title || ''}`;
      case 'genres': return `Sửa thể loại: ${selectedItem?.genrename || selectedItem?.name || ''}`;
      default: return 'Sửa';
    }
  };

  return (
    <div className="edit-form-modal">
      <div className="edit-form-content">
        <div className="edit-form-header">
          <h3>{getTitle()}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="edit-form-body">
            {renderFormFields()}
          </div>
          
          <div className="edit-form-footer">
            <button 
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={saving || loading}
            >
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
  );
}

export default EditForm;    