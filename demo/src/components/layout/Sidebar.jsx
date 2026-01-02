// FILE: demo/src/components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { Home, Library, Heart, Music, Disc, TrendingUp, Clock, ListMusic, User, Grid } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  // Menu chính đơn giản hóa
  const mainMenu = [
 
    { icon: Music, label: 'Khám phá', path: '/' },
    { icon: Library, label: 'Thư viện', path: '/library' },
    { icon: TrendingUp, label: 'Bảng xếp hạng', path: '/rank' }
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



      </nav>
    </aside>
  );
}

export default Sidebar;