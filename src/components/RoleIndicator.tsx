import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, Eye, LogOut } from 'lucide-react';

interface RoleIndicatorProps {
  onLogin: () => void;
}

const RoleIndicator: React.FC<RoleIndicatorProps> = ({ onLogin }) => {
  const { user, isTable, logout } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-gray-700 rounded-lg">
        <Eye size={14} className="sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">Guest</span>
        <button
          onClick={onLogin}
          className="ml-1 sm:ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-gray-700 rounded-lg">
      {isTable ? <Users size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
      <span className="text-xs sm:text-sm font-medium">{user.name}</span>
      <span className="text-xs text-gray-400 hidden sm:inline">({isTable ? 'Table' : 'Guest'})</span>
      <button
        onClick={logout}
        className="ml-1 sm:ml-2 p-1 hover:bg-gray-600 rounded transition-colors"
        title="Logout"
      >
        <LogOut size={12} className="sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
};

export default RoleIndicator;