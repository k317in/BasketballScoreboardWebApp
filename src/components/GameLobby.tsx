import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useRoomStore } from '../store/roomStore';
import { GameListItem, CreateGameRequest } from '../types/game';
import {
  Plus,
  Users,
  Lock,
  Unlock,
  Play,
  Eye,
  RefreshCw,
  Search,
  Calendar,
  Clock,
  User,
  Shield
} from 'lucide-react';

interface GameLobbyProps {
  onJoinGame: (gameId: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onJoinGame }) => {
  const { user, isTable, isPending } = useAuthStore();
  const gameStore = useGameStore();
  const { setGameId } = useRoomStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateGameRequest>({
    gameName: '',
    isPrivate: false,
    password: ''
  });
  const [joinPassword, setJoinPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    gameStore.fetchAvailableGames();
  }, []);

  const handleCreateGame = async () => {
    if (!user || !isTable) return;
    
    try {
      const gameId = await gameStore.createGame(createForm, user.id, user.name);
      setGameId(gameId);
      setShowCreateModal(false);
      setCreateForm({ gameName: '', isPrivate: false, password: '' });
      onJoinGame(gameId);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoinGame = async (gameId: string, password?: string) => {
    try {
      const success = await gameStore.joinGame({ gameId, password });
      if (success) {
        setGameId(gameId);
        setShowJoinModal(null);
        setJoinPassword('');
        onJoinGame(gameId);
      }
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const filteredGames = gameStore.availableGames.filter(game =>
    game.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const publicGames = filteredGames.filter(game => !game.isPrivate);
  const privateGames = filteredGames.filter(game => game.isPrivate);

  if (isPending) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Shield size={64} className="mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-400 mb-4">
            Your request for Table access is pending admin approval. You can view games as a Guest for now.
          </p>
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-4">
            <p className="text-yellow-200 text-sm">
              <strong>Note:</strong> Table users can create and control games, while Guests can only view scoreboards.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Game Lobby</h1>
            <p className="text-gray-400">
              Welcome back, <span className="text-white font-semibold">{user?.name}</span>
              <span className="ml-2 px-2 py-1 bg-gray-700 rounded text-xs">
                {isTable ? 'Table' : 'Guest'}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isTable && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create Game
              </button>
            )}
            
            <button
              onClick={() => gameStore.fetchAvailableGames()}
              disabled={gameStore.loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <RefreshCw size={20} className={gameStore.loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search games by name or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Display */}
        {gameStore.error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{gameStore.error}</p>
            <button
              onClick={() => gameStore.clearError()}
              className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Public Games */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Unlock size={24} className="text-green-500" />
            Public Games ({publicGames.length})
          </h2>
          
          {publicGames.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <Play size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No public games available</p>
              {isTable && (
                <p className="text-sm text-gray-500 mt-2">Create the first game to get started!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicGames.map((game) => (
                <GameCard
                  key={game.gameId}
                  game={game}
                  onJoin={() => handleJoinGame(game.gameId)}
                  isTable={isTable}
                />
              ))}
            </div>
          )}
        </div>

        {/* Private Games */}
        {privateGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock size={24} className="text-yellow-500" />
              Private Games ({privateGames.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {privateGames.map((game) => (
                <GameCard
                  key={game.gameId}
                  game={game}
                  onJoin={() => setShowJoinModal(game.gameId)}
                  isTable={isTable}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create Game Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Game</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Game Name</label>
                  <input
                    type="text"
                    value={createForm.gameName}
                    onChange={(e) => setCreateForm({ ...createForm, gameName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter game name"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={createForm.isPrivate}
                    onChange={(e) => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
                  />
                  <label htmlFor="isPrivate" className="text-sm">Make this game private</label>
                </div>
                
                {createForm.isPrivate && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateGame}
                  disabled={!createForm.gameName.trim() || gameStore.loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Create Game
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ gameName: '', isPrivate: false, password: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Private Game Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Join Private Game</h2>
              <p className="text-gray-400 mb-4">This game requires a password to join.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter game password"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinGame(showJoinModal, joinPassword)}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleJoinGame(showJoinModal, joinPassword)}
                  disabled={!joinPassword.trim() || gameStore.loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Join Game
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(null);
                    setJoinPassword('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Game Card Component
interface GameCardProps {
  game: GameListItem;
  onJoin: () => void;
  isTable: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, onJoin, isTable }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'finished': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            {game.isPrivate ? <Lock size={16} className="text-yellow-500" /> : <Unlock size={16} className="text-green-500" />}
            {game.gameName}
          </h3>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            <User size={14} />
            Created by {game.creatorName}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(game.status)}`}>
          {game.status.toUpperCase()}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1">
            <Users size={14} />
            Players:
          </span>
          <span>{game.playerCount || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1">
            <Clock size={14} />
            Created:
          </span>
          <span>{formatTime(game.createdAt)}</span>
        </div>
      </div>
      
      <button
        onClick={onJoin}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        <Eye size={16} />
        {isTable ? 'Join Game' : 'View Game'}
      </button>
    </div>
  );
};

export default GameLobby;