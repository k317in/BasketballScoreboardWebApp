import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useScoreboardStore } from '../store/scoreboardStore';
import { useThursdayStore } from '../store/thursdayStore';
import { Users, Settings, BarChart3, MonitorPlay, Gamepad2, Calendar } from 'lucide-react';

interface NavigationProps {
  currentView: 'display' | 'team-settings' | 'game-settings' | 'stats' | 'controller' | 'login' | 'thursday';
  onViewChange: (view: 'display' | 'team-settings' | 'game-settings' | 'stats' | 'controller' | 'login' | 'tuesday') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { isTable } = useAuthStore();

  const navItems = [
    { id: 'display', icon: MonitorPlay, label: 'Scoreboard', requiresTable: false },
    { id: 'controller', icon: Gamepad2, label: 'Controller', requiresTable: true },
    { id: 'team-settings', icon: Users, label: 'Teams', requiresTable: true },
    { id: 'game-settings', icon: Settings, label: 'Settings', requiresTable: true },
    { id: 'thursday', icon: Calendar, label: 'Tuesday', requiresTable: true },
    { id: 'stats', icon: BarChart3, label: 'Stats', requiresTable: true }
  ] as const;

  return (
    <nav 
      className="fixed left-0 right-0 bg-gray-900 border-t border-gray-700 p-2 sm:p-4 z-50"
      style={{ 
        bottom: 'env(safe-area-inset-bottom)',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
          {navItems.map(({ id, icon: Icon, label, requiresTable }) => {
            const isVisible = !requiresTable || isTable;
            const isDisabled = requiresTable && !isTable;
            
            if (!isVisible) return null;
            
            return (
              <button
                key={id}
                onClick={() => !isDisabled && onViewChange(id)}
                className={`flex flex-col items-center gap-1 px-2 md:px-3 py-2 rounded-lg transition-colors whitespace-nowrap min-w-0 ${
                  currentView === id
                    ? 'bg-blue-600 text-white'
                    : isDisabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                disabled={isDisabled}
                title={requiresTable && !isTable ? 'Requires Table access' : ''}
              >
                <Icon size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:block text-xs sm:text-sm">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;