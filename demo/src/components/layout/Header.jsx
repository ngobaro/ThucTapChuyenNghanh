import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoggedIn(true);

    // Fetch user info sau login
    api.get('/users/myInfo')
      .then(res => {
        const user = res.data.result || res.data;
        setUserName(user.username);
        setUserRole(user.role?.toUpperCase() || 'USER');
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch(() => {
        setIsLoggedIn(false); // Logout nếu fetch fail (token invalid)
        localStorage.clear();
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const handleToggleMenu = () => {
    if (userRole === 'ADMIN') {
      setShowDropdown(prev => !prev);
    } else {
      navigate('/profile');
    }
  };

  const goTo = (path) => {
    console.log('Navigating to:', path); // Debug
    setShowDropdown(false);
    navigate(path);
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

      <div className="header-center">
        <form onSubmit={handleSearch} className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ, album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <>
            <div className="user-menu" onClick={handleToggleMenu}>
              <User size={22} />
              <span>{userName}</span>
            </div>

            {userRole === 'ADMIN' && showDropdown && (
              <div className="dropdown-menu" ref={dropdownRef}>
                <div className="dropdown-item" onClick={(e) => {
                  e.stopPropagation();
                  goTo('/dashboard');
                }}>
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </div>

                <div className="dropdown-item" onClick={(e) => {
                  e.stopPropagation();
                  goTo('/profile');
                }}>
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