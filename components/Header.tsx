import React from 'react';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { ShareAppIcon } from './icons/ShareAppIcon';

interface HeaderProps {
    userName: string;
    onLogout: () => void;
    onHistoryClick: () => void;
    onProgressClick: () => void;
    onGuideClick: () => void;
    onHomeClick: () => void;
    onShareClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    userName, 
    onLogout, 
    onHistoryClick, 
    onProgressClick, 
    onGuideClick, 
    onHomeClick, 
    onShareClick,
}) => {
  return (
    <header className="py-6 print:hidden">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <button onClick={onHomeClick} className="flex items-center gap-4 text-left">
            <DumbbellIcon className="w-10 h-10 md:w-12 md:h-12 text-cyan-400" />
            <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                IArnold
            </h1>
            <p className="text-md md:text-lg font-medium text-slate-300 -mt-1">
                Ciao, <span className="font-bold text-cyan-400">{userName}</span>!
            </p>
            </div>
        </button>
        
        <div className="flex items-center gap-1 sm:gap-2">
            <button
                onClick={onProgressClick}
                className="inline-flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-semibold text-cyan-200 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full hover:bg-slate-700/80 hover:text-white transition-colors"
                aria-label="Visualizza i miei progressi"
            >
                <ChartBarIcon className="w-5 h-5" />
                <span className="hidden sm:inline font-display tracking-wider">PROGRESSI</span>
            </button>
            <button 
                onClick={onHistoryClick}
                className="inline-flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-semibold text-cyan-200 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full hover:bg-slate-700/80 hover:text-white transition-colors"
                aria-label="Visualizza le mie schede"
            >
                <HistoryIcon className="w-5 h-5" />
                <span className="hidden sm:inline font-display tracking-wider">SCHEDE</span>
            </button>
             <button
                onClick={onShareClick}
                className="p-2 text-slate-400 hover:text-cyan-300 transition-colors"
                aria-label="Condividi l'app"
            >
                <ShareAppIcon className="w-6 h-6" />
            </button>
             <button
                onClick={onGuideClick}
                className="p-2 text-slate-400 hover:text-cyan-300 transition-colors"
                aria-label="Apri la guida rapida"
            >
                <QuestionMarkCircleIcon className="w-6 h-6" />
            </button>
            <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                aria-label="Esci"
            >
                <LogoutIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;