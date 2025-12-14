import { Outlet } from 'react-router-dom';
import { PlayerProvider } from '../../context/PlayerContext';
import Header from './Header';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';

function MainLayout() {
  return (
    <PlayerProvider>
      <div className="main-layout">
        <Header />
        <div className="main-content">
          <Sidebar />
          <main className="content-area">
            <Outlet />
          </main>
        </div>
        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}

export default MainLayout;
