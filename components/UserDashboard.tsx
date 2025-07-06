
import React, { useState } from 'react';
import { User, AppNotification, UserRequest, LogEntry, RequestStatus } from '../types';
import { MessageLog } from './MessageLog';
import { BanknotesIcon } from './icons/BanknotesIcon';
import { BellIcon } from './icons/BellIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';

interface UserDashboardProps {
    user: User;
    notifications: AppNotification[];
    requests: UserRequest[];
    logData: Record<string, LogEntry>;
    logOrder: string[];
    onPurchaseLimit: (cost: number, amount: number) => void;
    onSendRequest: (message: string) => void;
    onMarkNotificationsAsRead: () => void;
}

const LIMIT_PURCHASE_OPTIONS = [
    { amount: 50, cost: 20 },
    { amount: 300, cost: 100 },
];

const statusColorMap: Record<RequestStatus, string> = {
    pending: 'text-yellow-400 bg-yellow-900/50',
    approved: 'text-green-400 bg-green-900/50',
    denied: 'text-red-400 bg-red-900/50'
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, notifications, requests, logData, logOrder, onPurchaseLimit, onSendRequest, onMarkNotificationsAsRead }) => {
    const [requestMessage, setRequestMessage] = useState('');
    
    const handleSendRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestMessage.trim()) return;
        onSendRequest(requestMessage);
        setRequestMessage('');
    };

    const sortedNotifications = [...notifications].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const sortedRequests = [...requests].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-8">
            {/* Account Summary & Purchase Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700 divide-y divide-slate-700">
                <div className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-slate-100 mb-4">Account Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-sm text-slate-400">Message Usage</p>
                            <p className="text-2xl font-semibold text-slate-100">
                                {user.role === 'admin' ? <span className="text-green-400">Unlimited</span> : `${user.messageCount} / ${user.dailyLimit}`}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-sm text-slate-400">AO Credits</p>
                            <p className="text-2xl font-semibold text-amber-400 flex items-center justify-center space-x-2"><BanknotesIcon className="h-7 w-7"/> <span>{user.role === 'admin' ? 'Unlimited' : user.aocBalance}</span></p>
                        </div>
                         <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-sm text-slate-400">Account Status</p>
                            <p className={`text-2xl font-semibold ${user.isSuspended ? 'text-red-400' : 'text-green-400'}`}>{user.isSuspended ? 'Suspended' : 'Active'}</p>
                        </div>
                    </div>
                </div>
                 <div className="p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Purchase More Message Limits</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        {LIMIT_PURCHASE_OPTIONS.map(option => (
                            <div key={option.cost} className="flex-1 p-4 bg-slate-900/50 rounded-lg flex flex-col items-center justify-center text-center border border-slate-700">
                                <p className="text-xl font-bold text-slate-100">+{option.amount} Limit</p>
                                <p className="text-amber-400 font-semibold my-2">Cost: {option.cost} AOC</p>
                                <button
                                    onClick={() => onPurchaseLimit(option.cost, option.amount)}
                                    disabled={user.aocBalance < option.cost || user.role === 'admin'}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    Purchase
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notifications & Requests */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700">
                     <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-200 flex items-center space-x-2"><BellIcon className="h-6 w-6 text-blue-400" /><span>Notifications</span></h3>
                        <button onClick={onMarkNotificationsAsRead} className="text-xs text-blue-400 hover:underline">Mark all as read</button>
                    </div>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? <p className="text-slate-500 text-center py-4">No notifications.</p> : (
                            <ul className="space-y-4">
                                {sortedNotifications.map(n => (
                                    <li key={n.id} className={`p-3 rounded-lg border ${n.isRead ? 'border-slate-800 opacity-60' : 'border-slate-700 bg-slate-900/30'}`}>
                                        <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-slate-200'}`}>{n.message}</p>
                                        <p className="text-xs text-slate-500 mt-2">{new Date(n.timestamp).toLocaleString()} {!n.targetUserId && <span className="font-bold text-blue-500">(GLOBAL)</span>}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-200 flex items-center space-x-2"><ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" /><span>Admin Requests</span></h3>
                    </div>
                    <div className="p-6">
                         <form onSubmit={handleSendRequestSubmit} className="space-y-3 mb-6">
                            <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} rows={3} className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ask for help or request more AOC..."></textarea>
                            <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed">Send Request</button>
                        </form>
                        <h4 className="text-md font-semibold text-slate-300 mb-2">My Request History</h4>
                         <div className="max-h-60 overflow-y-auto">
                             {requests.length === 0 ? <p className="text-slate-500 text-center py-4">No requests sent.</p> : (
                                <ul className="space-y-3">
                                    {sortedRequests.map(req => (
                                        <li key={req.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm text-slate-300 break-all pr-2">"{req.message}"</p>
                                                <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${statusColorMap[req.status]}`}>{req.status}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">{new Date(req.timestamp).toLocaleString()}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Message Log Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700">
                <MessageLog logData={logData} logOrder={logOrder} />
            </div>
        </div>
    )
};
