import React, { useState } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';
import { LockClosedIcon } from './icons/LockClosedIcon.tsx';

interface LoginPageProps {
  onLogin: (uid: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
  const [uid, setUid] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (uid) {
      onLogin(uid);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-slate-900/50 p-3 rounded-full border-2 border-blue-500/50 mb-4">
              <LockClosedIcon className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-wider">AOS Bot Portal</h1>
            <p className="text-slate-400 text-sm">Authentication Required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="uid" className="block text-sm font-medium text-slate-300 mb-2">
                User ID (UID)
              </label>
              <input
                type="text"
                id="uid"
                name="uid"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="block w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., AOS-USER-12345"
                required
                disabled={isLoading}
                aria-describedby={error ? "uid-error" : undefined}
              />
               {error && (
                <p className="mt-2 text-sm text-red-400" id="uid-error">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !uid}
                className="w-full inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Authenticating...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>
         <footer className="text-center p-4 mt-4 text-xs text-slate-500">
            Enter your assigned UID to access the portal.
        </footer>
      </div>
    </div>
  );
};