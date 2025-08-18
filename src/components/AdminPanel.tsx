import React, { useState, useEffect } from 'react';
import { ref, get, set, remove, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Mail,
  Calendar,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: 'guest' | 'table' | 'pending';
  requestedRole?: 'guest' | 'table';
  createdAt: number;
}

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guest' | 'table' | 'pending'>('all');
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time listener for users
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: AdminUser[] = Object.entries(usersData).map(([uid, userData]: [string, any]) => ({
          uid,
          name: userData.name || 'Unknown',
          email: userData.email || 'No email',
          role: userData.role || 'guest',
          requestedRole: userData.requestedRole,
          createdAt: userData.createdAt || Date.now()
        }));
        
        // Sort by creation date (newest first)
        usersList.sort((a, b) => b.createdAt - a.createdAt);
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: AdminUser[] = Object.entries(usersData).map(([uid, userData]: [string, any]) => ({
          uid,
          name: userData.name || 'Unknown',
          email: userData.email || 'No email',
          role: userData.role || 'guest',
          requestedRole: userData.requestedRole,
          createdAt: userData.createdAt || Date.now()
        }));
        
        // Sort by creation date (newest first)
        usersList.sort((a, b) => b.createdAt - a.createdAt);
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (uid: string) => {
    setProcessingUsers(prev => new Set(prev).add(uid));
    
    try {
      await set(ref(database, `users/${uid}/role`), 'table');
      console.log(`Approved user ${uid} for table access`);
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  const rejectUser = async (uid: string) => {
    setProcessingUsers(prev => new Set(prev).add(uid));
    
    try {
      await set(ref(database, `users/${uid}/role`), 'guest');
      console.log(`Rejected user ${uid} table request`);
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Failed to reject user');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  const deleteUser = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setProcessingUsers(prev => new Set(prev).add(uid));
    
    try {
      await remove(ref(database, `users/${uid}`));
      console.log(`Deleted user ${uid}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  const changeUserRole = async (uid: string, newRole: 'guest' | 'table') => {
    setProcessingUsers(prev => new Set(prev).add(uid));
    
    try {
      await set(ref(database, `users/${uid}/role`), newRole);
      console.log(`Changed user ${uid} role to ${newRole}`);
    } catch (error) {
      console.error('Error changing user role:', error);
      setError('Failed to change user role');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'table': return 'text-green-400';
      case 'guest': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'table': return 'bg-green-600';
      case 'guest': return 'bg-blue-600';
      case 'pending': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const pendingCount = users.filter(u => u.role === 'pending').length;
  const tableCount = users.filter(u => u.role === 'table').length;
  const guestCount = users.filter(u => u.role === 'guest').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Shield size={32} className="text-red-500" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-400">User Management & Approvals</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-yellow-400" />
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-gray-400">Pending Approval</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UserCheck size={24} className="text-green-400" />
              <div>
                <div className="text-2xl font-bold">{tableCount}</div>
                <div className="text-sm text-gray-400">Table Users</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UserX size={24} className="text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{guestCount}</div>
                <div className="text-sm text-gray-400">Guest Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="pending">Pending</option>
                <option value="table">Table</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-800/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                        {user.requestedRole && user.requestedRole !== user.role && (
                          <span className="text-xs text-gray-400">
                            (Requested: {user.requestedRole})
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'pending' && (
                          <>
                            <button
                              onClick={() => approveUser(user.uid)}
                              disabled={processingUsers.has(user.uid)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs font-semibold transition-colors"
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectUser(user.uid)}
                              disabled={processingUsers.has(user.uid)}
                              className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded text-xs font-semibold transition-colors"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </>
                        )}
                        
                        {user.role === 'table' && (
                          <button
                            onClick={() => changeUserRole(user.uid, 'guest')}
                            disabled={processingUsers.has(user.uid)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs font-semibold transition-colors"
                          >
                            <UserX size={12} />
                            Make Guest
                          </button>
                        )}
                        
                        {user.role === 'guest' && (
                          <button
                            onClick={() => changeUserRole(user.uid, 'table')}
                            disabled={processingUsers.has(user.uid)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs font-semibold transition-colors"
                          >
                            <UserCheck size={12} />
                            Make Table
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteUser(user.uid)}
                          disabled={processingUsers.has(user.uid)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded text-xs font-semibold transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Users size={48} className="mx-auto mb-4" />
                <p>No users found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Instructions */}
        <div className="bg-gray-900 rounded-lg p-4 mt-6">
          <h3 className="font-semibold mb-2">Admin Instructions</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• <strong>Pending Users:</strong> Users who requested Table access and need approval</p>
            <p>• <strong>Table Users:</strong> Can create and control games, modify settings</p>
            <p>• <strong>Guest Users:</strong> Can only view scoreboards, cannot control games</p>
            <p>• <strong>Approve:</strong> Grant Table access to pending users</p>
            <p>• <strong>Reject:</strong> Convert pending users to Guest status</p>
            <p>• <strong>Delete:</strong> Permanently remove user accounts (cannot be undone)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;