
import React from 'react';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface HeaderProps {
    userName: string;
    onLogout: () => void;
    onHistoryClick: () => void;
    onProgressClick: () => void;
    onGuideClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout, onHistoryClick, onProgressClick, onGuideClick }) => {
  return (
    <header className="py-6 print:hidden">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <DumbbellIcon className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
            <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                IArnold
            </h1>
            <p className="text-md md:text-lg font-medium text-slate-300 -mt-1">
                Ciao, <span className="font-bold text-cyan-400">{userName}</span>!
            </p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button
                onClick={onGuideClick}
                className="p-2 text-slate-300 hover:text-cyan-300 transition-colors"
                aria-label="Apri la guida rapida"
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={onProgressClick}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-300 bg-cyan-900/50 rounded-full hover:bg-cyan-900/80 transition-colors"
                aria-label="Visualizza i miei progressi"
            >
                <ChartBarIcon className="w-5 h-5" />
                <span className="hidden md:inline">I miei progressi</span>
            </button>
            <button 
                onClick={onHistoryClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-300 bg-cyan-900/50 rounded-full hover:bg-cyan-900/80 transition-colors"
                aria-label="Visualizza le mie schede"
            >
                <HistoryIcon className="w-5 h-5" />
                <span className="hidden md:inline">Le mie schede</span>
            </button>
            <button
                onClick={onLogout}
                className="p-2 text-slate-300 hover:text-red-400 transition-colors"
                aria-label="Esci"
            >
                <LogoutIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
