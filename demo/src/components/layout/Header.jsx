// FILE: demo/src/components/layout/Header.jsx

import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, LogOut, LayoutDashboard, User as UserIcon, X, Music } from 'lucide-react';
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

  // GỌI API TÌM KIẾM - FIX LỖI 500
  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('🔍 Searching for:', query);
      
      // THỬ 1: Tìm kiếm với endpoint /songs (có thể không có search param)
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
            limit: 20 // Lấy nhiều hơn để lọc ở frontend
          }
        });
        console.log('✅ API Response (all songs):', response.data);
      }
      
      // Xử lý response theo nhiều định dạng có thể
      let songs = extractSongsFromResponse(response.data);
      console.log('📊 Extracted songs:', songs.length);
      
      // Lọc bài hát có tên gần đúng với query (ở frontend)
      const filteredSongs = songs.filter(song => {
        const title = (song.title || '').toLowerCase();
        const artist = (song.artist || '').toLowerCase();
        const queryLower = query.toLowerCase();
        
        return title.includes(queryLower) || artist.includes(queryLower);
      }).slice(0, 6); // Giới hạn 6 kết quả
      
      console.log(`🎯 Filtered results: ${filteredSongs.length} songs match "${query}"`);
      
      setSearchResults(filteredSongs);
      setShowSearchResults(true);
      
    } catch (error) {
      console.error('❌ Search songs error:', error);
      
      // Fallback: mock data để test UI
      const mockSongs = [
        { id: 1, title: 'Shape of You', artist: 'Ed Sheeran' },
        { id: 2, title: 'Blinding Lights', artist: 'The Weeknd' },
        { id: 3, title: 'Dance Monkey', artist: 'Tones and I' },
        { id: 4, title: 'Someone You Loved', artist: 'Lewis Capaldi' },
        { id: 5, title: 'Bad Guy', artist: 'Billie Eilish' },
        { id: 6, title: 'Rockstar', artist: 'Post Malone' },
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

  // Helper function để extract songs từ response
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
    else if (data.items && Array.isArray(data.items)) {
      songs = data.items;
    }
    else {
      // Thử tìm bất kỳ array nào trong object
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
    // TODO: Điều hướng đến trang bài hát
    console.log('Song clicked:', song);
    // Tạm thời đi đến trang chi tiết bài hát
    // navigate(`/song/${song.id}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handlePlaySong = (song, e) => {
    e.stopPropagation();
    console.log('Play song:', song);
    // TODO: Implement play song immediately
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleToggleMenu = () => {
    if (userRole === 'ADMIN') {
      setShowDropdown(!showDropdown);
    } else {
      navigate('/profile');
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
    } catch {}
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
                // FIX DUPLICATE KEY: Sử dụng index + id hoặc index nếu id undefined
                const uniqueKey = song.id ? `song-${song.id}` : `song-${index}-${song.title}`;
                
                return (
                  <div 
                    key={uniqueKey} // ĐẢM BẢO KEY DUY NHẤT
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
        
        {/* Hiển thị khi không có kết quả */}
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
          <>
            <div className="user-menu" onClick={handleToggleMenu} ref={dropdownRef}>
              <User size={22} />
              <span>{userName}</span>
            </div>

            {userRole === 'ADMIN' && showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </div>

                <div className="dropdown-item" onClick={() => navigate('/profile')}>
                  <UserIcon size={16} />
                  <span>Profile</span>
                </div>
              </div>
            )}

            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={18} />
              Đăng xuất
            </button>
          </>
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