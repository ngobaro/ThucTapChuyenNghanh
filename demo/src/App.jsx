import { BrowserRouter } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <AppRoutes />
      </PlayerProvider>
    </BrowserRouter>
  );
}

export default App;