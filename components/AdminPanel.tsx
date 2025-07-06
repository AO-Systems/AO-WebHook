
import React, { useState } from 'react';
import { User, UserRole, UserRequest, RequestStatus } from '../types';
import { BellIcon } from './icons/BellIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';

interface AdminPanelProps {
    users: User[];
    onAddUser: (uid: string) => void;
    onRemoveUser: (uid: string) => void;
    onUpdateUser: (uid: string, updates: Partial<Omit<User, 'id'>>) => void;
    onViewLogs: (user: User) => void;
    currentUser: User;
    requests: UserRequest[];
    onResolveRequest: (requestId: string, status: RequestStatus) => void;
    onSendNotification: (message: string, targetUserId?: string) => void;
}

const statusColorMap: Record<RequestStatus, string> = {
    pending: 'text-yellow-400 bg-yellow-900/50',
    approved: 'text-green-400 bg-green-900/50',
    denied: 'text-red-400 bg-red-900/50'
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onRemoveUser, onUpdateUser, onViewLogs, currentUser, requests, onResolveRequest, onSendNotification }) => {
    const [newUserId, setNewUserId] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationTargetId, setNotificationTargetId] = useState('');
    const [balanceChanges, setBalanceChanges] = useState<Record<string, string>>({});

    const handleAddUserSubmit = (e: React.FormEvent) => { e.preventDefault(); onAddUser(newUserId); setNewUserId(''); };
    const handleSendNotification = (e: React.FormEvent) => {
        e.preventDefault();
        if (!notificationMessage) return;
        onSendNotification(notificationMessage, notificationTargetId || undefined);
        setNotificationMessage('');
        setNotificationTargetId('');
    };

    const handleBalanceChange = (uid: string, value: string) => {
        if (/^\d*$/.test(value)) {
            setBalanceChanges(prev => ({ ...prev, [uid]: value }));
        }
    };
    
    const handleModifyBalance = (uid: string, isAdding: boolean) => {
        const user = users.find(u => u.id === uid);
        const amountStr = balanceChanges[uid];
        
        if (!user || !amountStr) return;
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount <= 0) return;

        const newBalance = isAdding ? user.aocBalance + amount : user.aocBalance - amount;
        onUpdateUser(uid, { aocBalance: Math.max(0, newBalance) });
        setBalanceChanges(prev => ({...prev, [uid]: ''}));
    };
    
    const sortedUsers = [...users].sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.id.localeCompare(b.id);
    });

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const resolvedRequests = requests.filter(r => r.status !== 'pending');


    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700 divide-y divide-slate-700">
            <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-100 mb-4">User Management</h2>
                <form onSubmit={handleAddUserSubmit} className="flex items-end space-x-4">
                    <div className="flex-grow">
                        <label htmlFor="new-uid" className="block text-sm font-medium text-slate-300 mb-2">New User ID (UID)</label>
                        <input type="text" id="new-uid" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., AOS-NEW-4567" />
                    </div>
                    <button type="submit" disabled={!newUserId} className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
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
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User ID</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Suspended</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">AOC Balance</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Daily Limit</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usage Today</th>
                                <th className="relative px-3 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {sortedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/30">
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-200 font-mono">{user.id}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-400">
                                       <select value={user.role} onChange={(e) => onUpdateUser(user.id, { role: e.target.value as UserRole })} disabled={user.id === currentUser.id} className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700">
                                            <option value="user">user</option><option value="admin">admin</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <label htmlFor={`suspend-${user.id}`} className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id={`suspend-${user.id}`} className="sr-only peer" checked={user.isSuspended} onChange={(e) => onUpdateUser(user.id, { isSuspended: e.target.checked })} disabled={user.id === currentUser.id} />
                                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-disabled:opacity-50"></div>
                                        </label>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {user.role === 'admin' ? (
                                            <span className="text-amber-400 font-semibold px-2 py-1">Unlimited</span>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <span className="w-16 text-right font-mono text-amber-400 tabular-nums">{user.aocBalance}</span>
                                                <input
                                                    type="text"
                                                    pattern="[0-9]*"
                                                    inputMode="numeric"
                                                    value={balanceChanges[user.id] || ''}
                                                    onChange={(e) => handleBalanceChange(user.id, e.target.value)}
                                                    className="w-20 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Amount"
                                                />
                                                <button
                                                    onClick={() => handleModifyBalance(user.id, true)}
                                                    className="px-2 py-1 text-sm font-bold rounded bg-green-600/80 hover:bg-green-600 text-white disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    disabled={!balanceChanges[user.id] || parseInt(balanceChanges[user.id] || '0', 10) <= 0}
                                                    title="Add AOC"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => handleModifyBalance(user.id, false)}
                                                    className="px-2 py-1 text-sm font-bold rounded bg-red-600/80 hover:bg-red-600 text-white disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="Subtract AOC"
                                                    disabled={!balanceChanges[user.id] || parseInt(balanceChanges[user.id] || '0', 10) <= 0}
                                                >
                                                    -
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-400">
                                        <input type="number" value={user.dailyLimit} onChange={(e) => onUpdateUser(user.id, { dailyLimit: parseInt(e.target.value, 10) || 0 })} className="w-20 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700" disabled={user.role === 'admin'} />
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {user.role === 'admin' ? <span className="text-green-400 font-semibold">Unlimited</span> : `${user.messageCount} / ${user.dailyLimit}`}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => onViewLogs(user)} className="text-blue-500 hover:text-blue-400 disabled:text-slate-600 disabled:cursor-not-allowed" disabled={user.role === 'admin'}>View Logs</button>
                                        <button onClick={() => onRemoveUser(user.id)} className="text-red-500 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed" disabled={user.id === currentUser.id}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-6 md:p-8">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center space-x-2"><ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" /><span>User Requests ({pendingRequests.length} pending)</span></h3>
                {requests.length === 0 ? <p className="text-slate-500">No user requests.</p> : (
                    <ul className="space-y-4">
                        {pendingRequests.map(req => (
                            <li key={req.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">From: <span className="font-mono">{req.fromUserId}</span></p>
                                        <p className="text-sm text-slate-400 mt-1">Message: "{req.message}"</p>
                                        <p className="text-xs text-slate-500 mt-2">{new Date(req.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <button onClick={() => onResolveRequest(req.id, 'approved')} className="px-3 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Approve</button>
                                        <button onClick={() => onResolveRequest(req.id, 'denied')} className="px-3 py-1 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Deny</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {resolvedRequests.map(req => (
                             <li key={req.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 opacity-60">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">From: <span className="font-mono">{req.fromUserId}</span></p>
                                        <p className="text-sm text-slate-400 mt-1">Message: "{req.message}"</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColorMap[req.status]}`}>{req.status}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-6 md:p-8">
                 <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center space-x-2"><BellIcon className="h-6 w-6 text-blue-400" /><span>Send Notification</span></h3>
                 <form onSubmit={handleSendNotification} className="space-y-4">
                     <div>
                        <label htmlFor="notif-msg" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                        <textarea id="notif-msg" rows={3} value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
                     </div>
                     <div>
                        <label htmlFor="notif-target" className="block text-sm font-medium text-slate-300 mb-2">Target User ID (optional)</label>
                        <input type="text" id="notif-target" value={notificationTargetId} onChange={e => setNotificationTargetId(e.target.value)} className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Leave blank to notify all users"/>
                     </div>
                     <div className="text-right">
                        <button type="submit" disabled={!notificationMessage} className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Send Notification
                        </button>
                     </div>
                 </form>
            </div>
        </div>
    );
};
