import React from 'react';
import { AOSIcon } from './icons/AOSIcon';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="relative flex items-center justify-center">
        {/* The static track for the spinner */}
        <div className="absolute w-40 h-40 rounded-full border-4 border-slate-700"></div>
        
        {/* The animated part of the spinner */}
        <div className="absolute w-40 h-40 rounded-full border-t-4 border-t-blue-500 animate-spin"></div>
        
        {/* The Icon in the center */}
        <AOSIcon className="w-28 h-28" />
      </div>
    </div>
  );
};
