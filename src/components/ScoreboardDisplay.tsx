import React, { useEffect } from 'react';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useThursdayStore } from '../store/thursdayStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useThursdaySync } from '../hooks/useThursdaySync';
import { formatTime, formatShotClock } from '../utils/timeFormat';
import { Maximize } from 'lucide-react';
import RoleIndicator from './RoleIndicator';

interface ScoreboardDisplayProps {
  onLogin: () => void;
}

const ScoreboardDisplay: React.FC<ScoreboardDisplayProps> = ({ onLogin }) => {
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

  const getDisplayTeamLogo = (teamNumber: 1 | 2) => {
    if (thursdayStore.isEnabled) {
      const teamName = getDisplayTeamName(teamNumber);
      const teamRoster = thursdayStore.getTeamByName(teamName);
      // For now, Thursday Mode doesn't support logos from Google Sheets
      return undefined;
    }
    return teamNumber === 1 ? store.team1.logo : store.team2.logo;
  };

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.isGameRunning && store.gameTime > 0) {
      interval = setInterval(() => {
        const newTime = store.gameTime - 1;
        store.setGameTime(newTime);
        // Only emit update if user is table (to avoid conflicts)
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
        // Only emit update if user is table (to avoid conflicts)
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

  const handleFoulChange = (teamNumber: 1 | 2, increment: number) => {
    if (!isTable) return;
    store.updateTeamFouls(teamNumber, increment);
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

  const getTeamBannerWidth = () => {
    if (!store.showProportionalBanners) return '50%';
    
    const total = store.team1.score + store.team2.score;
    if (total === 0) return '50%';
    
    const team1Percentage = (store.team1.score / total) * 100;
    const team2Percentage = (store.team2.score / total) * 100;
    
    return { team1: `${team1Percentage}%`, team2: `${team2Percentage}%` };
  };

  const bannerWidths = getTeamBannerWidth();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 bg-gray-900 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto"></div>
        
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
          <RoleIndicator onLogin={onLogin} />
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Maximize size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Full</span>
          </button>
        </div>
      </div>

      {/* Live Indicator for all users */}
      <div className="bg-red-600 text-center py-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold">
            LIVE - {getDisplayTeamName(1)} vs {getDisplayTeamName(2)}
            {thursdayStore.isEnabled && (
              <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">
                TUESDAY MODE
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Team Banners */}
      {store.showProportionalBanners && (
        <div className="flex h-3 sm:h-4">
          <div 
            className="transition-all duration-500"
            style={{ 
              width: typeof bannerWidths === 'object' ? bannerWidths.team1 : '50%',
              backgroundColor: store.team1.color 
            }}
          />
          <div 
            className="transition-all duration-500"
            style={{ 
              width: typeof bannerWidths === 'object' ? bannerWidths.team2 : '50%',
              backgroundColor: store.team2.color 
            }}
          />
        </div>
      )}

      {/* Main Scoreboard */}
      <div className="flex-1 p-2 sm:p-4 lg:p-8">
        {store.isFullMode ? (
          <>
          <div className="h-full grid grid-cols-5 grid-rows-4 gap-2 sm:gap-4 max-w-6xl mx-auto">
            {/* Team 1 Name */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              <div className="text-center">
                {getDisplayTeamLogo(1) && (
                  <img 
                    src={getDisplayTeamLogo(1)} 
                    alt={`${getDisplayTeamName(1)} logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2 rounded object-cover"
                  />
                )}
                <h2 className="text-sm sm:text-xl md:text-2xl lg:text-4xl font-bold">{getDisplayTeamName(1)}</h2>
              </div>
            </div>
            
            {/* Separator */}
            <div className="flex items-center justify-center col-span-1">
              <div className="w-8 h-8 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs sm:text-sm">VS</span>
              </div>
            </div>
            
            {/* Team 2 Name */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              <div className="text-center">
                {getDisplayTeamLogo(2) && (
                  <img 
                    src={getDisplayTeamLogo(2)} 
                    alt={`${getDisplayTeamName(2)} logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2 rounded object-cover"
                  />
                )}
                <h2 className="text-sm sm:text-xl md:text-2xl lg:text-4xl font-bold">{getDisplayTeamName(2)}</h2>
              </div>
            </div>
            
            {/* Team 1 Color Bar */}
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              <div 
                className="w-full h-full flex items-center justify-center rounded-lg"
                style={{ backgroundColor: store.team1.color }}
              >
                <span className="text-white font-bold text-xs sm:text-lg lg:text-xl drop-shadow-lg">
                  {getDisplayTeamName(1)}
                </span>
              </div>
            </div>
            
            {/* Period */}
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-1">
              <span className="text-xs sm:text-lg md:text-xl lg:text-2xl font-bold">PERIOD</span>
              <span className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold">{store.period}</span>
            </div>
            
            {/* Team 2 Color Bar */}
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              <div 
                className="w-full h-full flex items-center justify-center rounded-lg"
                style={{ backgroundColor: store.team2.color }}
              >
                <span className="text-white font-bold text-xs sm:text-lg lg:text-xl drop-shadow-lg">
                  {getDisplayTeamName(2)}
                </span>
              </div>
            </div>
            
            {/* Team 1 Score */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              <span className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold">{store.team1.score}</span>
            </div>
            
            {/* Main Clock */}
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-1">
              <span className="text-xs sm:text-lg md:text-xl lg:text-2xl font-bold">TIME</span>
              <span className={`text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold ${store.gameTime <= 60 ? 'text-red-500' : ''}`}>
                {formatTime(store.gameTime)}
              </span>
            </div>
            
            {/* Team 2 Score */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              <span className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold">{store.team2.score}</span>
            </div>
            
            {/* Team 1 Fouls + Timeouts (Combined to match Team 1 Score width) */}
            <div className="flex bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              {/* Team 1 Fouls */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {store.gameSettings.foulCountEnabled ? (
                  <>
                    <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold">FOULS</span>
                    <span className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold">{store.team1.fouls}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold text-gray-500">FOULS</span>
                    <span className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-gray-500">--</span>
                  </>
                )}
              </div>
              {/* Team 1 Timeouts */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold">TIMEOUTS</span>
                <span className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold">{store.team1.timeouts || 0}</span>
              </div>
            </div>
            
            {/* Shot Clock */}
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 col-span-1">
              {store.gameSettings.shotClockEnabled ? (
                <>
                  <span className="text-xs sm:text-lg md:text-xl lg:text-2xl font-bold">SHOT</span>
                  <span className={`text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold ${store.shotClockTime <= 5 ? 'text-red-500' : ''}`}>
                    {formatShotClock(store.shotClockTime)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-500">SHOT</span>
                  <span className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold text-gray-500">--</span>
                </>
              )}
            </div>
            
            {/* Team 2 Timeouts + Fouls (Combined to match Team 2 Score width) */}
            <div className="flex bg-gray-900 rounded-lg p-2 sm:p-4 col-span-2">
              {/* Team 2 Timeouts */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold">TIMEOUTS</span>
                <span className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold">{store.team2.timeouts || 0}</span>
              </div>
              {/* Team 2 Fouls */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {store.gameSettings.foulCountEnabled ? (
                  <>
                    <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold">FOULS</span>
                    <span className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold">{store.team2.fouls}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold text-gray-500">FOULS</span>
                    <span className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-gray-500">--</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Player Names Section - Only in Thursday Mode */}
          {thursdayStore.isEnabled && (
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-4 max-w-6xl mx-auto">
              {/* Team 1 Players */}
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-blue-400 mb-2 sm:mb-3">
                    {getDisplayTeamName(1)} - HOME
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                    {thursdayStore.getCurrentHomeTeam()?.players.map((player, index) => (
                      <div key={index} className="truncate">
                        {player.name} ({player.position})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-red-400 mb-2 sm:mb-3">
                    {getDisplayTeamName(2)} - AWAY
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                    {thursdayStore.getCurrentAwayTeam()?.players.map((player, index) => (
                      <div key={index} className="truncate">
                        {player.name} ({player.position})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
        ) : (
          <>
            {/* Simple Mode Layout */}
          <div className="h-full grid grid-cols-3 grid-rows-3 gap-2 sm:gap-4 max-w-6xl mx-auto">
            {/* Team 1 Name */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4">
              <div className="text-center">
                {getDisplayTeamLogo(1) && (
                  <img 
                    src={getDisplayTeamLogo(1)} 
                    alt={`${getDisplayTeamName(1)} logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2 rounded object-cover"
                  />
                )}
                <h2 className="text-sm sm:text-xl md:text-2xl lg:text-4xl font-bold">{getDisplayTeamName(1)}</h2>
              </div>
            </div>
            
            {/* Separator */}
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs sm:text-sm">VS</span>
              </div>
            </div>
            
            {/* Team 2 Name */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4">
              <div className="text-center">
                {getDisplayTeamLogo(2) && (
                  <img 
                    src={getDisplayTeamLogo(2)} 
                    alt={`${getDisplayTeamName(2)} logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2 rounded object-cover"
                  />
                )}
                <h2 className="text-sm sm:text-xl md:text-2xl lg:text-4xl font-bold">{getDisplayTeamName(2)}</h2>
              </div>
            </div>
            
            {/* Team 1 Score */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4">
              <span className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold">{store.team1.score}</span>
            </div>
            
            {/* Main Clock */}
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4">
              <span className="text-xs sm:text-lg md:text-xl lg:text-2xl font-bold">TIME</span>
              <span className={`text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold ${store.gameTime <= 60 ? 'text-red-500' : ''}`}>
                {formatTime(store.gameTime)}
              </span>
            </div>
            
            {/* Team 2 Score */}
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4">
              <span className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold">{store.team2.score}</span>
            </div>
          </div>

          {/* Player Names Section - Only in Thursday Mode */}
          {thursdayStore.isEnabled && (
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-4 max-w-6xl mx-auto">
              {/* Team 1 Players */}
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-blue-400 mb-2 sm:mb-3">
                    {getDisplayTeamName(1)} - HOME
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                    {thursdayStore.getCurrentHomeTeam()?.players.map((player, index) => (
                      <div key={index} className="truncate">
                        {player.name} ({player.position})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-red-400 mb-2 sm:mb-3">
                    {getDisplayTeamName(2)} - AWAY
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                    {thursdayStore.getCurrentAwayTeam()?.players.map((player, index) => (
                      <div key={index} className="truncate">
                        {player.name} ({player.position})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScoreboardDisplay;