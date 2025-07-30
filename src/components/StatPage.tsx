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
  UserPlus
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

  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [newPlayerForm, setNewPlayerForm] = useState<{teamId: 1 | 2 | null, name: string, jerseyNumber: string, position: string}>({
    teamId: null,
    name: '',
    jerseyNumber: '',
    position: ''
  });

  // Import players from Tuesday Mode when game changes
  useEffect(() => {
    if (thursdayStore.isEnabled && statStore.isLinkedMode) {
      const currentGame = thursdayStore.getCurrentGame();
      if (currentGame) {
        const homeTeam = thursdayStore.getCurrentHomeTeam();
        const awayTeam = thursdayStore.getCurrentAwayTeam();
        
        if (homeTeam && awayTeam) {
          statStore.importPlayersFromThursday(
            currentGame.homeTeam,
            homeTeam.players,
            currentGame.awayTeam,
            awayTeam.players
          );
          statStore.setCurrentGameId(`game_${thursdayStore.currentGameIndex}`);
          emitStatUpdate(useStatStore.getState());
        }
      }
    }
  }, [thursdayStore.currentGameIndex, thursdayStore.isEnabled, statStore.isLinkedMode]);

  const handleScoreboardControl = (action: string) => {
    if (!isTable) return;

    switch (action) {
      case 'toggle-game-clock':
        scoreboardStore.toggleGameClock();
        break;
      case 'reset-game-clock':
        scoreboardStore.resetGameClock();
        break;
      case 'previous-period':
        if (scoreboardStore.period > 1) {
          scoreboardStore.setPeriod(scoreboardStore.period - 1);
        }
        break;
      case 'next-period':
        if (scoreboardStore.period < scoreboardStore.gameSettings.periodCount) {
          scoreboardStore.setPeriod(scoreboardStore.period + 1);
        }
        break;
    }
    emitScoreboardUpdate(useScoreboardStore.getState());
  };

  const handleThursdayControl = (action: string) => {
    if (!isTable || !thursdayStore.isEnabled) return;

    switch (action) {
      case 'previous-game':
        if (thursdayStore.canGoPrevious()) {
          thursdayStore.previousGame();
          scoreboardStore.resetGameData();
        }
        break;
      case 'next-game':
        if (thursdayStore.canGoNext()) {
          thursdayStore.nextGame();
          scoreboardStore.resetGameData();
        }
        break;
    }
    emitScoreboardUpdate(useScoreboardStore.getState());
  };

  const handleRecordStat = (playerId: string, statType: StatType, value: number = 1) => {
    if (!isTable) return;
    
    statStore.recordStat(
      playerId, 
      statType, 
      value, 
      scoreboardStore.gameTime, 
      scoreboardStore.period
    );
    emitStatUpdate(useStatStore.getState());
  };

  const handleAddPlayer = () => {
    if (!isTable || !newPlayerForm.teamId || !newPlayerForm.name.trim()) return;

    statStore.addPlayer(
      newPlayerForm.teamId,
      newPlayerForm.name.trim(),
      newPlayerForm.jerseyNumber.trim() || '0',
      newPlayerForm.position.trim() || 'Player'
    );

    setNewPlayerForm({ teamId: null, name: '', jerseyNumber: '', position: '' });
    emitStatUpdate(useStatStore.getState());
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!isTable) return;
    statStore.removePlayer(playerId);
    emitStatUpdate(useStatStore.getState());
  };

  const handleExportCSV = () => {
    if (!isTable) return;

    const team1Name = thursdayStore.isEnabled 
      ? thursdayStore.getCurrentGame()?.homeTeam || 'Team 1'
      : scoreboardStore.team1.name;
    const team2Name = thursdayStore.isEnabled 
      ? thursdayStore.getCurrentGame()?.awayTeam || 'Team 2'
      : scoreboardStore.team2.name;
    const finalScore = `${scoreboardStore.team1.score}-${scoreboardStore.team2.score}`;

    const gameData = statStore.exportGameData(team1Name, team2Name, finalScore);

    // Create CSV content
    const headers = [
      'Player Name', 'Jersey Number', 'Position', 'Team', 
      'Stat Type', 'Value', 'Game Time', 'Period', 'Timestamp'
    ];

    const rows = gameData.statEvents.map(event => {
      const player = gameData.players.find(p => p.id === event.playerId);
      return [
        event.playerName,
        player?.jerseyNumber || '',
        player?.position || '',
        `Team ${event.teamId}`,
        event.statType.replace('_', ' ').toUpperCase(),
        event.value.toString(),
        formatTime(event.gameTime),
        event.period.toString(),
        new Date(event.systemTimestamp).toLocaleString()
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `game-stats-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const getTeamName = (teamId: 1 | 2) => {
    if (thursdayStore.isEnabled && statStore.isLinkedMode) {
      const currentGame = thursdayStore.getCurrentGame();
      if (currentGame) {
        return teamId === 1 ? currentGame.homeTeam : currentGame.awayTeam;
      }
    }
    return teamId === 1 ? scoreboardStore.team1.name : scoreboardStore.team2.name;
  };

  const statButtons = [
    { type: 'points' as StatType, label: '+1', value: 1, icon: Target, color: 'bg-green-600 hover:bg-green-700' },
    { type: 'points' as StatType, label: '+2', value: 2, icon: Target, color: 'bg-green-600 hover:bg-green-700' },
    { type: 'points' as StatType, label: '+3', value: 3, icon: Target, color: 'bg-green-600 hover:bg-green-700' },
    { type: 'rebounds' as StatType, label: 'REB', value: 1, icon: TrendingUp, color: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'assists' as StatType, label: 'AST', value: 1, icon: Users, color: 'bg-purple-600 hover:bg-purple-700' },
    { type: 'steals' as StatType, label: 'STL', value: 1, icon: Zap, color: 'bg-yellow-600 hover:bg-yellow-700' },
    { type: 'blocks' as StatType, label: 'BLK', value: 1, icon: Shield, color: 'bg-red-600 hover:bg-red-700' },
    { type: 'turnovers' as StatType, label: 'TO', value: 1, icon: RotateCw, color: 'bg-orange-600 hover:bg-orange-700' }
  ];

  if (!isTable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md">
            <Lock size={48} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-400 mb-6">
              You need Table access to use the Stats Page. Please login with Table credentials.
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
    <div className="min-h-screen bg-black text-white p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <TrendingUp size={32} className="text-green-500" />
            <h1 className="text-2xl lg:text-3xl font-bold">Stats Recorder</h1>
          </div>
          <RoleIndicator onLogin={onLogin} />
        </div>

        {/* Mini Scoreboard Control Panel */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Game Status */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">Time</div>
                <div className={`text-xl font-bold ${scoreboardStore.gameTime <= 60 ? 'text-red-500' : ''}`}>
                  {formatTime(scoreboardStore.gameTime)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Period</div>
                <div className="text-xl font-bold">{scoreboardStore.period}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Score</div>
                <div className="text-xl font-bold">
                  {scoreboardStore.team1.score} - {scoreboardStore.team2.score}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              {/* Game Clock Controls */}
              <button
                onClick={() => handleScoreboardControl('toggle-game-clock')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  scoreboardStore.isGameRunning 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {scoreboardStore.isGameRunning ? <Pause size={16} /> : <Play size={16} />}
                {scoreboardStore.isGameRunning ? 'Pause' : 'Start'}
              </button>

              <button
                onClick={() => handleScoreboardControl('reset-game-clock')}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors text-sm"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              {/* Period Controls */}
              <button
                onClick={() => handleScoreboardControl('previous-period')}
                disabled={scoreboardStore.period <= 1}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
              >
                <Minus size={16} />
                Period
              </button>

              <button
                onClick={() => handleScoreboardControl('next-period')}
                disabled={scoreboardStore.period >= scoreboardStore.gameSettings.periodCount}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Period
              </button>

              {/* Tuesday Mode Controls */}
              {thursdayStore.isEnabled && (
                <>
                  <button
                    onClick={() => handleThursdayControl('previous-game')}
                    disabled={!thursdayStore.canGoPrevious()}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
                  >
                    <SkipBack size={16} />
                    Last Game
                  </button>

                  <button
                    onClick={() => handleThursdayControl('next-game')}
                    disabled={!thursdayStore.canGoNext()}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
                  >
                    Next Game
                    <SkipForward size={16} />
                  </button>
                </>
              )}

              {/* Mode Toggle */}
              <button
                onClick={() => {
                  statStore.toggleLinkedMode();
                  emitStatUpdate(useStatStore.getState());
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  statStore.isLinkedMode 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {statStore.isLinkedMode ? <Link size={16} /> : <Unlink size={16} />}
                {statStore.isLinkedMode ? 'Linked' : 'Standalone'}
              </button>

              {/* Export */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-sm"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Player Management and Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Team 1 */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-400">
                {getTeamName(1)} {thursdayStore.isEnabled && '(Home)'}
              </h2>
              <button
                onClick={() => setNewPlayerForm({ ...newPlayerForm, teamId: 1 })}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
              >
                <UserPlus size={16} />
                Add Player
              </button>
            </div>

            {/* Add Player Form */}
            {newPlayerForm.teamId === 1 && (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={newPlayerForm.name}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                    className="px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Jersey #"
                    value={newPlayerForm.jerseyNumber}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, jerseyNumber: e.target.value })}
                    className="px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Position"
                    value={newPlayerForm.position}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, position: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                  <button
                    onClick={handleAddPlayer}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setNewPlayerForm({ teamId: null, name: '', jerseyNumber: '', position: '' })}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="space-y-3">
              {statStore.team1Players.map((player) => {
                const playerStats = statStore.getPlayerStats(player.id);
                return (
                  <div key={player.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">#{player.jerseyNumber}</span>
                        <span>{player.name}</span>
                        <span className="text-xs text-gray-400">({player.position})</span>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Player Stats Summary */}
                    <div className="text-xs text-gray-400 mb-2">
                      PTS: {playerStats.points} | REB: {playerStats.rebounds} | AST: {playerStats.assists} | STL: {playerStats.steals}
                    </div>

                    {/* Stat Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {statButtons.map((stat) => (
                        <button
                          key={`${stat.type}-${stat.value}`}
                          onClick={() => handleRecordStat(player.id, stat.type, stat.value)}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${stat.color}`}
                        >
                          <stat.icon size={12} />
                          {stat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-400">
                {getTeamName(2)} {thursdayStore.isEnabled && '(Away)'}
              </h2>
              <button
                onClick={() => setNewPlayerForm({ ...newPlayerForm, teamId: 2 })}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              >
                <UserPlus size={16} />
                Add Player
              </button>
            </div>

            {/* Add Player Form */}
            {newPlayerForm.teamId === 2 && (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={newPlayerForm.name}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                    className="px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Jersey #"
                    value={newPlayerForm.jerseyNumber}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, jerseyNumber: e.target.value })}
                    className="px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Position"
                    value={newPlayerForm.position}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, position: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                  <button
                    onClick={handleAddPlayer}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setNewPlayerForm({ teamId: null, name: '', jerseyNumber: '', position: '' })}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="space-y-3">
              {statStore.team2Players.map((player) => {
                const playerStats = statStore.getPlayerStats(player.id);
                return (
                  <div key={player.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">#{player.jerseyNumber}</span>
                        <span>{player.name}</span>
                        <span className="text-xs text-gray-400">({player.position})</span>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Player Stats Summary */}
                    <div className="text-xs text-gray-400 mb-2">
                      PTS: {playerStats.points} | REB: {playerStats.rebounds} | AST: {playerStats.assists} | STL: {playerStats.steals}
                    </div>

                    {/* Stat Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {statButtons.map((stat) => (
                        <button
                          key={`${stat.type}-${stat.value}`}
                          onClick={() => handleRecordStat(player.id, stat.type, stat.value)}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${stat.color}`}
                        >
                          <stat.icon size={12} />
                          {stat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Stats */}
        {statStore.statEvents.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Stats</h2>
              <button
                onClick={() => {
                  statStore.undoLastStat();
                  emitStatUpdate(useStatStore.getState());
                }}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
              >
                <RotateCcw size={16} />
                Undo Last
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {statStore.statEvents.slice(-10).reverse().map((event) => (
                <div key={event.id} className="flex items-center justify-between bg-gray-800 rounded p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{event.playerName}</span>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{event.statType.replace('_', ' ')}</span>
                    {event.statType === 'points' && <span className="text-green-400">+{event.value}</span>}
                  </div>
                  <div className="text-gray-400">
                    {formatTime(event.gameTime)} - P{event.period}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatPage;

export default StatPage