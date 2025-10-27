import React from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { ResetIcon } from './icons/ResetIcon';

interface Props {
  time: number;
  isActive: boolean;
  onStartPause: () => void;
  onReset: () => void;
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const StopwatchWidget: React.FC<Props> = ({ time, isActive, onStartPause, onReset }) => {
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-cyan-200 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full">
      <span className="font-mono text-base text-white w-14 text-center">{formatTime(time)}</span>
      <button
        onClick={onStartPause}
        className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/80 hover:text-white transition-colors"
        aria-label={isActive ? 'Metti in pausa cronometro' : 'Avvia cronometro'}
      >
        {isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
      </button>
      <button
        onClick={onReset}
        className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/80 hover:text-white transition-colors"
        aria-label="Resetta cronometro"
      >
        <ResetIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default StopwatchWidget;
