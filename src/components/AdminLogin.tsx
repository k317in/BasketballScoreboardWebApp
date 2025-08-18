import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onAdminLogin: () => void;
  onBack: () => void;
}

// Admin credentials (in production, this should be more secure)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const AdminLogin: React.FC<AdminLoginProps> = ({ onAdminLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onAdminLogin();
    } else {
      setError('Invalid admin credentials');
    }
    
    setLoading(false);
  };

  const handleDemoFill = () => {
    setUsername(ADMIN_CREDENTIALS.username);
    setPassword(ADMIN_CREDENTIALS.password);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield size={32} className="text-red-500" />
              <h1 className="text-3xl font-bold">Admin Login</h1>
            </div>
            <p className="text-gray-400">
              Access the admin panel to manage users and approvals
            </p>
          </div>

          {/* Demo Credentials Info */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">Demo Admin Credentials</span>
            </div>
            <div className="text-sm text-blue-200 space-y-1">
              <div>Username: <code className="bg-blue-800 px-1 rounded">admin</code></div>
              <div>Password: <code className="bg-blue-800 px-1 rounded">admin123</code></div>
            </div>
            <button
              onClick={handleDemoFill}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Click to auto-fill credentials
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Admin Username</label>
              <div className="relative">
                <Shield size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Admin Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Shield size={20} />
              )}
              {loading ? 'Authenticating...' : 'Login as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-300 text-sm underline"
            >
              Back to User Login
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400">Security Notice</span>
            </div>
            <p className="text-xs text-yellow-200">
              In production, admin credentials should be stored securely and use proper authentication methods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;