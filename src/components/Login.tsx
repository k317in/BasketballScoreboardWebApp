import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, Lock, Eye, UserPlus, Mail, User, Shield } from 'lucide-react';

interface LoginProps {
  onBack: () => void;
  setCurrentView?: (view: string) => void;
}

const Login: React.FC<LoginProps> = ({ onBack, setCurrentView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [requestedRole, setRequestedRole] = useState<'guest' | 'table'>('guest');
  const { login, signup, loading, error, clearError } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      onBack();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signup(email, password, name, requestedRole);
      onBack();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleGuestAccess = () => {
    // For now, redirect to signup as guest
    setIsSignup(true);
    setRequestedRole('guest');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRequestedRole('guest');
    clearError();
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    resetForm();
  };

  const handleSubmit = isSignup ? handleSignup : handleLogin;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">{isSignup ? 'Creating account...' : 'Signing in...'}</p>
        </div>
      </div>
    );
  }

  const handleDemoAccess = () => {
    // For demo purposes, create a guest account with demo credentials
    setEmail('demo@example.com');
    setPassword('demo123');
    setName('Demo User');
    setIsSignup(true);
    setRequestedRole('guest');
    onBack();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Basketball Scoreboard</h1>
            <p className="text-gray-400">
              {isSignup ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>

          {/* Quick Demo Access */}
          <div className="mb-8">
            <button
              onClick={handleDemoAccess}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Eye size={24} />
              <div className="text-left">
                <div className="font-semibold">Quick Demo Access</div>
                <div className="text-sm text-blue-200">Try the app as a guest</div>
              </div>
            </button>
          </div>

          {/* Admin Access */}
          <div className="mb-4 text-center">
            <button
              onClick={() => {
                if (setCurrentView) {
                  setCurrentView('admin-login');
                } else {
                  console.warn('setCurrentView not available');
                }
              }}
              className="text-gray-400 hover:text-gray-300 text-xs underline"
            >
              Admin Access
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

          {/* Login/Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-4">
              {isSignup ? (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <UserPlus size={20} />
                  <span className="font-semibold">Create Account</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock size={20} />
                  <span className="font-semibold">Sign In</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-3">Account Type</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="guest"
                      checked={requestedRole === 'guest'}
                      onChange={(e) => setRequestedRole(e.target.value as 'guest')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex items-center gap-2">
                      <Eye size={20} className="text-blue-400" />
                      <div>
                        <div className="font-medium">Guest Account</div>
                        <div className="text-sm text-gray-400">View scoreboards only</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="table"
                      checked={requestedRole === 'table'}
                      onChange={(e) => setRequestedRole(e.target.value as 'table')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex items-center gap-2">
                      <Shield size={20} className="text-yellow-400" />
                      <div>
                        <div className="font-medium">Table Access</div>
                        <div className="text-sm text-gray-400">Create and control games (requires approval)</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors font-semibold"
            >
              {isSignup ? <UserPlus size={20} /> : <Lock size={20} />}
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              {isSignup 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;