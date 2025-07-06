import React from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { UsersIcon } from './icons/UsersIcon';
import { User } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { BanknotesIcon } from './icons/BanknotesIcon';
import { BellIcon } from './icons/BellIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { AOSIcon } from './icons/AOSIcon';


interface HeaderProps {
  onLogout?: () => void;
  user: User;
  onSetView: (view: 'main' | 'admin' | 'dashboard' | 'webhooks') => void;
  currentView: 'main' | 'admin' | 'dashboard' | 'webhooks';
  unreadNotificationCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, user, onSetView, currentView, unreadNotificationCount }) => {

  const NavButton = ({
    view,
    label,
    icon,
  }: {
    view: 'main' | 'admin' | 'dashboard' | 'webhooks';
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      onClick={() => onSetView(view)}
      className={`group relative flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        currentView === view
          ? 'bg-slate-700/50 text-white'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
      }`}
      aria-current={currentView === view ? 'page' : undefined}
      title={label} // Tooltip for small screens
    >
      {icon}
      <span className="hidden md:inline md:ml-2">{label}</span>
    </button>
  );

  return (
    <header className="bg-slate-800/70 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-700">
      <div className="flex items-center justify-between p-4">
        {/* Left side: Logo and Title */}
        <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
          <button onClick={() => onSetView('main')} className="flex items-center space-x-3" aria-label="Go to main page">
              <AOSIcon className="h-8 w-8" aria-hidden="true" />
              <span className="font-bold text-xl text-slate-100 tracking-wider">AOS</span>
          </button>
        </div>

        {/* Center: Navigation */}
        <nav className="flex-grow flex items-center justify-center space-x-1 md:space-x-2" aria-label="Main navigation">
          <NavButton view="main" label="Send" icon={<PaperAirplaneIcon className="h-5 w-5" />} />
          <NavButton view="dashboard" label="Dashboard" icon={<DashboardIcon className="h-5 w-5" />} />
          <NavButton view="webhooks" label="Webhooks" icon={<Cog6ToothIcon className="h-5 w-5" />} />
          {user.role === 'admin' && (
            <NavButton view="admin" label="Admin" icon={<UsersIcon className="h-5 w-5" />} />
          )}
        </nav>

        {/* Right side: User Info & Logout */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onSetView('dashboard')}
            className="group relative flex items-center text-slate-400 hover:text-white transition-colors"
            title={`${unreadNotificationCount} unread notifications`}
            aria-label={`${unreadNotificationCount} unread notifications. Click to view dashboard.`}
          >
            <BellIcon className="h-6 w-6" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white" aria-hidden="true">
                {unreadNotificationCount}
              </span>
            )}
          </button>
          
          <div className="hidden sm:flex items-center space-x-2">
             <div className="text-right">
                <p className="text-sm font-medium text-slate-200 truncate" title={user.id}>{user.id}</p>
                <div className="flex items-center justify-end space-x-2">
                  {user.role === 'admin' && <span className="hidden xs:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">Admin</span>}
                  <span className="flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400">
                    <BanknotesIcon className="h-4 w-4 mr-1"/>
                    {user.role === 'admin' ? '∞' : user.aocBalance}
                  </span>
                </div>
             </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="group relative flex items-center justify-center rounded-md p-2 text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
