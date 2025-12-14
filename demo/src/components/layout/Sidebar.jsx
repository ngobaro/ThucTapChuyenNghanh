import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Heart, Plus } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  const menuItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Search, label: 'Tìm kiếm', path: '/search' },
    { icon: Library, label: 'Thư viện', path: '/library' },
    { icon: Heart, label: 'Yêu thích', path: '/favorites' },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={({ isActive }) => 
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="sidebar-playlists">
        <button className="create-playlist-btn">
          <Plus size={20} />
          <span>Tạo Playlist</span>
        </button>
        
        <div className="playlist-list">
          <div className="playlist-item">My Playlist #1</div>
          <div className="playlist-item">Chill Vibes</div>
          <div className="playlist-item">Workout Mix</div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;