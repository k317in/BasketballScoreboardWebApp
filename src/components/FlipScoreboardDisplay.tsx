import React, { useEffect } from 'react';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useThursdayStore } from '../store/thursdayStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useThursdaySync } from '../hooks/useThursdaySync';
import { formatTime, formatShotClock } from '../utils/timeFormat';
import { Maximize, Play, Pause, RotateCcw, SkipForward, SkipBack, Plus, Minus } from 'lucide-react';
import RoleIndicator from './RoleIndicator';
import FlipDisplay from './FlipDisplay';

interface FlipScoreboardDisplayProps {
  onLogin: () => void;
}

const FlipScoreboardDisplay: React.FC<FlipScoreboardDisplayProps> = ({ onLogin }) => {
  const store = useScoreboardStore();
  const thursdayStore = useThursdayStore();
  const { isTable } = useAuthStore();
  const { currentRoom } = useRoomStore();
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

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.isGameRunning && store.gameTime > 0) {
      interval = setInterval(() => {
        const newTime = store.gameTime - 1;
        store.setGameTime(newTime);
        if (isTable) {
          emitUpdate(useScoreboardStore.getState());
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [store.isGameRunning, store.gameTime, emitUpdate, isTable]);

  // Shot clock timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.gameSettings.shotClockEnabled && store.isShotClockRunning && store.shotClockTime > 0) {
      interval = setInterval(() => {
        const newTime = store.shotClockTime - 1;
        store.setShotClockTime(newTime);
        if (isTable) {
          emitUpdate(useScoreboardStore.getState());
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [store.gameSettings.shotClockEnabled, store.isShotClockRunning, store.shotClockTime, emitUpdate, isTable]);

  const handleScoreChange = (teamNumber: 1 | 2, increment: number) => {
    if (!isTable) return;
    store.updateTeamScore(teamNumber, increment);
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

  const handlePreviousGame = () => {
    if (!isTable) return;
    if (!thursdayStore.canGoPrevious()) return;
    
    const currentScore = `${store.team1.score}-${store.team2.score}`;
    if (store.team1.score > 0 || store.team2.score > 0) {
      thursdayStore.updateGameResult(thursdayStore.currentGameIndex, currentScore);
    }
    
    thursdayStore.previousGame();
    store.resetGameData();
    store.resetGameClock();
    
    emitThursdayUpdate(useThursdayStore.getState());
    emitUpdate(useScoreboardStore.getState());
  };

  const handleNextGame = () => {
    if (!isTable) return;
    if (!thursdayStore.canGoNext()) return;
    
    const currentScore = `${store.team1.score}-${store.team2.score}`;
    if (store.team1.score > 0 || store.team2.score > 0) {
      thursdayStore.updateGameResult(thursdayStore.currentGameIndex, currentScore);
    }
    
    thursdayStore.nextGame();
    store.resetGameData();
    store.resetGameClock();
    
    emitThursdayUpdate(useThursdayStore.getState());
    emitUpdate(useScoreboardStore.getState());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    store.toggleFullscreen();
  };

  // Format time for flip display (MM:SS)
  const formatTimeForFlip = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' 
    }}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 bg-gray-900/80 backdrop-blur-sm gap-2 border-b border-gray-700">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto"></div>
        
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
          <RoleIndicator onLogin={onLogin} />
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-sm sm:text-base text-black font-bold"
          >
            <Maximize size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">FULL</span>
          </button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="bg-red-600 text-center py-2 border-b-2 border-red-400">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-bold uppercase tracking-wider">
            LIVE - {getDisplayTeamName(1)} vs {getDisplayTeamName(2)}
            {thursdayStore.isEnabled && (
              <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">
                TUESDAY MODE
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Tuesday Mode Controls */}
      {thursdayStore.isEnabled && isTable && (
        <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-600 py-3 px-2">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-center justify-center">
              {/* Score Controls */}
              <button
                onClick={() => handleScoreChange(1, 1)}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">HOME</span>
                <span className="sm:hidden">H+</span>
              </button>
              
              <button
                onClick={() => handleScoreChange(1, -1)}
                disabled={store.team1.score <= 0}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <Minus size={14} />
                <span className="hidden sm:inline">HOME</span>
                <span className="sm:hidden">H-</span>
              </button>

              {/* Game Controls */}
              <button
                onClick={handleGameClockToggle}
                className={`flex items-center justify-center gap-1 px-2 py-3 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase ${
                  store.isGameRunning 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {store.isGameRunning ? <Pause size={14} /> : <Play size={14} />}
                <span className="hidden sm:inline">{store.isGameRunning ? 'PAUSE' : 'START'}</span>
                <span className="sm:hidden">{store.isGameRunning ? 'P' : 'S'}</span>
              </button>
              
              <button
                onClick={handleGameClockReset}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">RESET</span>
                <span className="sm:hidden">R</span>
              </button>
              
              <button
                onClick={handlePreviousGame}
                disabled={!thursdayStore.canGoPrevious()}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <SkipBack size={14} />
                <span className="hidden sm:inline">BACK</span>
                <span className="sm:hidden">B</span>
              </button>
              
              <button
                onClick={handleNextGame}
                disabled={!thursdayStore.canGoNext()}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <SkipForward size={14} />
                <span className="hidden sm:inline">NEXT</span>
                <span className="sm:hidden">N</span>
              </button>

              {/* Away Team Controls */}
              <button
                onClick={() => handleScoreChange(2, 1)}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">AWAY</span>
                <span className="sm:hidden">A+</span>
              </button>
              
              <button
                onClick={() => handleScoreChange(2, -1)}
                disabled={store.team2.score <= 0}
                className="flex items-center justify-center gap-1 px-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 rounded-lg font-bold transition-colors text-xs min-h-[44px] uppercase"
              >
                <Minus size={14} />
                <span className="hidden sm:inline">AWAY</span>
                <span className="sm:hidden">A-</span>
              </button>
            </div>
            
            <div className="mt-2 text-center text-xs sm:text-sm text-yellow-300 font-mono">
              GAME {thursdayStore.currentGameIndex + 1} OF {thursdayStore.getTotalGames()} • 
              SCORE: {store.team1.score}-{store.team2.score} • 
              TIME: {formatTime(store.gameTime)}
            </div>
          </div>
        </div>
      )}

      {/* Main Flip Scoreboard */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {store.isFullMode ? (
            // Full Mode Layout
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">
              {/* Left Column - Team 1 */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-300 uppercase tracking-wider mb-4">
                    {getDisplayTeamName(1)}
                  </div>
                  <FlipDisplay 
                    value={store.team1.score} 
                    size="xlarge"
                    className="mb-6"
                  />
                </div>
                
                {/* Team 1 Stats */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <FlipDisplay 
                    value={store.team1.fouls} 
                    size="small"
                    label="FOULS"
                    labelSize="small"
                  />
                  <FlipDisplay 
                    value={store.team1.timeouts || 0} 
                    size="small"
                    label="TIMEOUTS"
                    labelSize="small"
                  />
                </div>
              </div>

              {/* Center Column - Game Info */}
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Main Clock */}
                <div className="text-center">
                  <FlipDisplay 
                    value={formatTimeForFlip(store.gameTime)} 
                    size="large"
                    label="GAME TIME"
                    labelSize="large"
                    className={store.gameTime <= 60 ? 'animate-pulse' : ''}
                  />
                </div>

                {/* Period */}
                <FlipDisplay 
                  value={store.period} 
                  size="medium"
                  label="PERIOD"
                  labelSize="medium"
                />

                {/* Shot Clock */}
                {store.gameSettings.shotClockEnabled && (
                  <FlipDisplay 
                    value={store.shotClockTime} 
                    size="medium"
                    label="SHOT CLOCK"
                    labelSize="medium"
                    className={store.shotClockTime <= 5 ? 'animate-pulse' : ''}
                  />
                )}

                {/* VS Indicator */}
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-300 tracking-widest">
                  VS
                </div>
              </div>

              {/* Right Column - Team 2 */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-300 uppercase tracking-wider mb-4">
                    {getDisplayTeamName(2)}
                  </div>
                  <FlipDisplay 
                    value={store.team2.score} 
                    size="xlarge"
                    className="mb-6"
                  />
                </div>
                
                {/* Team 2 Stats */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <FlipDisplay 
                    value={store.team2.timeouts || 0} 
                    size="small"
                    label="TIMEOUTS"
                    labelSize="small"
                  />
                  <FlipDisplay 
                    value={store.team2.fouls} 
                    size="small"
                    label="FOULS"
                    labelSize="small"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Simple Mode Layout
            <div className="flex flex-col items-center justify-center h-full space-y-12">
              {/* Team Names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl items-center">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 uppercase tracking-wider">
                    {getDisplayTeamName(1)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-300 tracking-widest">
                    VS
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 uppercase tracking-wider">
                    {getDisplayTeamName(2)}
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl items-center">
                <div className="flex justify-center">
                  <FlipDisplay value={store.team1.score} size="xlarge" />
                </div>
                
                <div className="flex justify-center">
                  <FlipDisplay 
                    value={formatTimeForFlip(store.gameTime)} 
                    size="large"
                    label="TIME"
                    labelSize="large"
                    className={store.gameTime <= 60 ? 'animate-pulse' : ''}
                  />
                </div>
                
                <div className="flex justify-center">
                  <FlipDisplay value={store.team2.score} size="xlarge" />
                </div>
              </div>
            </div>
          )}

          {/* Player Names Section - Only in Thursday Mode */}
          {thursdayStore.isEnabled && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team 1 Players */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-yellow-300 uppercase tracking-wider mb-3">
                    {getDisplayTeamName(1)} - HOME
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 space-y-1 font-mono">
                    {thursdayStore.getCurrentHomeTeam()?.players.map((player, index) => (
                      <div key={index} className="truncate">
                        {player.name.toUpperCase()} ({player.position.toUpperCase()})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-yellow-300 uppercase tracking-wider mb-3">
                    {getDisplayTeamName(2)} - AWAY
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 space-y-1 font-mono">
                    {thursdayStore.getCurrentAwayTeam()?.players.map((player, index) => (
                      <div key={index} className="truncate">
                        {player.name.toUpperCase()} ({player.position.toUpperCase()})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipScoreboardDisplay;