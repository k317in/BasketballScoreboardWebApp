import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, Lock, Eye } from 'lucide-react';
import authConfig from '../config/auth.json';

interface LoginProps {
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple hardcoded credentials for MVP
    if (username === authConfig.username && password === authConfig.password) {
      login('table', 'Table');
      onBack();
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
  };

  const handleGuestAccess = () => {
    // Guest access - no login required
    onBack();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Basketball Scoreboard</h1>
            <p className="text-gray-400">Choose your access level</p>
          </div>

          {/* Guest Access */}
          <div className="mb-8">
            <button
              onClick={handleGuestAccess}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Eye size={24} />
              <div className="text-left">
                <div className="font-semibold">View as Guest</div>
                <div className="text-sm text-blue-200">Display-only mode</div>
              </div>
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">or</span>
            </div>
          </div>

          {/* Table Login */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={20} />
                <span className="font-semibold">Table Control Access</span>
              </div>
              <p className="text-sm text-gray-400">Login to control the scoreboard</p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
            >
              <Lock size={20} />
              Login as Table
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;