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
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  // Game clock timer - runs locally for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (statStore.isRunning) {
      interval = setInterval(() => {
        statStore.updateGameClock();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statStore.isRunning]);

  const handleStatAction = (statType: StatType, value: number) => {
    statStore.updateStat(selectedTeam, statType, value);
    emitStatUpdate();
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <SkipBack size={24} />
        </button>
        <RoleIndicator onLogin={onLogin} />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded ${selectedTeam === 'home' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedTeam('home')}
          >
            Home
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedTeam === 'away' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedTeam('away')}
          >
            Away
          </button>
        </div>
        <div className="text-xl font-bold">
          {formatTime(statStore.gameClock)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          className="flex items-center justify-center p-4 bg-green-500 text-white rounded"
          onClick={() => handleStatAction('points', 2)}
        >
          <Target size={24} />
          <span className="ml-2">+2 Points</span>
        </button>
        <button 
          className="flex items-center justify-center p-4 bg-green-500 text-white rounded"
          onClick={() => handleStatAction('points', 3)}
        >
          <TrendingUp size={24} />
          <span className="ml-2">+3 Points</span>
        </button>
        <button 
          className="flex items-center justify-center p-4 bg-blue-500 text-white rounded"
          onClick={() => handleStatAction('assists', 1)}
        >
          <Users size={24} />
          <span className="ml-2">Assist</span>
        </button>
        <button 
          className="flex items-center justify-center p-4 bg-yellow-500 text-white rounded"
          onClick={() => handleStatAction('rebounds', 1)}
        >
          <Shield size={24} />
          <span className="ml-2">Rebound</span>
        </button>
        <button 
          className="flex items-center justify-center p-4 bg-purple-500 text-white rounded"
          onClick={() => handleStatAction('steals', 1)}
        >
          <Zap size={24} />
          <span className="ml-2">Steal</span>
        </button>
        <button 
          className="flex items-center justify-center p-4 bg-red-500 text-white rounded"
          onClick={() => handleStatAction('fouls', 1)}
        >
          <RotateCw size={24} />
          <span className="ml-2">Foul</span>
        </button>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          className="p-4 bg-gray-200 rounded-full"
          onClick={() => {
            statStore.toggleGameClock();
            emitStatUpdate();
          }}
        >
          {statStore.isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button 
          className="p-4 bg-gray-200 rounded-full"
          onClick={() => {
            statStore.resetGameClock();
            emitStatUpdate();
          }}
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
};

export default StatPage;