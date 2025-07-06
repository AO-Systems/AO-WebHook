import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { Webhook, User } from '../types';

interface WebhookFormProps {
  onSubmit: (webhookUrl: string, message: string, options?: { bypassLimit?: boolean }) => Promise<boolean>;
  isLoading: boolean;
  webhooks: Webhook[];
  user: User;
  onSetSelectedWebhook: (id: string | null) => void;
}

export const WebhookForm: React.FC<WebhookFormProps> = ({ onSubmit, isLoading, webhooks, user, onSetSelectedWebhook }) => {
  const [message, setMessage] = useState('');

  const FLAG_EMOJI = "🇺🇸";

  // Determine the currently selected webhook ID. Prioritize user's saved preference,
  // fallback to the first webhook in the list if preference is invalid or not set.
  let selectedId: string | null = null;
  if (user.selectedWebhookId && webhooks.some(wh => wh.id === user.selectedWebhookId)) {
      selectedId = user.selectedWebhookId;
  } else if (webhooks.length > 0) {
      selectedId = webhooks[0].id;
  }

  // Effect to automatically update the user's saved preference if the current selection
  // logic has to fall back to a default (e.g., after deleting the selected webhook).
  useEffect(() => {
      if (selectedId !== user.selectedWebhookId) {
          onSetSelectedWebhook(selectedId);
      }
  }, [selectedId, user.selectedWebhookId, onSetSelectedWebhook]);


  const selectedWebhookUrl = webhooks.find(wh => wh.id === selectedId)?.url || '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await onSubmit(selectedWebhookUrl, message);
    if (success) {
      setMessage('');
    }
  };

  const handlePostFlag = async () => {
    if (!selectedWebhookUrl) return;
    await onSubmit(selectedWebhookUrl, FLAG_EMOJI, { bypassLimit: true });
  };
  
  if (webhooks.length === 0) {
    return (
        <div className="p-6 md:p-8 text-center text-slate-400">
            <p>No webhooks configured.</p>
            <p>Please go to the 'Webhooks' page to add one first.</p>
        </div>
    );
  }

  return (
    <div className="p-6 md:p-8 border-b border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="webhook-select" className="block text-sm font-medium text-slate-300 mb-2">
            Select Webhook
          </label>
          <select
            id="webhook-select"
            name="webhook-select"
            value={selectedId || ''}
            onChange={(e) => onSetSelectedWebhook(e.target.value)}
            className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
            disabled={isLoading}
          >
            {webhooks.map(wh => (
                <option key={wh.id} value={wh.id}>
                    {wh.name}
                </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Enter your message here..."
            required
            disabled={isLoading}
          ></textarea>
        </div>

        <div className="flex justify-end items-center space-x-4">
          <button
            type="button"
            onClick={handlePostFlag}
            disabled={isLoading || !selectedWebhookUrl}
            className="inline-flex items-center justify-center px-6 py-2 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Posts an American flag emoji. This does not use your daily message limit."
          >
            Post Flag 🇺🇸
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedWebhookUrl || !message}
            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};