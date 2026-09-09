import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import RoomLobby from './pages/RoomLobby';
import GameBoard from './pages/GameBoard';

function App() {
  return (
    <Router>
      <SocketProvider>
        <GameProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lobby/:code" element={<RoomLobby />} />
              <Route path="/game/:code" element={<GameBoard />} />
            </Routes>
          </div>
        </GameProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
