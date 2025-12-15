// FILE: demo/src/components/layout/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, LogOut, LayoutDashboard, User as UserIcon, X, Music, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { logout } from '../../services/authService';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('USER');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Kiểm tra login status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setIsLoggedIn(true);
        const user = JSON.parse(userData);
        setUserName(user.username);
        setUserRole(user.role?.toUpperCase() || 'USER');
      } catch {
        handleLogout();
      }
    }
  }, []);

  // Click outside handlers
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Tìm kiếm real-time với debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      console.log('🔍 Searching for:', query);

      let response;
      try {
        // Thử với search param trước
        response = await api.get('/songs', {
          params: {
            search: query,
            limit: 8
          }
        });
        console.log('✅ API Response (with search param):', response.data);
      } catch (searchParamError) {
        console.log('⚠️ Search param failed, trying without search param...');
        // Thử không có search param, lọc ở frontend
        response = await api.get('/songs', {
          params: {
            limit: 20
          }
        });
        console.log('✅ API Response (all songs):', response.data);
      }

      let songs = extractSongsFromResponse(response.data);
      console.log('📊 Extracted songs:', songs.length);

      const filteredSongs = songs.filter(song => {
        const title = (song.title || '').toLowerCase();
        const artist = (song.artist || '').toLowerCase();
        const queryLower = query.toLowerCase();

        return title.includes(queryLower) || artist.includes(queryLower);
      }).slice(0, 6);

      console.log(`🎯 Filtered results: ${filteredSongs.length} songs match "${query}"`);

      setSearchResults(filteredSongs);
      setShowSearchResults(true);

    } catch (error) {
      console.error('❌ Search songs error:', error);

      const mockSongs = [
        { id: 1, title: 'Shape of You', artist: 'Ed Sheeran' },
        { id: 2, title: 'Blinding Lights', artist: 'The Weeknd' },
        { id: 3, title: 'Dance Monkey', artist: 'Tones and I' },
      ].filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(mockSongs);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const extractSongsFromResponse = (data) => {
    let songs = [];

    if (Array.isArray(data)) {
      songs = data;
    }
    else if (data.result && Array.isArray(data.result)) {
      songs = data.result;
    }
    else if (data.data && Array.isArray(data.data)) {
      songs = data.data;
    }
    else if (data.songs && Array.isArray(data.songs)) {
      songs = data.songs;
    }
    else {
      for (const key in data) {
        if (Array.isArray(data[key])) {
          songs = data[key];
          break;
        }
      }
    }

    return songs;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleSearchItemClick = (song) => {
    console.log('Song clicked:', song);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handlePlaySong = (song, e) => {
    e.stopPropagation();
    console.log('Play song:', song);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // SỬA: Luôn hiển thị dropdown khi click user menu
  const handleToggleMenu = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMenuClick = (option) => {
    setShowDropdown(false);
    switch (option) {
      case 'profile':
        navigate('/profile');
        break;
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch { }
    localStorage.clear();
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          <h1>🎵 spoti-five</h1>
        </Link>
      </div>

      <div className="header-center" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
            >
              <X size={16} />
            </button>
          )}
          {isSearching && <div className="search-spinner"></div>}
        </form>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results-dropdown">
            <div className="search-results-header">
              <h4>Bài hát gần đúng</h4>
              <span className="result-count">{searchResults.length} kết quả</span>
            </div>

            <div className="search-results-list">
              {searchResults.map((song, index) => {
                const uniqueKey = song.id ? `song-${song.id}` : `song-${index}-${song.title}`;

                return (
                  <div
                    key={uniqueKey}
                    className="search-result-item"
                    onClick={() => handleSearchItemClick(song)}
                  >
                    <div className="result-icon">
                      <Music size={16} />
                    </div>
                    <div className="result-details">
                      <div className="result-title">
                        {song.title || 'Không có tiêu đề'}
                      </div>
                      <div className="result-subtitle">
                        {song.artist || 'Nghệ sĩ không xác định'}
                      </div>
                    </div>
                    <button
                      className="play-song-btn"
                      onClick={(e) => handlePlaySong(song, e)}
                      title="Phát ngay"
                    >
                      <div className="play-icon">▶</div>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="search-results-footer">
              <button
                className="view-all-btn"
                onClick={() => {
                  navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
                  setShowSearchResults(false);
                }}
              >
                Xem tất cả kết quả
              </button>
            </div>
          </div>
        )}

        {showSearchResults && searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="search-results-dropdown">
            <div className="no-results">
              <Music size={24} />
              <p>Không tìm thấy bài hát "{searchQuery}"</p>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <div className="user-menu-container" ref={dropdownRef}>
            <div
              className="user-menu"
              onClick={handleToggleMenu}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
              <span className="user-name">{userName}</span>
              {userRole === 'ADMIN' && (
                <span className="admin-badge">ADMIN</span>
              )}
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => handleMenuClick('profile')}
                >
                  <UserIcon size={16} />
                  <span>Profile</span>
                </div>

                {userRole === 'ADMIN' && (
                  <>
                    <div
                      className="dropdown-item admin-item"
                      onClick={() => handleMenuClick('dashboard')}
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard (Admin)</span>
                    </div>
                    <div className="dropdown-divider"></div>
                  </>
                )}

                <div
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-auth">
              <LogIn size={18} />
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-auth-primary">
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;