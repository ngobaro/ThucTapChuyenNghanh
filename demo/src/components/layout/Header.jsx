// FILE: demo/src/components/layout/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, User, LogIn, LogOut,
  LayoutDashboard, User as UserIcon,
  X, Music, Disc
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { logout } from '../../services/authService';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const { playSong } = usePlayer();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('USER');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  /* ===================== AUTH ===================== */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserName(user.username || user.name || 'User');
        setUserRole(user.role?.toUpperCase() || 'USER');
      } catch {
        handleLogout();
      }
    }
  }, []);

  /* ===================== CLICK OUTSIDE ===================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ===================== SEARCH DEBOUNCE ===================== */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ===================== LOAD ARTISTS & ARTIST-SONGS ===================== */
  const loadArtistsMap = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.ARTISTS);
      const data = res.data?.result || res.data || [];
      const map = {};
      data.forEach(a => {
        map[a.idartist || a.id] = a.artistname || a.name;
      });
      return map;
    } catch {
      return {};
    }
  };

  const loadArtistSongs = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.ARTIST_SONGS.BASE);
      const data = res.data?.result || res.data || [];
      const map = {};
      data.forEach(i => {
        if (!map[i.idsong]) map[i.idsong] = [];
        map[i.idsong].push(i.idartist);
      });
      return map;
    } catch {
      return {};
    }
  };

  /* ===================== SEARCH ===================== */
  const performSearch = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);

    try {
      const [songsRes, albumsRes, artistsMap, artistSongMap] = await Promise.all([
        api.get(API_ENDPOINTS.SONGS, { params: { search: query, limit: 20 } }),
        api.get(API_ENDPOINTS.ALBUMS, { params: { search: query, limit: 20 } }),
        loadArtistsMap(),
        loadArtistSongs()
      ]);

      let songs = normalizeSongs(songsRes.data);
      let albums = normalizeAlbums(albumsRes.data);

      const q = query.toLowerCase();

      songs = songs.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
      ).slice(0, 6);

      albums = albums.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q)
      ).slice(0, 4);

      songs = songs.map(song => {
        const ids = artistSongMap[song.id] || [];
        const names = ids.map(id => artistsMap[id]).filter(Boolean);
        return {
          ...song,
          artist: names.join(', ') || song.artist
        };
      });

      setSearchResults([
        ...songs.map(s => ({ ...s, type: 'song' })),
        ...albums.map(a => ({ ...a, type: 'album' }))
      ]);

      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  /* ===================== NORMALIZE ===================== */
  const normalizeSongs = (data) => {
    const list = data?.result || data || [];
    return list.map(s => ({
      id: s.id || s.songId,
      title: s.title || s.songname || 'Không có tiêu đề',
      artist: s.artist || s.artistname || 'Nghệ sĩ không xác định',
      coverUrl: s.coverUrl || s.avatar || '/default-cover.png',
      audioUrl: s.audioUrl || s.path || ''
    }));
  };

  const normalizeAlbums = (data) => {
    const list = data?.result || data || [];
    return list.map(a => ({
      id: a.id || a.idalbum,
      title: a.albumname || a.title || 'Không có tiêu đề',
      artist: a.artist || a.artistname || 'Nghệ sĩ không xác định'
    }));
  };

  /* ===================== ACTIONS ===================== */
  const handleItemClick = (item) => {
    setShowSearchResults(false);
    setSearchQuery('');

    if (item.type === 'song' && item.audioUrl) {
      playSong(item);
    } else if (item.type === 'album') {
      navigate(`/album/${item.id}`);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch { }
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/');
  };

  /* ===================== RENDER ===================== */
  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">spoti-five</Link>
      </div>

      <div className="header-center" ref={searchRef}>
        <div className="search-container">
          <Search size={20} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài hát,  album..."
          />
        </div>

        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map((item, i) => (
              <div
                key={`${item.type}-${item.id || i}`}
                className="search-result-item"
                onClick={() => handleItemClick(item)}
              >
                {item.type === 'song' ? (
                  <img src={item.coverUrl} alt={item.title} onError={e => e.target.src = '/default-cover.png'} />
                ) : (
                  <Disc size={18} />
                )}
                <div>
                  <div className="result-title">{item.title}</div>
                  <small className="result-artist">{item.artist}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <div className="user-menu" ref={dropdownRef}>
            <div className="user-info" onClick={() => setShowDropdown(!showDropdown)}>
              <User size={20} />
              <span>{userName}</span>
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                {/* Mục Hồ sơ mới */}
                <div className="dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile'); // Thay bằng route profile của bạn nếu khác
                }}>
                  <UserIcon size={16} />
                  Hồ sơ
                </div>

                {/* Dashboard cho admin */}
                {userRole === 'ADMIN' && (
                  <div className="dropdown-item" onClick={() => {
                    setShowDropdown(false);
                    navigate('/admin/dashboard');
                  }}>
                    <LayoutDashboard size={16} />
                    Dashboard
                  </div>
                )}

                {/* Đăng xuất */}
                <div className="dropdown-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  Đăng xuất
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="auth-link">
              <LogIn size={18} /> Đăng nhập
            </Link>
            <Link to="/register" className="auth-link register">
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;