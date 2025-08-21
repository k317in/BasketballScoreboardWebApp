import React, { useEffect, useState } from 'react';
import { useStatStore } from '../store/statStore';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useThursdayStore } from '../store/thursdayStore';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useStatSync } from '../hooks/useStatSync';
import { formatTime } from '../utils/timeFormat';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Plus, 
  Minus, 
  Users, 
  Target,
  TrendingUp,
  Shield,
  Zap,
  RotateCw,
  Download,
  Edit3,
  Trash2,
  Lock,
  Link,
  Unlink,
  UserPlus,
  Calendar
} from 'lucide-react';
import RoleIndicator from './RoleIndicator';
import { StatType } from '../types/stats';

interface StatPageProps {
  onBack: () => void;
  onLogin: () => void;
}

const StatPage: React.FC<StatPageProps> = ({ onBack, onLogin }) => {
  const statStore = useStatStore();
  const scoreboardStore = useScoreboardStore();
  const thursdayStore = useThursdayStore();
  const { isTable } = useAuthStore();
  const { currentRoom } = useRoomStore();
  const { emitUpdate: emitScoreboardUpdate } = useFirebaseSync(currentRoom);
  const { emitUpdate: emitStatUpdate } = useStatSync(currentRoom);

  // Game clock timer - runs locally for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    interval = setInterval(() => {
      if (statStore.isRunning) {
        statStore.tick();
      }
    }, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [statStore.isRunning]);

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [showPlayerStats, setShowPlayerStats] = useState(false);

  const handleStatUpdate = (playerId: string, statType: StatType, value: number) => {
    statStore.updatePlayerStat(playerId, statType, value);
    emitStatUpdate();
  };

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId);
    setShowPlayerStats(true);
  };

  const handleBackToPlayerList = () => {
    setShowPlayerStats(false);
    setSelectedPlayer('');
  };

  const exportToCSV = () => {
    const stats = statStore.getAllPlayerStats();
    const csvContent = [
      ['Player', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'SA', 'PF', 'Shot%', 'EFF'].join(','),
      ...stats.map((summary) => {
        return [
          summary.playerId,
          summary.points,
          summary.rebounds,
          summary.assists,
          summary.steals,
          summary.blocks,
          summary.turnovers,
          summary.shotAttempted,
          summary.personalFouls,
          summary.shotPercentage.toFixed(1) + '%',
          summary.efficiency
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-stats-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isTable) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            You need table permissions to access the statistics page.
          </p>
          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login as Table
            </button>
            <button
              onClick={onBack}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Display
            </button>
          </div>
        </div>
      </div>
    );
  }

  const players = statStore.getAllPlayerStats().map(summary => summary.playerId);

  if (showPlayerStats && selectedPlayer) {
    const playerStats = statStore.getPlayerStats()[selectedPlayer];
    const summary = statStore.getPlayerStats(selectedPlayer);

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToPlayerList}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                  <span>Back to Players</span>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{selectedPlayer} Stats</h1>
              </div>
              <RoleIndicator />
            </div>

            {/* Player Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.points}</div>
                  <div className="text-sm text-gray-600">PTS</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.rebounds}</div>
                  <div className="text-sm text-gray-600">REB</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.assists}</div>
                  <div className="text-sm text-gray-600">AST</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.steals}</div>
                  <div className="text-sm text-gray-600">STL</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.blocks}</div>
                  <div className="text-sm text-gray-600">BLK</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.turnovers}</div>
                  <div className="text-sm text-gray-600">TO</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.shotAttempted}</div>
                  <div className="text-sm text-gray-600">SA</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.personalFouls}</div>
                  <div className="text-sm text-gray-600">PF</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center mt-4 pt-4 border-t border-blue-200">
                <div>
                  <div className="text-xl font-bold text-blue-600">{summary.shotPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Shot%</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{summary.efficiency}</div>
                  <div className="text-sm text-gray-600">EFF</div>
                </div>
              </div>
            </div>

            {/* Stat Buttons */}
            <div className="space-y-4">
              {/* Row 1: Scoring Stats */}
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'free_throw', 1)}
                  className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">+1</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'field_goal', 1)}
                  className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">+2</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'three_pointer', 1)}
                  className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">+3</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'shot_attempted', 1)}
                  className="bg-gray-600 text-white py-4 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">SA</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'personal_fouls', 1)}
                  className="bg-yellow-600 text-white py-4 px-6 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">PF</span>
                </button>
              </div>

              {/* Row 2: Other Stats */}
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'rebounds', 1)}
                  className="bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">REB</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'assists', 1)}
                  className="bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">AST</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'steals', 1)}
                  className="bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">STL</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'blocks', 1)}
                  className="bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">BLK</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'turnovers', 1)}
                  className="bg-gray-600 text-white py-4 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="font-semibold">TO</span>
                </button>
              </div>
            </div>

            {/* Undo Buttons */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Undo Last Action</h3>
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'free_throw', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-1</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'field_goal', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-2</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'three_pointer', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-3</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'shot_attempted', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-SA</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'personal_fouls', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-PF</span>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'rebounds', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-REB</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'assists', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-AST</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'steals', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-STL</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'blocks', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-BLK</span>
                </button>
                <button
                  onClick={() => handleStatUpdate(selectedPlayer, 'turnovers', -1)}
                  className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>-TO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
                <span>Back to Display</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Player Statistics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <RoleIndicator />
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Game Clock */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-mono font-bold text-gray-800">
                  {formatTime(statStore.gameTime)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (statStore.isRunning) {
                        statStore.pause();
                      } else {
                        statStore.start();
                      }
                      emitStatUpdate();
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      statStore.isRunning
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {statStore.isRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      statStore.reset();
                      emitStatUpdate();
                    }}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Period</div>
                <div className="text-xl font-bold text-gray-800">{statStore.period}</div>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Players</h2>
            {players.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No players added yet. Add players from the team settings.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {players.map((playerId) => {
                  const summary = statStore.getPlayerStats(playerId);
                  return (
                    <div
                      key={playerId}
                      onClick={() => handlePlayerSelect(playerId)}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{playerId}</h3>
                          <div className="text-sm text-gray-600">
                            PTS {summary.points} | REB {summary.rebounds} | AST {summary.assists} | STL {summary.steals} | BLK {summary.blocks} | TO {summary.turnovers}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{summary.points}</div>
                          <div className="text-sm text-gray-500">Points</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatPage;