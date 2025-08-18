import React, { useEffect, useState } from 'react';
import { useStatStore } from '../store/statStore';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useThursdayStore } from '../store/thursdayStore';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
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
  const { currentGameId } = useGameStore();
  const { emitUpdate: emitScoreboardUpdate } = useFirebaseSync();
  const { emitUpdate: emitStatUpdate } = useStatSync();

  // Game clock timer - runs locally for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scoreboardStore.isGameRunning && scoreboardStore.gameTime > 0) {
      // Use 10ms intervals for smooth millisecond countdown
      interval = setInterval(() => {
        const currentMs = scoreboardStore.gameTimeMs;
        const currentSeconds = scoreboardStore.gameTime;
        
        if (currentMs > 0) {
          // Decrease milliseconds
          scoreboardStore.setGameTimeMs(Math.max(0, currentMs - 10));
        } else {
          // Decrease seconds and reset milliseconds
          if (currentSeconds > 0) {
            const newTime = currentSeconds - 1;
            scoreboardStore.setGameTime(newTime);
            scoreboardStore.setGameTimeMs(990); // Reset to 990ms for next second
          }
        }
        
        // Only emit update if user is table (to avoid conflicts)
        if (isTable) {
          emitScoreboardUpdate(useScoreboardStore.getState());
        }
      }, 10);
    }
    return () => clearInterval(interval);
  }, [scoreboardStore.isGameRunning, scoreboardStore.gameTime, scoreboardStore.gameTimeMs, emitScoreboardUpdate, isTable]);

  // Shot clock timer - runs locally for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scoreboardStore.gameSettings.shotClockEnabled && scoreboardStore.isShotClockRunning && scoreboardStore.shotClockTime > 0) {
      interval = setInterval(() => {
        const newTime = scoreboardStore.shotClockTime - 1;
        scoreboardStore.setShotClockTime(newTime);
        // Only emit update if user is table (to avoid conflicts)
        if (isTable) {
          emitScoreboardUpdate(useScoreboardStore.getState());
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [scoreboardStore.gameSettings.shotClockEnabled, scoreboardStore.isShotClockRunning, scoreboardStore.shotClockTime, emitScoreboardUpdate, isTable]);

  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'tuesday' | 'normal'>(() => {
    // Initialize based on Thursday store state
    return thursdayStore.isEnabled ? 'tuesday' : 'normal';
  });
  const [newPlayerForm, setNewPlayerForm] = useState<{teamId: 1 | 2 | null, name: string, jerseyNumber: string, position: string}>({
    teamId: null,
    name: '',
    jerseyNumber: '',
    position: ''
  });

  // Sync game mode with Thursday store state
  useEffect(() => {
    if (thursdayStore.isEnabled && gameMode !== 'tuesday') {
      setGameMode('tuesday');
    } else if (!thursdayStore.isEnabled && gameMode !== 'normal') {
      setGameMode('normal');
    }
  }, [thursdayStore.isEnabled, gameMode]);

  // Import players from Tuesday Mode when game changes or mode switches
  useEffect(() => {
    if (gameMode === 'tuesday' && thursdayStore.isEnabled) {
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
    // Clear players when switching to normal mode
    else if (gameMode === 'normal') {
      if (statStore.team1Players.length > 0 || statStore.team2Players.length > 0) {
        statStore.clearTeamRoster(1);
        statStore.clearTeamRoster(2);
        emitStatUpdate(useStatStore.getState());
      }
    }
  }, [thursdayStore.currentGameIndex, thursdayStore.isEnabled, gameMode]);

  // Game clock timer - display live updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scoreboardStore.isGameRunning && scoreboardStore.gameTime > 0) {
      interval = setInterval(() => {
        // Force re-render to show live time updates
        // The actual time update is handled by ScoreboardDisplay
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [scoreboardStore.isGameRunning, scoreboardStore.gameTime]);

  const handleScoreboardControl = (action: string) => {
    if (!isTable || !statStore.isLinkedMode) return;

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
    if (!isTable || !statStore.isLinkedMode || gameMode !== 'tuesday' || !thursdayStore.isEnabled) return;

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
    
    // Record the stat
    statStore.recordStat(
      playerId, 
      statType, 
      value, 
      scoreboardStore.gameTime, 
      scoreboardStore.period
    );
    
    // If in linked mode and it's a points stat, update the main scoreboard
    if (statStore.isLinkedMode && statType === 'points') {
      const player = [...statStore.team1Players, ...statStore.team2Players].find(p => p.id === playerId);
      if (player) {
        scoreboardStore.updateTeamScore(player.teamId, value);
        emitScoreboardUpdate(useScoreboardStore.getState());
      }
    }
    
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

  const handleUndoStat = () => {
    if (!isTable || statStore.statEvents.length === 0) return;
    
    const lastEvent = statStore.statEvents[statStore.statEvents.length - 1];
    
    // If it's a points stat and we're in linked mode, deduct from scoreboard
    if (lastEvent.statType === 'points' && statStore.isLinkedMode) {
      scoreboardStore.updateTeamScore(lastEvent.teamId, -lastEvent.value);
      emitScoreboardUpdate(useScoreboardStore.getState());
    }
    
    // Remove the stat from history
    statStore.undoLastStat();
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

    if (gameMode === 'tuesday' && thursdayStore.isEnabled) {
      // Tuesday Mode: Export all games in one CSV file
      const headers = [
        'Player Name', 'Jersey Number', 'Game Number', 'Team', 
        'Stat Type', 'Value', 'Game Time', 'Period', 'Timestamp'
      ];

      // Get all stat events from all games
      const allStatEvents = statStore.statEvents;
      const allPlayers = [...statStore.team1Players, ...statStore.team2Players];

      const rows = allStatEvents.map(event => {
        const player = allPlayers.find(p => p.id === event.playerId);
        // Extract game number from gameId or use current game index
        const gameNumber = event.gameId ? 
          event.gameId.replace('game_', '') : 
          thursdayStore.currentGameIndex.toString();
        
        return [
          event.playerName,
          player?.jerseyNumber || '',
          (parseInt(gameNumber) + 1).toString(), // Convert to 1-based indexing
          event.teamId === 1 ? team1Name : team2Name,
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
      link.setAttribute('download', `tuesday-mode-all-games-stats-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } else {
      // Normal Mode: Export current game only
      const gameData = statStore.exportGameData(team1Name, team2Name, finalScore);

      const headers = [
        'Player Name', 'Jersey Number', 'Period', 'Team', 
        'Stat Type', 'Value', 'Game Time', 'Period', 'Timestamp'
      ];

      const rows = gameData.statEvents.map(event => {
        const player = gameData.players.find(p => p.id === event.playerId);
        return [
          event.playerName,
          player?.jerseyNumber || '',
          event.period.toString(),
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
      link.setAttribute('download', `normal-mode-game-stats-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  };

  const handleModeToggle = () => {
    if (!isTable) return;

    if (gameMode === 'normal') {
      // Switch to Tuesday mode
      if (thursdayStore.teams.length > 0 && thursdayStore.schedule.length > 0) {
        thursdayStore.enableThursdayMode();
      } else {
        // If no Tuesday data exists, just enable the mode but don't import players yet
        thursdayStore.enableThursdayMode();
      }
      setGameMode('tuesday');
    } else {
      // Switch to Normal mode
      // Don't disable Thursday store completely, just switch local mode
      // This preserves the Tuesday data for when user switches back
      setGameMode('normal');
      // Clear players when switching to normal mode
      if (statStore.team1Players.length > 0 || statStore.team2Players.length > 0) {
        statStore.clearTeamRoster(1);
        statStore.clearTeamRoster(2);
      }
    }
    
    emitStatUpdate(useStatStore.getState());
  };

  const getTeamName = (teamId: 1 | 2) => {
    if (gameMode === 'tuesday' && thursdayStore.isEnabled) {
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
            <div className="flex items-center gap-2">
              {statStore.isLinkedMode && <div className="px-2 py-1 bg-green-600 rounded text-xs">LINKED</div>}
              {!statStore.isLinkedMode && <div className="px-2 py-1 bg-gray-600 rounded text-xs">STANDALONE</div>}
              {gameMode === 'tuesday' && <div className="px-2 py-1 bg-purple-600 rounded text-xs">TUESDAY</div>}
              {gameMode === 'normal' && <div className="px-2 py-1 bg-blue-600 rounded text-xs">NORMAL</div>}
            </div>
          </div>
          <RoleIndicator onLogin={onLogin} />
        </div>

        {/* Mode Controls */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-4">Mode Controls</h2>
          <div className="flex flex-wrap gap-4">
            {/* Link/Standalone Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Scoreboard Sync:</span>
              <button
                onClick={() => {
                  statStore.toggleLinkedMode();
                  emitStatUpdate(useStatStore.getState());
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  statStore.isLinkedMode 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {statStore.isLinkedMode ? <Link size={16} /> : <Unlink size={16} />}
                {statStore.isLinkedMode ? 'Linked' : 'Standalone'}
              </button>
            </div>

            {/* Tuesday/Normal Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Game Mode:</span>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm ${
                gameMode === 'tuesday' 
                  ? 'bg-purple-600' 
                  : 'bg-blue-600'
              }`}>
                <Calendar size={16} />
                {gameMode === 'tuesday' ? 'Tuesday Mode' : 'Normal Game'}
              </div>
            </div>
          </div>
          
          {/* Mode Descriptions */}
          <div className="mt-4 text-sm text-gray-400">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <strong className="text-green-400">Linked Mode:</strong> Stats and controls sync with main scoreboard
              </div>
              <div>
                <strong className="text-gray-400">Standalone Mode:</strong> Stats recorded independently, no scoreboard sync
              </div>
              <div>
                <strong className="text-purple-400">Tuesday Mode:</strong> Players imported from Tuesday schedule
              </div>
              <div>
                <strong className="text-blue-400">Normal Game:</strong> Manual player management with team settings
              </div>
            </div>
          </div>
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
                <div className="text-sm text-gray-400">
                  {gameMode === 'tuesday' && thursdayStore.isEnabled ? 'Game' : 'Period'}
                </div>
                <div className="text-xl font-bold">
                  {gameMode === 'tuesday' && thursdayStore.isEnabled 
                    ? `${thursdayStore.currentGameIndex + 1}/${thursdayStore.getTotalGames()}`
                    : scoreboardStore.period
                  }
                </div>
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
                disabled={!statStore.isLinkedMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  !statStore.isLinkedMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : scoreboardStore.isGameRunning 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                }`}
                title={!statStore.isLinkedMode ? 'Only available in Linked mode' : ''}
              >
                {scoreboardStore.isGameRunning ? <Pause size={16} /> : <Play size={16} />}
                {scoreboardStore.isGameRunning ? 'Pause' : 'Start'}
              </button>

              <button
                onClick={() => handleScoreboardControl('reset-game-clock')}
                disabled={!statStore.isLinkedMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  !statStore.isLinkedMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
                title={!statStore.isLinkedMode ? 'Only available in Linked mode' : ''}
              >
                <RotateCcw size={16} />
                Reset
              </button>

              {/* Period Controls */}
              <button
                onClick={() => handleScoreboardControl('previous-period')}
                disabled={!statStore.isLinkedMode || scoreboardStore.period <= 1}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
                title={!statStore.isLinkedMode ? 'Only available in Linked mode' : ''}
              >
                <Minus size={16} />
                Period
              </button>

              <button
                onClick={() => handleScoreboardControl('next-period')}
                disabled={!statStore.isLinkedMode || scoreboardStore.period >= scoreboardStore.gameSettings.periodCount}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
                title={!statStore.isLinkedMode ? 'Only available in Linked mode' : ''}
              >
                <Plus size={16} />
                Period
              </button>

              {/* Tuesday Mode Controls */}
              {gameMode === 'tuesday' && thursdayStore.isEnabled && (
                <>
                  <button
                    onClick={() => handleThursdayControl('previous-game')}
                    disabled={!statStore.isLinkedMode || !thursdayStore.canGoPrevious()}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
                    title={!statStore.isLinkedMode ? 'Only available in Linked mode' : ''}
                  >
                    <SkipBack size={16} />
                    Last Game
                  </button>

                  <button
                    onClick={() => handleThursdayControl('next-game')}
                    disabled={!statStore.isLinkedMode || !thursdayStore.canGoNext()}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
                    title={!statStore.isLinkedMode ? 'Only available in Linked mode' : ''}
                  >
                    Next Game
                    <SkipForward size={16} />
                  </button>
                </>
              )}

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
                {gameMode === 'tuesday' && <span className="text-xs text-purple-400 ml-2">Tuesday</span>}
              </h2>
              {gameMode === 'normal' && (
                <button
                  onClick={() => setNewPlayerForm({ ...newPlayerForm, teamId: 1 })}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  <UserPlus size={16} />
                  Add Player
                </button>
              )}
            </div>

            {/* Add Player Form */}
            {gameMode === 'normal' && newPlayerForm.teamId === 1 && (
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
                        {gameMode === 'tuesday' && <span className="text-xs text-purple-400">Tuesday</span>}
                      </div>
                      {gameMode === 'normal' && (
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* Player Stats Summary */}
                    <div className="text-xs text-gray-400 mb-2">
                      PTS: {playerStats.points} | REB: {playerStats.rebounds} | AST: {playerStats.assists} | STL: {playerStats.steals} | TO: {playerStats.turnovers}
                    </div>

                    {/* Stat Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {statButtons.map((stat) => (
                        <button
                          key={`${stat.type}-${stat.value}`}
                          onClick={() => handleRecordStat(player.id, stat.type, stat.value)}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${stat.color}`}
                          title={
                            !statStore.isLinkedMode && stat.type === 'points' 
                              ? 'Points recorded in stats only (Standalone mode)' 
                              : ''
                          }
                        >
                          <stat.icon size={12} />
                          {stat.label}
                          {!statStore.isLinkedMode && stat.type === 'points' && (
                            <span className="text-xs opacity-60">*</span>
                          )}
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
                {gameMode === 'tuesday' && <span className="text-xs text-purple-400 ml-2">Tuesday</span>}
              </h2>
              {gameMode === 'normal' && (
                <button
                  onClick={() => setNewPlayerForm({ ...newPlayerForm, teamId: 2 })}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                >
                  <UserPlus size={16} />
                  Add Player
                </button>
              )}
            </div>

            {/* Add Player Form */}
            {gameMode === 'normal' && newPlayerForm.teamId === 2 && (
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
                        {gameMode === 'tuesday' && <span className="text-xs text-purple-400">Tuesday</span>}
                      </div>
                      {gameMode === 'normal' && (
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* Player Stats Summary */}
                    <div className="text-xs text-gray-400 mb-2">
                      PTS: {playerStats.points} | REB: {playerStats.rebounds} | AST: {playerStats.assists} | STL: {playerStats.steals} | TO: {playerStats.turnovers}
                    </div>

                    {/* Stat Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {statButtons.map((stat) => (
                        <button
                          key={`${stat.type}-${stat.value}`}
                          onClick={() => handleRecordStat(player.id, stat.type, stat.value)}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${stat.color}`}
                          title={
                            !statStore.isLinkedMode && stat.type === 'points' 
                              ? 'Points recorded in stats only (Standalone mode)' 
                              : ''
                          }
                        >
                          <stat.icon size={12} />
                          {stat.label}
                          {!statStore.isLinkedMode && stat.type === 'points' && (
                            <span className="text-xs opacity-60">*</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mode Information */}
        {!statStore.isLinkedMode && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-yellow-200">
              <Unlink size={16} />
              <span className="text-sm">
                <strong>Standalone Mode:</strong> Point buttons marked with * record stats only and don't update the main scoreboard. 
                Mini scoreboard controls are disabled.
              </span>
            </div>
          </div>
        )}

        {/* Recent Stats */}
        {statStore.statEvents.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Stats</h2>
              <button
                onClick={() => {
                  handleUndoStat();
                }}
                disabled={statStore.statEvents.length === 0}
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
                    {event.statType === 'points' && statStore.isLinkedMode && (
                      <span className="text-xs text-blue-400">(Scoreboard)</span>
                    )}
                  </div>
                  <div className="text-gray-400">
                    {formatTime(event.gameTime)} - P{event.period}
                  </div>
                </div>
              ))}
              {statStore.statEvents.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No stats recorded yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatPage;