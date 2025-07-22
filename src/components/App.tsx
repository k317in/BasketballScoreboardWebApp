@@ .. @@
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <Login onBack={handleBackFromLogin} />;
      case 'display':
-        return <ScoreboardDisplay onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
+        return <ScoreboardDisplay onLogin={handleLogin} />;
      case 'controller':
        return <Controller onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'team-settings':
        return <TeamSettings onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'game-settings':
        return <GameSettings onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
      case 'stats':
        return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Stats Recorder</h1>
              <p className="text-gray-400 mb-2">Coming Soon!</p>
              <p className="text-sm text-gray-500 mt-2">
                This feature will include player management, real-time stats recording, and game data export.
              </p>
              <button
                onClick={() => setCurrentView('display')}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Back to Scoreboard
              </button>
            </div>
          </div>
        );
      default:
-        return <ScoreboardDisplay onBack={() => setCurrentView('display')} onLogin={handleLogin} />;
+        return <ScoreboardDisplay onLogin={handleLogin} />;
    }
  };