import React, { useState } from 'react';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { ArrowLeft, Upload, Palette, Lock } from 'lucide-react';
import RoleIndicator from './RoleIndicator';

interface TeamSettingsProps {
  onBack: () => void;
  onLogin: () => void;
}

const TeamSettings: React.FC<TeamSettingsProps> = ({ onBack, onLogin }) => {
  const store = useScoreboardStore();
  const { isTable } = useAuthStore();
  const { currentGameId } = useGameStore();
  const { emitUpdate } = useFirebaseSync();
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1);

  const teamColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#ec4899', '#64748b', '#dc2626', '#ea580c', '#ca8a04'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, teamNumber: 1 | 2) => {
    if (!isTable) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        store.updateTeamLogo(teamNumber, result);
        emitUpdate(useScoreboardStore.getState());
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeamNameChange = (teamNumber: 1 | 2, name: string) => {
    if (!isTable) return;
    store.updateTeamName(teamNumber, name);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleTeamColorChange = (teamNumber: 1 | 2, color: string) => {
    if (!isTable) return;
    store.updateTeamColor(teamNumber, color);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleRemoveLogo = (teamNumber: 1 | 2) => {
    if (!isTable) return;
    store.updateTeamLogo(teamNumber, undefined);
    emitUpdate(useScoreboardStore.getState());
  };

  const handleToggleProportionalBanners = () => {
    if (!isTable) return;
    store.toggleProportionalBanners();
    emitUpdate(useScoreboardStore.getState());
  };

  const currentTeam = activeTeam === 1 ? store.team1 : store.team2;

  // Only show access restriction if not in Tuesday Mode
  if (!isTable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md">
            <Lock size={48} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-400 mb-6">
              You need Table access to modify team settings. Please login with Table credentials.
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
            <h1 className="text-3xl font-bold">Team Settings</h1>
          </div>
          <RoleIndicator onLogin={onLogin} />
        </div>

        {/* Team Selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTeam(1)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTeam === 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Team 1: {store.team1.name}
          </button>
          <button
            onClick={() => setActiveTeam(2)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTeam === 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Team 2: {store.team2.name}
          </button>
        </div>

        {/* Team Configuration */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-6 mb-4 sm:mb-8">
          <h2 className="text-xl font-bold mb-6">Configure {currentTeam.name}</h2>
          
          {/* Team Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Team Name</label>
            <input
              type="text"
              value={currentTeam.name}
              onChange={(e) => handleTeamNameChange(activeTeam, e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team name"
            />
          </div>

          {/* Team Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Team Color</label>
            <div className="flex gap-2 flex-wrap">
              {teamColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleTeamColorChange(activeTeam, color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    currentTeam.color === color ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Palette size={20} />
              <input
                type="color"
                value={currentTeam.color}
                onChange={(e) => handleTeamColorChange(activeTeam, e.target.value)}
                className="w-16 h-10 rounded border-none bg-transparent cursor-pointer"
              />
              <span className="text-sm text-gray-400">Custom color</span>
            </div>
          </div>

          {/* Team Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Team Logo</label>
            <div className="flex items-center gap-4">
              {currentTeam.logo && (
                <img 
                  src={currentTeam.logo} 
                  alt={`${currentTeam.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                <Upload size={20} />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, activeTeam)}
                  className="hidden"
                />
              </label>
              {currentTeam.logo && (
                <button
                  onClick={() => handleRemoveLogo(activeTeam)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div 
              className="p-4 rounded-lg text-white font-bold text-center"
              style={{ backgroundColor: currentTeam.color }}
            >
              {currentTeam.logo ? (
                <div className="flex items-center justify-center gap-2">
                  <img 
                    src={currentTeam.logo} 
                    alt={`${currentTeam.name} logo`}
                    className="w-8 h-8 rounded object-cover"
                  />
                  {currentTeam.name}
                </div>
              ) : (
                currentTeam.name
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSettings;