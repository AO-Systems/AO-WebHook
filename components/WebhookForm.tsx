
import React, { useState } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface WebhookFormProps {
  onSubmit: (webhookUrl: string, message: string, options?: { bypassLimit?: boolean }) => Promise<boolean>;
  isLoading: boolean;
}

export const WebhookForm: React.FC<WebhookFormProps> = ({ onSubmit, isLoading }) => {
  const [webhookUrl, setWebhookUrl] = useState('https://chat.googleapis.com/v1/spaces/AAQAZG7QKVM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=bmR_utsCYWVrdI6x0jP9WngfmhGBoDvogPLUFzp7f_g');
  const [message, setMessage] = useState('');

  const FLAG_EMOJI = "🇺🇸";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await onSubmit(webhookUrl, message);
    if (success) {
      setMessage('');
    }
  };

  const handlePostFlag = async () => {
    await onSubmit(webhookUrl, FLAG_EMOJI, { bypassLimit: true });
  };

  return (
    <div className="p-6 md:p-8 border-b border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="webhookUrl" className="block text-sm font-medium text-slate-300 mb-2">
            Webhook URL
          </label>
          <input
            type="url"
            id="webhookUrl"
            name="webhookUrl"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="https://chat.googleapis.com/..."
            required
            disabled={isLoading}
          />
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
            disabled={isLoading || !webhookUrl}
            className="inline-flex items-center justify-center px-6 py-2 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Posts an American flag emoji. This does not use your daily message limit."
          >
            Post Flag 🇺🇸
          </button>
          <button
            type="submit"
            disabled={isLoading || !webhookUrl || !message}
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
