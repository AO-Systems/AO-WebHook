
import React, { useState } from 'react';
import { User } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

interface WebhookManagementProps {
    user: User;
    onAddWebhook: (name: string, url: string) => void;
    onRemoveWebhook: (id: string) => void;
}

export const WebhookManagement: React.FC<WebhookManagementProps> = ({ user, onAddWebhook, onRemoveWebhook }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && url.trim()) {
            onAddWebhook(name, url);
            setName('');
            setUrl('');
        }
    };

    const webhooks = user.webhooks || [];

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700 divide-y divide-slate-700">
            <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-3">
                    <Cog6ToothIcon className="h-7 w-7 text-blue-400" />
                    Webhook Management
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="webhook-name" className="block text-sm font-medium text-slate-300 mb-2">Webhook Name</label>
                        <input
                            type="text"
                            id="webhook-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., My Project Channel"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="webhook-url" className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
                        <input
                            type="url"
                            id="webhook-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://chat.googleapis.com/..."
                            required
                        />
                    </div>
                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={!name.trim() || !url.trim()}
                            className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            Add Webhook
                        </button>
                    </div>
                </form>
            </div>
            <div className="p-6 md:p-8">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Your Webhooks ({webhooks.length})</h3>
                {webhooks.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">You haven't added any webhooks yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {webhooks.map(wh => (
                            <li key={wh.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex justify-between items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-md font-semibold text-slate-200 truncate">{wh.name}</p>
                                    <p className="text-sm text-slate-400 font-mono truncate" title={wh.url}>{wh.url}</p>
                                </div>
                                <button
                                    onClick={() => onRemoveWebhook(wh.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                    aria-label={`Delete ${wh.name}`}
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
