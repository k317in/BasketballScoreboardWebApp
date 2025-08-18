import React from 'react';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { ArrowLeft, Clock, Target, Hash, RotateCcw, Lock } from 'lucide-react';
import RoleIndicator from './RoleIndicator';

interface GameSettingsProps {
  onBack: () => void;
  onLogin: () => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ onBack, onLogin }) => {
  const store = useScoreboardStore();
  const { isTable } = useAuthStore();
  const { currentGameId } = useGameStore();
  const { emitUpdate } = useFirebaseSync();
  const { gameSettings } = store;

  const handleSettingChange = (key: keyof typeof gameSettings, value: number) => {
    if (!isTable) return;
    store.updateGameSettings({ [key]: value });
    emitUpdate(useScoreboardStore.getState());
  };

  const presetConfigs = [
    {
      name: 'NBA',
      gameDuration: 12,
      periodCount: 4,
      shotClockDuration: 24,
      shotClockEnabled: true,
      foulCountEnabled: true,
      timeoutsPerTeam: 7
    },
    {
      name: 'FIBA',
      gameDuration: 10,
      periodCount: 4,
      shotClockDuration: 24,
      shotClockEnabled: true,
      foulCountEnabled: true,
      timeoutsPerTeam: 5
    },
    {
      name: 'NCAA',
      gameDuration: 20,
      periodCount: 2,
      shotClockDuration: 30,
      shotClockEnabled: true,
      foulCountEnabled: true,
      timeoutsPerTeam: 4
    },
    {
      name: 'High School',
      gameDuration: 8,
      periodCount: 4,
      shotClockDuration: 35,
      shotClockEnabled: false,
      foulCountEnabled: false,
      timeoutsPerTeam: 3
    },
    {
      name: '3v3',
      gameDuration: 10,
      periodCount: 1,
      shotClockDuration: 12,
      shotClockEnabled: true,
      foulCountEnabled: true,
      timeoutsPerTeam: 1
    }
  ];

  const applyPreset = (preset: typeof presetConfigs[0]) => {
    if (!isTable) return;
    store.updateGameSettings({
      gameDuration: preset.gameDuration,
      periodCount: preset.periodCount,
      shotClockDuration: preset.shotClockDuration,
      shotClockEnabled: preset.shotClockEnabled,
      foulCountEnabled: preset.foulCountEnabled,
      timeoutsPerTeam: preset.timeoutsPerTeam
    });
    // Update current team timeouts to match new setting
    store.updateTeamTimeouts(1, preset.timeoutsPerTeam - store.team1.timeouts);
    store.updateTeamTimeouts(2, preset.timeoutsPerTeam - store.team2.timeouts);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleResetGame = () => {
    if (!isTable) return;
    store.resetGame();
    emitUpdate(useScoreboardStore.getState());
  };

  const handleToggleMode = () => {
    if (!isTable) return;
    store.toggleMode();
    emitUpdate(useScoreboardStore.getState());
  };

  const handleToggleProportionalBanners = () => {
    if (!isTable) return;
    store.toggleProportionalBanners();
    emitUpdate(useScoreboardStore.getState());
  };

  // Only show access restriction if not in Tuesday Mode
  if (!isTable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md">
            <Lock size={48} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-400 mb-6">
              You need Table access to modify game settings. Please login with Table credentials.
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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Game Settings</h1>
          </div>
          <RoleIndicator onLogin={onLogin} />
        </div>

        {/* Preset Configurations */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {presetConfigs.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <h3 className="font-semibold text-lg mb-2">{preset.name}</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Duration: {preset.gameDuration} min</div>
                  <div>Periods: {preset.periodCount}</div>
                  <div>Shot Clock: {preset.shotClockEnabled ? `${preset.shotClockDuration}s` : 'Disabled'}</div>
                  <div>Fouls: {preset.foulCountEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div>Timeouts: {preset.timeoutsPerTeam}/team</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Settings */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Custom Settings</h2>
          
          {/* Game Duration */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock size={20} />
              Game Duration (minutes per period)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={gameSettings.gameDuration}
              onChange={(e) => handleSettingChange('gameDuration', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Period Count */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Hash size={20} />
              Number of Periods
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={gameSettings.periodCount}
              onChange={(e) => handleSettingChange('periodCount', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Shot Clock Duration */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameSettings.shotClockEnabled}
                  onChange={(e) => handleSettingChange('shotClockEnabled', e.target.checked ? 1 : 0)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Target size={20} />
                  Enable Shot Clock
                </span>
              </label>
            </div>
            
            {gameSettings.shotClockEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2 ml-6">
                  Shot Clock Duration (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={gameSettings.shotClockDuration}
                  onChange={(e) => handleSettingChange('shotClockDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-6"
                />
              </div>
            )}
          </div>

          {/* Foul Count Toggle */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameSettings.foulCountEnabled}
                  onChange={(e) => handleSettingChange('foulCountEnabled', e.target.checked ? 1 : 0)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  Enable Foul Count
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-7">
              When disabled, foul counts will be hidden from the scoreboard display
            </p>
          </div>

          {/* Timeouts Per Team */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock size={20} />
              Timeouts per Team
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={gameSettings.timeoutsPerTeam}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                handleSettingChange('timeoutsPerTeam', newValue);
                // Update current team timeouts to match new setting
                store.updateTeamTimeouts(1, newValue - store.team1.timeouts);
                store.updateTeamTimeouts(2, newValue - store.team2.timeouts);
                emitUpdate(useScoreboardStore.getState());
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-2">
              Number of timeouts each team can use during the game (Full Mode only)
            </p>
          </div>

          {/* Current Configuration Preview */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Current Configuration</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Game Duration: {gameSettings.gameDuration} minutes per period</div>
              <div>Total Periods: {gameSettings.periodCount}</div>
              <div>Total Game Time: {gameSettings.gameDuration * gameSettings.periodCount} minutes</div>
              <div>Shot Clock: {gameSettings.shotClockEnabled ? `${gameSettings.shotClockDuration} seconds` : 'Disabled'}</div>
              <div>Foul Count: {gameSettings.foulCountEnabled ? 'Enabled' : 'Disabled'}</div>
              <div>Timeouts: {gameSettings.timeoutsPerTeam} per team</div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Display Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={store.isFullMode}
                  onChange={handleToggleMode}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>Full Mode (includes shot clock and fouls)</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={store.showProportionalBanners}
                  onChange={handleToggleProportionalBanners}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>Show proportional team banners</span>
              </label>
            </div>
          </div>
        </div>

        {/* Reset Game */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-6">
          <h2 className="text-xl font-bold mb-4">Reset Game</h2>
          <p className="text-gray-400 mb-4">
            Reset all game data including scores, fouls, and timers to start a new game.
          </p>
          <button
            onClick={handleResetGame}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <RotateCcw size={20} />
            Reset Everything
          </button>
          <p className="text-xs text-gray-400 mt-2">
            This will reset everything including team names, colors, and logos to defaults.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;