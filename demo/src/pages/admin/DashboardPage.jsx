import { useState, useEffect, useMemo } from 'react';
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

  const [rawSongs, setRawSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistSongs, setArtistSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [songGenreMap, setSongGenreMap] = useState({});

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

  // Hàm normalize data từ API
  const normalize = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.result)) return res.data.result;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Xây dựng các map để ánh xạ ID → Tên
  const artistMap = useMemo(() => {
    const map = {};
    artists.forEach(artist => {
      const id = artist.idartist || artist.id;
      const name = artist.artistname || artist.name;
      if (id && name) {
        map[id] = name;
      }
    });
    return map;
  }, [artists]);

  const artistSongMap = useMemo(() => {
    const map = {};
    artistSongs.forEach(rel => {
      const songId = rel.idsong || rel.songId || rel.id_song;
      const artistId = rel.idartist || rel.artistId || rel.id_artist;
      
      if (songId && artistId) {
        if (!map[songId]) map[songId] = [];
        map[songId].push(artistId);
      }
    });
    return map;
  }, [artistSongs]);

  const albumMap = useMemo(() => {
    const map = {};
    albums.forEach(album => {
      const id = album.idalbum || album.id;
      const name = album.albumname || album.title;
      if (id && name) {
        map[id] = name;
      }
    });
    return map;
  }, [albums]);

  const genreMap = useMemo(() => {
    const map = {};
    genres.forEach(genre => {
      const id = genre.idgenre || genre.id;
      const name = genre.genrename || genre.name;
      if (id && name) {
        map[id] = name;
      }
    });
    return map;
  }, [genres]);

  // Xây dựng songGenreMap từ API hoặc từ dữ liệu có sẵn
  const buildSongGenreMap = async (genresData) => {
    const map = {};
    
    // Cách 1: Nếu API có endpoint GENRE_SONGS
    if (API_ENDPOINTS.GENRE_SONGS) {
      try {
        const results = await Promise.allSettled(
          genresData.map(async (genre) => {
            const genreId = genre.idgenre || genre.id;
            try {
              const res = await api.get(API_ENDPOINTS.GENRE_SONGS(genreId));
              const songsInGenre = normalize(res);
              songsInGenre.forEach(song => {
                const songId = song.songId || song.id;
                if (songId && !map[songId]) {
                  map[songId] = genre.genrename || genre.name;
                }
              });
            } catch (error) {
              console.warn(`Không thể load songs cho genre ${genreId}:`, error.message);
            }
          })
        );
      } catch (error) {
        console.error('Error building genre map:', error);
      }
    }
    
    // Cách 2: Dùng dữ liệu từ rawSongs nếu có field idgenre
    rawSongs.forEach(song => {
      const songId = song.songId || song.id;
      const genreId = song.idgenre;
      
      if (songId && genreId) {
        const genre = genresData.find(g => 
          g.idgenre == genreId || g.id == genreId
        );
        if (genre && !map[songId]) {
          map[songId] = genre.genrename || genre.name;
        }
      }
    });
    
    return map;
  };

  // Tính toán songs với thông tin đầy đủ
  const songsWithDetails = useMemo(() => {
    if (!rawSongs.length) return [];

    return rawSongs.map(song => {
      const songId = song.songId || song.id;
      
      // Lấy tên nghệ sĩ - ưu tiên theo thứ tự
      let artistName = 'Unknown Artist';
      
      // 1. Thử từ artistSongMap (quan hệ N-N)
      const artistIds = artistSongMap[songId];
      if (artistIds && artistIds.length > 0) {
        const names = artistIds
          .map(id => artistMap[id])
          .filter(Boolean);
        if (names.length > 0) {
          artistName = names.join(', ');
        }
      }
      
      // 2. Nếu không có, thử từ song.idartist trực tiếp
      if (artistName === 'Unknown Artist' && song.idartist) {
        const directArtist = artistMap[song.idartist];
        if (directArtist) {
          artistName = directArtist;
        }
      }
      
      // 3. Thử từ song.artist (có thể là string hoặc object)
      if (artistName === 'Unknown Artist') {
        if (typeof song.artist === 'string') {
          artistName = song.artist;
        } else if (song.artist && typeof song.artist === 'object') {
          artistName = song.artist.artistname || song.artist.name || song.artist;
        }
      }
      
      // Lấy tên thể loại - ưu tiên theo thứ tự
      let genreName = 'Unknown Genre';
      
      // 1. Thử từ songGenreMap
      if (songGenreMap[songId]) {
        genreName = songGenreMap[songId];
      }
      // 2. Thử từ song.idgenre
      else if (song.idgenre && genreMap[song.idgenre]) {
        genreName = genreMap[song.idgenre];
      }
      // 3. Thử từ song.genre (có thể là string hoặc object)
      else if (song.genre) {
        if (typeof song.genre === 'string') {
          genreName = song.genre;
        } else if (typeof song.genre === 'object') {
          genreName = song.genre.genrename || song.genre.name || song.genre;
        }
      }
      
      // Lấy tên album
      let albumName = '-';
      if (song.idalbum && albumMap[song.idalbum]) {
        albumName = albumMap[song.idalbum];
      } else if (song.album) {
        if (typeof song.album === 'string') {
          albumName = song.album;
        } else if (typeof song.album === 'object') {
          albumName = song.album.albumname || song.album.title || song.album;
        }
      }
      
      return {
        ...song,
        artistName,
        genreName,
        albumName
      };
    });
  }, [rawSongs, artistSongMap, artistMap, albumMap, genreMap, songGenreMap]);

  // Albums với artist
  const albumsWithArtists = useMemo(() => {
    if (!albums.length || !artists.length) return albums;
    
    return albums.map(album => {
      let artistName = 'Unknown Artist';
      const artistId = album.idartist;
      
      if (artistId && artistMap[artistId]) {
        artistName = artistMap[artistId];
      } else if (album.artist) {
        if (typeof album.artist === 'string') {
          artistName = album.artist;
        } else if (typeof album.artist === 'object') {
          artistName = album.artist.artistname || album.artist.name || album.artist;
        }
      }
      
      return {
        ...album,
        artistName
      };
    });
  }, [albums, artists, artistMap]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Tạo các request
      const requests = [
        api.get(API_ENDPOINTS.SONGS),
        api.get(API_ENDPOINTS.USERS),
        api.get(API_ENDPOINTS.ARTISTS),
        api.get(API_ENDPOINTS.ALBUMS),
        api.get(API_ENDPOINTS.GENRES)
      ];
      
      // Thêm request cho artistSongs nếu có endpoint
      if (API_ENDPOINTS.ARTIST_SONGS) {
        requests.push(api.get(API_ENDPOINTS.ARTIST_SONGS.BASE || API_ENDPOINTS.ARTIST_SONGS));
      }
      
      const responses = await Promise.all(requests.map(p => p.catch(e => ({ error: e }))));
      
      // Xử lý responses
      const [
        songsRes, 
        usersRes, 
        artistsRes, 
        albumsRes, 
        genresRes,
        artistSongsRes
      ] = responses;
      
      // Normalize data
      const songsData = normalize(songsRes);
      const usersData = normalize(usersRes);
      const artistsData = normalize(artistsRes);
      const albumsData = normalize(albumsRes);
      const genresData = normalize(genresRes);
      const artistSongsData = artistSongsRes && !artistSongsRes.error ? 
        normalize(artistSongsRes) : [];
      
      console.log('Data loaded:', {
        songs: songsData.length,
        users: usersData.length,
        artists: artistsData.length,
        albums: albumsData.length,
        genres: genresData.length,
        artistSongs: artistSongsData.length
      });
      
      // Set state
      setRawSongs(songsData);
      setUsers(usersData);
      setArtists(artistsData);
      setAlbums(albumsData);
      setGenres(genresData);
      setArtistSongs(artistSongsData);
      
      // Build songGenreMap
      const genreMapping = await buildSongGenreMap(genresData);
      setSongGenreMap(genreMapping);
      
      // Update stats
      setStats({
        totalSongs: songsData.length,
        totalUsers: usersData.length,
        totalArtists: artistsData.length,
        totalAlbums: albumsData.length,
        totalGenres: genresData.length
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      alert('Không thể tải dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

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
          title: item.title || item.name || '',
          idartist: item.idartist || item.artistId || '',
          idalbum: item.idalbum || item.albumId || '',
          idgenre: item.idgenre || item.genreId || '',
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
          artistname: item.artistname || item.name || '',
          description: item.description || ''
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
        if (!formData.idartist) errors.idartist = 'Nghệ sĩ không được để trống';
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
    if (data.idgenre && data.idgenre !== '') data.idgenre = Number(data.idgenre);
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
    let data;
    switch (activeTab) {
      case 'songs':
        data = songsWithDetails;
        break;
      case 'albums':
        data = albumsWithArtists;
        break;
      default:
        data = { users, artists, albums, genres }[activeTab] || [];
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
          return (item.username || '').toLowerCase().includes(lower) || 
                 (item.email || '').toLowerCase().includes(lower);
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
              <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Nhập tiêu đề bài hát" className={formErrors.title ? 'error' : ''} />
              {formErrors.title && <div className="error-text">{formErrors.title}</div>}
            </div>

            <div className="form-group">
              <label>Nghệ sĩ *</label>
              <select value={formData.idartist || ''} onChange={e => setFormData({ ...formData, idartist: e.target.value })} className={formErrors.idartist ? 'error' : ''}>
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
              <select value={formData.idalbum || ''} onChange={e => setFormData({ ...formData, idalbum: e.target.value })}>
                <option value="">-- Không thuộc album --</option>
                {albumsWithArtists.map(album => (
                  <option key={album.idalbum || album.id} value={album.idalbum || album.id}>
                    {album.albumname || album.title || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Thể loại (tùy chọn)</label>
              <select value={formData.idgenre || ''} onChange={e => setFormData({ ...formData, idgenre: e.target.value })}>
                <option value="">-- Không có thể loại --</option>
                {genres.map(genre => (
                  <option key={genre.idgenre || genre.id} value={genre.idgenre || genre.id}>
                    {genre.genrename || genre.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Thời lượng *</label>
              <input type="text" value={formData.duration || ''} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="VD: 04:12" className={formErrors.duration ? 'error' : ''} />
              {formErrors.duration && <div className="error-text">{formErrors.duration}</div>}
            </div>

            <div className="form-group">
              <label>Ngày phát hành (tùy chọn)</label>
              <input type="date" value={formData.releasedate || ''} onChange={e => setFormData({ ...formData, releasedate: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Lượt xem *</label>
              <input type="text" value={formData.views || '0'} onChange={e => setFormData({ ...formData, views: e.target.value })} placeholder="VD: 0" />
            </div>

            <div className="form-group">
              <label>Ảnh bìa (tùy chọn)</label>
              <input type="text" value={formData.avatar || ''} onChange={e => setFormData({ ...formData, avatar: e.target.value })} placeholder="URL ảnh bìa" />
            </div>

            <div className="form-group">
              <label>Đường dẫn file *</label>
              <input type="text" value={formData.path || ''} onChange={e => setFormData({ ...formData, path: e.target.value })} placeholder="URL file mp3" className={formErrors.path ? 'error' : ''} />
              {formErrors.path && <div className="error-text">{formErrors.path}</div>}
            </div>

            <div className="form-group">
              <label>Lời bài hát (tùy chọn)</label>
              <textarea value={formData.lyrics || ''} onChange={e => setFormData({ ...formData, lyrics: e.target.value })} placeholder="Nhập lời bài hát" rows={4} />
            </div>
          </>
        );
      case 'users':
        return (
          <>
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Nhập username" className={formErrors.username ? 'error' : ''} disabled={showEditModal} />
              {formErrors.username && <div className="error-text">{formErrors.username}</div>}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Nhập email" className={formErrors.email ? 'error' : ''} />
              {formErrors.email && <div className="error-text">{formErrors.email}</div>}
            </div>

            {showCreateModal && (
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Nhập mật khẩu" className={formErrors.password ? 'error' : ''} />
                {formErrors.password && <div className="error-text">{formErrors.password}</div>}
              </div>
            )}

            <div className="form-group">
              <label>Vai trò</label>
              <select value={formData.role || 'USER'} onChange={e => setFormData({ ...formData, role: e.target.value })}>
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
              <input type="text" value={formData.artistname || ''} onChange={e => setFormData({ ...formData, artistname: e.target.value })} placeholder="Nhập tên nghệ sĩ" className={formErrors.artistname ? 'error' : ''} />
              {formErrors.artistname && <div className="error-text">{formErrors.artistname}</div>}
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Nhập mô tả về nghệ sĩ" rows={3} />
            </div>
          </>
        );
      case 'albums':
        return (
          <>
            <div className="form-group">
              <label>Tên album *</label>
              <input type="text" value={formData.albumname || ''} onChange={e => setFormData({ ...formData, albumname: e.target.value })} placeholder="Nhập tên album" className={formErrors.albumname ? 'error' : ''} />
              {formErrors.albumname && <div className="error-text">{formErrors.albumname}</div>}
            </div>

            <div className="form-group">
              <label>Năm phát hành</label>
              <input type="number" value={formData.releaseyear || new Date().getFullYear()} onChange={e => setFormData({ ...formData, releaseyear: parseInt(e.target.value) || '' })} placeholder="2024" />
            </div>

            <div className="form-group">
              <label>Nghệ sĩ</label>
              <select value={formData.idartist || ''} onChange={e => setFormData({ ...formData, idartist: e.target.value })}>
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
            <input type="text" value={formData.genrename || ''} onChange={e => setFormData({ ...formData, genrename: e.target.value })} placeholder="Nhập tên thể loại" className={formErrors.genrename ? 'error' : ''} />
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
        const songId = item.songId || item.id || 'N/A';
        const title = item.title || item.name || 'Không có tiêu đề';
        const artistName = item.artistName || 'Unknown Artist';
        const genreName = item.genreName || 'Unknown Genre';
        const listens = item.views || item.listens || 0;
        const duration = item.duration || '00:00';
        const albumName = item.albumName || '-';

        return (
          <tr key={songId}>
            <td>{songId}</td>
            <td>{title}</td>
            <td>{artistName}</td>
            <td>{albumName}</td>
            <td>{genreName}</td>
            <td>{duration}</td>
            <td>{listens}</td>
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
        const userId = item.iduser || item.id;
        const createdAt = item.createdAt || new Date().toISOString();
        return (
          <tr key={userId}>
            <td>{userId}</td>
            <td>{item.username || 'Unknown'}</td>
            <td>{item.email || 'No email'}</td>
            <td>
              <span className={`role-badge ${(item.role || 'USER').toLowerCase()}`}>
                {item.role || 'USER'}
              </span>
            </td>
            <td>{new Date(createdAt).toLocaleDateString()}</td>
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
        const artistId = item.idartist || item.id;
        return (
          <tr key={artistId}>
            <td>{artistId}</td>
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
        const albumId = item.idalbum || item.id;
        const albumArtistName = item.artistName || item.artistname || item.artist || '-';
        const albumYear = item.releaseyear || item.year || '-';
        return (
          <tr key={albumId}>
            <td>{albumId}</td>
            <td>{item.albumname || item.title || 'Unknown'}</td>
            <td>{albumArtistName}</td>
            <td>{albumYear}</td>
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
        const genreId = item.idgenre || item.id;
        return (
          <tr key={genreId}>
            <td>{genreId}</td>
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
                      <p>{searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu. Thử tải lại?'}</p>
                      {!searchTerm && <button onClick={loadAllData}>Tải lại</button>}
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