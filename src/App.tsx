import React, { useState } from 'react';
import { useEffect } from 'react';
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import ScoreboardDisplay from './components/ScoreboardDisplay';
import Controller from './components/Controller';
import TeamSettings from './components/TeamSettings';
import GameSettings from './components/GameSettings';
import Login from './components/Login';
import Navigation from './components/Navigation';
import ThursdayMode from './components/ThursdayMode';
import StatPage from './components/StatPage';
import GameLobby from './components/GameLobby';
import { useScoreboardStore } from './store/scoreboardStore';
import { useAuthStore } from './store/authStore';
import { useGameStore } from './store/gameStore';

type ViewType = 'display' | 'team-settings' | 'game-settings' | 'stats' | 'controller' | 'login' | 'thursday' | 'game-lobby' | 'admin-login' | 'admin-panel';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { isFullscreen } = useScoreboardStore();
  const { isAuthenticated, initializeAuth, loading: authLoading } = useAuthStore();
  const { currentGameId } = useGameStore();

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
  }, [initializeAuth]);

  // Redirect based on auth state
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated && currentView !== 'login') {
        setCurrentView('login');
      } else if (isAuthenticated && currentView === 'login') {
        setCurrentView('game-lobby');
      }
    }
  }, [isAuthenticated, authLoading, currentView]);

  const handleLogin = () => {
    setCurrentView('login');
  };

  const handleBackFromLogin = () => {
    if (isAuthenticated) {
      setCurrentView('game-lobby');
    }
  };

  const handleJoinGame = (gameId: string) => {
    setCurrentView('display');
  };

  const handleAdminLogin = () => {
    setIsAdminMode(true);
    setCurrentView('admin-panel');
  };

  const handleBackToUserLogin = () => {
    setIsAdminMode(false);
    setCurrentView('login');
  };
  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    // Require authentication for all views except login
    if (!isAuthenticated && currentView !== 'login' && currentView !== 'admin-login' && currentView !== 'admin-panel') {
      return <Login onBack={handleBackFromLogin} />;
    }

    switch (currentView) {
      case 'login':
        return <Login onBack={handleBackFromLogin} setCurrentView={setCurrentView} />;
      case 'admin-login':
        return <AdminLogin onAdminLogin={handleAdminLogin} onBack={handleBackToUserLogin} />;
      case 'admin-panel':
        return <AdminPanel onBack={handleBackToUserLogin} />;
      case 'game-lobby':
        return <GameLobby onJoinGame={handleJoinGame} />;
      case 'display':
        if (!currentGameId) {
          setCurrentView('game-lobby');
          return <GameLobby onJoinGame={handleJoinGame} />;
        }
        return <ScoreboardDisplay onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'controller':
        if (!currentGameId) {
          setCurrentView('game-lobby');
          return <GameLobby onJoinGame={handleJoinGame} />;
        }
        return <Controller onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'team-settings':
        if (!currentGameId) {
          setCurrentView('game-lobby');
          return <GameLobby onJoinGame={handleJoinGame} />;
        }
        return <TeamSettings onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'game-settings':
        if (!currentGameId) {
          setCurrentView('game-lobby');
          return <GameLobby onJoinGame={handleJoinGame} />;
        }
        return <GameSettings onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'thursday':
        if (!currentGameId) {
          setCurrentView('game-lobby');
          return <GameLobby onJoinGame={handleJoinGame} />;
        }
        return <ThursdayMode onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'stats':
        if (!currentGameId) {
          setCurrentView('game-lobby');
          return <GameLobby onJoinGame={handleJoinGame} />;
        }
        return <StatPage onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      default:
        return <GameLobby onJoinGame={handleJoinGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20" style={{ fontFamily: 'Orbitron, monospace' }}>
      {renderCurrentView()}
      {isAuthenticated && currentView !== 'login' && currentView !== 'admin-login' && currentView !== 'admin-panel' && currentView !== 'game-lobby' && !isFullscreen && (
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      )}
    </div>
  );
}

export default App;