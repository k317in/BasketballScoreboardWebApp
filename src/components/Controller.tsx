import React, { useEffect } from 'react';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useThursdayStore } from '../store/thursdayStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useThursdaySync } from '../hooks/useThursdaySync';
import { formatTime, formatShotClock } from '../utils/timeFormat';
import { Play, Pause, RotateCcw, Plus, Minus, ArrowLeft, Lock } from 'lucide-react';
import RoleIndicator from './RoleIndicator';

interface ControllerProps {
  onBack: () => void;
  onLogin: () => void;
}

const Controller: React.FC<ControllerProps> = ({ onBack, onLogin }) => {
  const store = useScoreboardStore();
  const thursdayStore = useThursdayStore();
  const { isTable } = useAuthStore();
  const { currentRoom, setRoom } = useRoomStore();
  const { emitUpdate } = useFirebaseSync(currentRoom);
  const { emitUpdate: emitThursdayUpdate } = useThursdaySync(currentRoom);

  // Get team names from Thursday Mode if enabled
  const getDisplayTeamName = (teamNumber: 1 | 2) => {
    if (thursdayStore.isEnabled) {
      const currentGame = thursdayStore.getCurrentGame();
      if (currentGame) {
        return teamNumber === 1 ? currentGame.homeTeam : currentGame.awayTeam;
      }
    }
    return teamNumber === 1 ? store.team1.name : store.team2.name;
  };

  // Game clock timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.isGameRunning && store.gameTime > 0) {
      interval = setInterval(() => {
        const newTime = store.gameTime - 1;
        store.setGameTime(newTime);
        
        // Check if game has ended (time reached 0)
        if (newTime === 0) {
          store.recordGameResult();
          store.toggleGameClock(); // Stop the game clock
        }
        
        emitUpdate(useScoreboardStore.getState());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [store.isGameRunning, store.gameTime, emitUpdate]);

  // Shot clock timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.gameSettings.shotClockEnabled && store.isShotClockRunning && store.shotClockTime > 0) {
      interval = setInterval(() => {
        store.setShotClockTime(store.shotClockTime - 1);
        emitUpdate(useScoreboardStore.getState());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [store.gameSettings.shotClockEnabled, store.isShotClockRunning, store.shotClockTime, emitUpdate]);

  const handleScoreChange = (teamNumber: 1 | 2, increment: number) => {
    if (!isTable) return;
    store.updateTeamScore(teamNumber, increment);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleFoulChange = (teamNumber: 1 | 2, increment: number) => {
    if (!isTable) return;
    store.updateTeamFouls(teamNumber, increment);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleTimeoutChange = (teamNumber: 1 | 2, increment: number) => {
    if (!isTable) return;
    store.updateTeamTimeouts(teamNumber, increment);
    emitUpdate(useScoreboardStore.getState());
  };

  const handlePeriodChange = (increment: number) => {
    if (!isTable) return;
    const newPeriod = Math.max(1, Math.min(store.gameSettings.periodCount, store.period + increment));
    store.setPeriod(newPeriod);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleGameClockToggle = () => {
    if (!isTable) return;
    store.toggleGameClock();
    emitUpdate(useScoreboardStore.getState());
  };

  const handleGameClockReset = () => {
    if (!isTable) return;
    store.resetGameClock();
    emitUpdate(useScoreboardStore.getState());
  };

  const handleShotClockToggle = () => {
    if (!isTable) return;
    store.toggleShotClock();
    emitUpdate(useScoreboardStore.getState());
  };

  const handleShotClockReset = () => {
    if (!isTable) return;
    store.resetShotClock();
    if (!store.isShotClockRunning) {
      store.toggleShotClock(); // Start the clock if it's not running
    }
    emitUpdate(useScoreboardStore.getState());
  };

  const handleShotClockReset14 = () => {
    if (!isTable) return;
    store.setShotClockTime(14);
    if (!store.isShotClockRunning) {
      store.toggleShotClock(); // Start the clock if it's not running
    }
    emitUpdate(useScoreboardStore.getState());
  };

  const handleResetGame = () => {
    if (!isTable) return;
    store.resetGameData();
    emitUpdate(useScoreboardStore.getState());
  };

  // Only show access restriction if not in Tuesday Mode
  if (!isTable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gray-900 rounded-lg p-6 sm:p-8 max-w-md">
            <Lock size={48} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">
              You need Table access to use the controller. Please login with Table credentials.
            </p>
            <div className="space-y-4">
              <button
                onClick={onLogin}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Login as Table
              </button>
              <button
                onClick={onBack}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back to Scoreboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-4 gap-2 sm:gap-4 pb-2 sm:pb-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Controller</h1>
          </div>
          <RoleIndicator onLogin={onLogin} />
        </div>

        {/* Current Status Display */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6 mb-2 sm:mb-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4">Current Status</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-4 text-center">
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-xs sm:text-sm text-gray-400">Game Time</div>
              <div className={`text-sm sm:text-lg lg:text-2xl font-bold ${store.gameTime <= 60 ? 'text-red-500' : ''}`}>
                {formatTime(store.gameTime)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-xs sm:text-sm text-gray-400">Shot Clock</div>
              {store.gameSettings.shotClockEnabled ? (
                <div className={`text-sm sm:text-lg lg:text-2xl font-bold ${store.shotClockTime <= 5 ? 'text-red-500' : ''}`}>
                  {formatShotClock(store.shotClockTime)}
                </div>
              ) : (
                <div className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-500">--</div>
              )}
            </div>
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-xs sm:text-sm text-gray-400">Period</div>
              <div className="text-sm sm:text-lg lg:text-2xl font-bold">{store.period}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-xs sm:text-sm text-gray-400">Score</div>
              <div className="text-sm sm:text-lg lg:text-2xl font-bold">
                {store.team1.score} - {store.team2.score}
                {thursdayStore.isEnabled && (
                  <div className="text-xs text-purple-400 mt-1">Tuesday Mode</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Clock Controls */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6 mb-2 sm:mb-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4">Game Clock</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={handleGameClockToggle}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px] ${
                store.isGameRunning 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {store.isGameRunning ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
              {store.isGameRunning ? 'Pause' : 'Start'} Game
            </button>
            <button
              onClick={handleGameClockReset}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
            >
              <RotateCcw size={16} className="sm:w-5 sm:h-5" />
              Reset Clock
            </button>
          </div>
        </div>

        {/* Shot Clock Controls */}
        {store.isFullMode && store.gameSettings.shotClockEnabled && (
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6 mb-2 sm:mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4">Shot Clock</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <button
                onClick={handleShotClockToggle}
                className={`flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px] ${
                  store.isShotClockRunning 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {store.isShotClockRunning ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
                {store.isShotClockRunning ? 'Pause' : 'Start'} Shot Clock
              </button>
              <button
                onClick={handleShotClockReset}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
              >
                <RotateCcw size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Reset to {store.gameSettings.shotClockDuration}s</span>
                <span className="sm:hidden">{store.gameSettings.shotClockDuration}s</span>
              </button>
              <button
                onClick={handleShotClockReset14}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
              >
                <RotateCcw size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Reset to 14s</span>
                <span className="sm:hidden">14s</span>
              </button>
            </div>
          </div>
        )}

        {/* Period Controls */}
        {store.isFullMode && store.gameSettings.periodCount > 1 && (
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6 mb-2 sm:mb-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4">Period Control</h2>
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
            <button
              onClick={() => handlePeriodChange(-1)}
              disabled={store.period <= 1}
              className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
            >
              <Minus size={16} className="sm:w-5 sm:h-5" />
              Previous
            </button>
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 rounded-lg min-h-[44px] sm:min-h-[52px] flex items-center">
              <span className="text-sm sm:text-base lg:text-lg font-bold">Period {store.period}</span>
            </div>
            <button
              onClick={() => handlePeriodChange(1)}
              disabled={store.period >= store.gameSettings.periodCount}
              className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
            >
              <Plus size={16} className="sm:w-5 sm:h-5" />
              Next
            </button>
          </div>
        </div>
        )}

        {/* Team Controls */}
        <div className="grid lg:grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
          {/* Team 1 Controls */}
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4" style={{ color: store.team1.color }}>
              {getDisplayTeamName(1)}
              {thursdayStore.isEnabled && (
                <span className="text-xs text-blue-400 ml-2">(Home)</span>
              )}
            </h2>
            
            {/* Score Controls */}
            <div className="mb-3 sm:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3">Score: {store.team1.score}</h3>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <button
                  onClick={() => handleScoreChange(1, 1)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  +1
                </button>
                <button
                  onClick={() => handleScoreChange(1, 2)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  +2
                </button>
                <button
                  onClick={() => handleScoreChange(1, 3)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  +3
                </button>
                <button
                  onClick={() => handleScoreChange(1, -1)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  -1
                </button>
              </div>
            </div>

            {/* Foul Controls */}
            {store.isFullMode && store.gameSettings.foulCountEnabled && (
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3">Fouls: {store.team1.fouls}</h3>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleFoulChange(1, 1)}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add Foul</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button
                    onClick={() => handleFoulChange(1, -1)}
                    disabled={store.team1.fouls <= 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Minus size={14} className="sm:w-4 sm:h-4" />
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Timeout Controls - Only in Full Mode */}
            {store.isFullMode && (
              <div className="mt-3 sm:mt-6">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3">Timeouts: {store.team1.timeouts || 0}</h3>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleTimeoutChange(1, -1)}
                    disabled={(store.team1.timeouts || 0) <= 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Minus size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Use Timeout</span>
                    <span className="sm:hidden">Use</span>
                  </button>
                  <button
                    onClick={() => handleTimeoutChange(1, 1)}
                    disabled={(store.team1.timeouts || 0) >= (store.gameSettings.timeoutsPerTeam || 0)}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                    Add Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Team 2 Controls */}
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4" style={{ color: store.team2.color }}>
              {getDisplayTeamName(2)}
              {thursdayStore.isEnabled && (
                <span className="text-xs text-red-400 ml-2">(Away)</span>
              )}
            </h2>
            
            {/* Score Controls */}
            <div className="mb-3 sm:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3">Score: {store.team2.score}</h3>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <button
                  onClick={() => handleScoreChange(2, 1)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  +1
                </button>
                <button
                  onClick={() => handleScoreChange(2, 2)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  +2
                </button>
                <button
                  onClick={() => handleScoreChange(2, 3)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  +3
                </button>
                <button
                  onClick={() => handleScoreChange(2, -1)}
                  className="px-3 sm:px-4 py-3 sm:py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
                >
                  -1
                </button>
              </div>
            </div>

            {/* Foul Controls */}
            {store.isFullMode && store.gameSettings.foulCountEnabled && (
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3">Fouls: {store.team2.fouls}</h3>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleFoulChange(2, 1)}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add Foul</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button
                    onClick={() => handleFoulChange(2, -1)}
                    disabled={store.team2.fouls <= 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Minus size={14} className="sm:w-4 sm:h-4" />
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Timeout Controls - Only in Full Mode */}
            {store.isFullMode && (
              <div className="mt-3 sm:mt-6">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3">Timeouts: {store.team2.timeouts || 0}</h3>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleTimeoutChange(2, -1)}
                    disabled={(store.team2.timeouts || 0) <= 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Minus size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Use Timeout</span>
                    <span className="sm:hidden">Use</span>
                  </button>
                  <button
                    onClick={() => handleTimeoutChange(2, 1)}
                    disabled={(store.team2.timeouts || 0) >= (store.gameSettings.timeoutsPerTeam || 0)}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold transition-colors text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-[52px]"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                    Add Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Game */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6 mt-2 sm:mt-4 lg:mt-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4">Reset Game</h2>
          <button
            onClick={() => {
              store.resetGameData();
              emitUpdate(useScoreboardStore.getState());
            }}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-[52px]"
          >
            <RotateCcw size={16} className="sm:w-5 sm:h-5" />
            Reset Game Data
          </button>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
            This will reset scores, fouls, timeouts, and timers. Team names will be preserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Controller;