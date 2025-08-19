import React, { useState } from 'react';
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
import { useScoreboardStore } from './store/scoreboardStore';

type ViewType = 'display' | 'team-settings' | 'game-settings' | 'stats' | 'controller' | 'login' | 'thursday';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('display');
  const { isFullscreen } = useScoreboardStore();

  const handleLogin = () => {
    setCurrentView('login');
  };

  const handleBackFromLogin = () => {
    setCurrentView('display');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <Login onBack={handleBackFromLogin} />;
      case 'display':
        return <ScoreboardDisplay onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'controller':
        return <Controller onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'team-settings':
        return <TeamSettings onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'game-settings':
        return <GameSettings onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'thursday':
        return <ThursdayMode onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'stats':
        return <StatPage onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      default:
        return <ScoreboardDisplay onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20" style={{ fontFamily: 'Orbitron, monospace' }}>
      {renderCurrentView()}
      {currentView !== 'login' && !isFullscreen && (
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      )}
    </div>
  );
}

export default App;