import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';

interface AdminPanelProps {
    users: User[];
    onAddUser: (uid: string) => void;
    onRemoveUser: (uid: string) => void;
    onUpdateUser: (uid: string, updates: Partial<Omit<User, 'id'>>) => void;
    onViewLogs: (user: User) => void;
    currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onRemoveUser, onUpdateUser, onViewLogs, currentUser }) => {
    const [newUserId, setNewUserId] = useState('');

    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddUser(newUserId);
        setNewUserId('');
    };
    
    const sortedUsers = users.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.id.localeCompare(b.id);
    });

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700 divide-y divide-slate-700">
            <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-100 mb-4">User Management</h2>
                <form onSubmit={handleAddUserSubmit} className="flex items-end space-x-4">
                    <div className="flex-grow">
                        <label htmlFor="new-uid" className="block text-sm font-medium text-slate-300 mb-2">New User ID (UID)</label>
                        <input
                            type="text"
                            id="new-uid"
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="e.g., AOS-NEW-4567"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newUserId}
                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        Add User
                    </button>
                </form>
            </div>

            <div className="p-6 md:p-8">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">All Users ({users.length})</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User ID</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Suspended</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Daily Limit</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usage Today</th>
                                <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {sortedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-200 font-mono">{user.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">
                                       <select
                                            value={user.role}
                                            onChange={(e) => onUpdateUser(user.id, { role: e.target.value as UserRole })}
                                            disabled={user.id === currentUser.id}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                                        >
                                            <option value="user">user</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <label htmlFor={`suspend-${user.id}`} className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`suspend-${user.id}`}
                                                className="sr-only peer"
                                                checked={user.isSuspended}
                                                onChange={(e) => onUpdateUser(user.id, { isSuspended: e.target.checked })}
                                                disabled={user.id === currentUser.id}
                                            />
                                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-disabled:opacity-50"></div>
                                        </label>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">
                                        <input
                                            type="number"
                                            value={user.dailyLimit}
                                            onChange={(e) => onUpdateUser(user.id, { dailyLimit: parseInt(e.target.value, 10) || 0 })}
                                            className="w-20 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                                            disabled={user.role === 'admin'}
                                        />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{user.messageCount} / {user.dailyLimit}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button
                                            onClick={() => onViewLogs(user)}
                                            className="text-blue-500 hover:text-blue-400 disabled:text-slate-600 disabled:cursor-not-allowed"
                                            disabled={user.role === 'admin'}
                                            aria-label={`View logs for user ${user.id}`}
                                        >
                                            View Logs
                                        </button>
                                        <button
                                            onClick={() => onRemoveUser(user.id)}
                                            className="text-red-500 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed"
                                            disabled={user.id === currentUser.id}
                                            aria-label={`Remove user ${user.id}`}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};