// FILE: demo/src/components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { Home, Library, Heart, Music, Disc, TrendingUp, Clock, ListMusic, User, Grid } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  // Menu chính đơn giản hóa
  const mainMenu = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Library, label: 'Thư viện', path: '/library' },
    { icon: Music, label: 'Khám phá', path: '/discover' },
    { icon: TrendingUp, label: 'Bảng xếp hạng', path: '/charts' },
  ];

  // Menu cá nhân
  const personalMenu = [
    { icon: Clock, label: 'Nghe gần đây', path: '/recent' },
    { icon: Heart, label: 'Bài hát yêu thích', path: '/favorites' },
  ];

  // Playlist & Album
  const collectionMenu = [
    { icon: ListMusic, label: 'Playlist', path: '/playlists' },
    { icon: Disc, label: 'Album', path: '/albums' },
    { icon: Grid, label: 'Thể loại', path: '/genres' },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* Menu chính */}
        <div className="nav-section">
          <h3 className="section-title">Menu</h3>
          {mainMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Menu cá nhân */}
        <div className="nav-section">
          <h3 className="section-title">Cá nhân</h3>
          {personalMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Playlist & Album */}
        <div className="nav-section">
          <h3 className="section-title">Bộ sưu tập</h3>
          {collectionMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Nút đi đến trang Thể loại (Genres) */}
        <div className="nav-section">
          <NavLink
            to="/genres"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <Grid size={22} />
            <span>Thể loại</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;