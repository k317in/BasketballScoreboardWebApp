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