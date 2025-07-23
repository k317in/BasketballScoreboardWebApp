import React, { useState } from 'react';
import { useThursdayStore } from '../store/thursdayStore';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useThursdaySync } from '../hooks/useThursdaySync';
import { googleSheetsService } from '../services/googleSheets';
import {
  Calendar,
  Users,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  Lock,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import RoleIndicator from './RoleIndicator';
import { useScoreboardStore } from '../store/scoreboardStore';

interface ThursdayModeProps {
  onBack: () => void;
  onLogin: () => void;
}

const ThursdayMode: React.FC<ThursdayModeProps> = ({ onBack, onLogin }) => {
  const store = useThursdayStore();
  const { isTable } = useAuthStore();
  const { currentRoom } = useRoomStore();
  const scoreboardStore = useScoreboardStore();
  const { emitUpdate } = useThursdaySync(currentRoom);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const currentGame = store.getCurrentGame();
  const homeTeam = store.getCurrentHomeTeam();
  const awayTeam = store.getCurrentAwayTeam();
  const totalGames = store.getTotalGames();

  const handleLoadGoogleSheets = async () => {
    if (!isTable) return;

    setIsLoading(true);
    setError(null);

    try {
      const { teams, schedule } = await googleSheetsService.fetchAllData();

      if (teams.length === 0) {
        throw new Error('No teams found in the Google Sheet');
      }

      if (schedule.length === 0) {
        throw new Error('No games found in the schedule');
      }

      store.setTeams(teams);
      store.setSchedule(schedule);
      store.enableThursdayMode();

      setLastSync(new Date());
      emitUpdate(useThursdayStore.getState());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Google Sheets data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleThursdayMode = () => {
    if (!isTable) return;

    if (store.isEnabled) {
      store.disableThursdayMode();
    } else {
      store.enableThursdayMode();
    }
    emitUpdate(useThursdayStore.getState());
  };

  const handleNextGame = () => {
    if (!isTable) return;
    store.nextGame();
    emitUpdate(useThursdayStore.getState());
  };

  const handlePreviousGame = () => {
    if (!isTable) return;
    
    // When going to previous game, also record current result and reset
    const currentGame = store.getCurrentGame();
    if (currentGame) {
      const result = `${scoreboardStore.team1.score}-${scoreboardStore.team2.score}`;
      store.updateGameResult(store.currentGameIndex, result);
      
      googleSheetsService.updateGameResult(currentGame.gameOrder, result)
        .catch((error) => {
          console.error('Failed to record game result:', error);
        });
    }
    
    store.previousGame();
    scoreboardStore.resetGameData();
    emitUpdate(useThursdayStore.getState());
  };

  const handleGameSelect = (gameIndex: number) => {
    if (!isTable) return;
    
    // Record current game result before switching
    const currentGame = store.getCurrentGame();
    if (currentGame && gameIndex !== store.currentGameIndex) {
      const result = `${scoreboardStore.team1.score}-${scoreboardStore.team2.score}`;
      store.updateGameResult(store.currentGameIndex, result);
      
      googleSheetsService.updateGameResult(currentGame.gameOrder, result)
        .catch((error) => {
          console.error('Failed to record game result:', error);
        });
    }
    
    store.setCurrentGameIndex(gameIndex);
    scoreboardStore.resetGameData();
    emitUpdate(useThursdayStore.getState());
  };

  if (!isTable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Lock size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 mb-6">
            You need Table access to manage Tuesday Mode. Please login with Table credentials.
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
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Calendar size={32} className="text-purple-500" />
            <h1 className="text-2xl lg:text-3xl font-bold">Tuesday Mode</h1>
          </div>
          <RoleIndicator onLogin={onLogin} />
        </div>

        {/* Configuration Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Configuration</h2>

          {/* Google Sheets Setup */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Google Sheets Integration</h3>
                <p className="text-sm text-gray-400">
                  {googleSheetsService.isConfigured()
                    ? 'Google Sheets is configured and ready to use'
                    : 'Configure Google Sheets ID in environment variables'
                  }
                </p>
                {lastSync && (
                  <p className="text-xs text-green-400 mt-1">
                    Last synced: {lastSync.toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={handleLoadGoogleSheets}
                disabled={isLoading || !googleSheetsService.isConfigured()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                {isLoading ? 'Loading...' : 'Load from Sheets'}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!googleSheetsService.isConfigured() && (
              <div className="p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg text-yellow-200">
                <p className="text-sm">
                  To use Google Sheets integration, set <code>VITE_GOOGLE_SHEET_ID</code> in your environment variables.
                </p>
              </div>
            )}
          </div>

          {/* Thursday Mode Toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={store.isEnabled}
                onChange={handleToggleThursdayMode}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-2 focus:ring-purple-500"
              />
              <span className="font-semibold">Enable Tuesday Mode</span>
            </label>
            {store.isEnabled && (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Management */}
        {store.isEnabled && (
          <>
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Current Game</h2>

              {currentGame ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      Game {currentGame.gameOrder} of {totalGames}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={16} />
                      <span>Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Home Team */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-400 mb-2">Home Team</h3>
                      <div className="text-xl font-bold mb-2">{currentGame.homeTeam}</div>
                      {homeTeam && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">{homeTeam.players.length} players</p>
                          <div className="text-xs text-gray-500">
                            {homeTeam.players.slice(0, 3).map(p => p.name).join(', ')}
                            {homeTeam.players.length > 3 && '...'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold text-red-400 mb-2">Away Team</h3>
                      <div className="text-xl font-bold mb-2">{currentGame.awayTeam}</div>
                      {awayTeam && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">{awayTeam.players.length} players</p>
                          <div className="text-xs text-gray-500">
                            {awayTeam.players.slice(0, 3).map(p => p.name).join(', ')}
                            {awayTeam.players.length > 3 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Game Navigation */}
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                      onClick={handlePreviousGame}
                      disabled={!store.canGoPrevious()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors"
                    >
                      <SkipBack size={20} />
                      Previous
                    </button>

                    <div className="px-4 py-2 bg-purple-600 rounded-lg">
                      <span className="font-semibold">Game {store.currentGameIndex + 1}</span>
                    </div>

                    <button
                      onClick={handleNextGame}
                      disabled={!store.canGoNext()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors"
                    >
                      Next
                      <SkipForward size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4" />
                  <p>No games scheduled. Load data from Google Sheets to get started.</p>
                </div>
              )}
            </div>

            {/* Game Schedule */}
            {store.schedule.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Game Schedule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {store.schedule.map((game, index) => (
                    <button
                      key={game.gameOrder}
                      onClick={() => handleGameSelect(index)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        index === store.currentGameIndex
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold mb-2">Game {game.gameOrder}</div>
                      <div className="text-sm space-y-1">
                        <div className="text-blue-400">Home: {game.homeTeam}</div>
                        <div className="text-red-400">Away: {game.awayTeam}</div>
                        {game.result && (
                          <div className="text-green-400 font-semibold">Result: {game.result}</div>
                        )}
                      </div>
                      {index === store.currentGameIndex && (
                        <div className="mt-2 text-xs text-purple-400 font-semibold">
                          CURRENT GAME
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Team Roster */}
            {store.teams.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3 sm:p-6">
                <h2 className="text-xl font-bold mb-4">Team Roster</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {store.teams.map((team) => (
                    <div key={team.teamName} className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users size={20} />
                        {team.teamName}
                      </h3>
                      <div className="space-y-2">
                        {team.players.map((player, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{player.name}</span>
                            <span className="text-gray-400">{player.position}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {team.players.length} players
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ThursdayMode;
