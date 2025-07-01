import React from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { UsersIcon } from './icons/UsersIcon';
import { User } from '../types';

interface HeaderProps {
  onLogout?: () => void;
  user: User;
  onToggleView: (view: 'main' | 'admin') => void;
  currentView: 'main' | 'admin';
}

export const Header: React.FC<HeaderProps> = ({ onLogout, user, onToggleView, currentView }) => {
  const navItemClasses = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500";
  const activeNavItemClasses = "bg-slate-700 text-white";
  const inactiveNavItemClasses = "text-slate-300 hover:bg-slate-700 hover:text-white";

  return (
    <header className="bg-slate-800/70 backdrop-blur-md sticky top-0 z-10 border-b-2 border-blue-500/50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button onClick={() => onToggleView('main')} className="flex items-center space-x-3 group">
                <PaperAirplaneIcon className="h-8 w-8 text-blue-400 group-hover:animate-pulse" />
                <h1 className="text-2xl font-bold text-slate-100 tracking-wider">
                  AOS Bot Portal
                </h1>
            </button>
            {user.role === 'admin' && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    Admin
                </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {user.role === 'admin' && (
              <button
                onClick={() => onToggleView('admin')}
                className={`${navItemClasses} ${currentView === 'admin' ? activeNavItemClasses : inactiveNavItemClasses}`}
                aria-label="Manage Users"
              >
                <UsersIcon className="h-5 w-5" />
                <span>Manage Users</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className={`${navItemClasses} ${inactiveNavItemClasses}`}
                aria-label="Logout"
              >
                <LogoutIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
