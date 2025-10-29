import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClockIcon } from './icons/ClockIcon';
import { PauseIcon } from './icons/PauseIcon';
import { PlayIcon } from './icons/PlayIcon';
import { ResetIcon } from './icons/ResetIcon';

interface Props {
  restTime: string; // e.g., "90s", "120-180s"
  isActive: boolean;
  onStart: () => void;
  onReset: () => void;
}

const parseRestTime = (restString: string) => {
  if (!restString) return { min: 60, max: 60 };
  const numbers = restString.match(/\d+/g)?.map(Number) || [60];
  if (numbers.length > 1) {
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  }
  return { min: numbers[0], max: numbers[0] };
};

const RestTimer: React.FC<Props> = ({ restTime, isActive, onStart, onReset }) => {
  const { min: minTime, max: maxTime } = useMemo(() => parseRestTime(restTime), [restTime]);

  const [timeLeft, setTimeLeft] = useState(maxTime);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const warningBeepPlayedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset timer state when it becomes inactive
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeLeft(maxTime);
      setIsPaused(false);
      warningBeepPlayedRef.current = false;
    }
  }, [isActive, maxTime]);

  const playNote = (audioCtx: AudioContext, freq: number, startTime: number, duration: number) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, startTime);

    // Fade in/out to avoid clicking noise
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const playSound = (type: 'warning' | 'end') => {
    if (typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
      return;
    }
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;
    if (audioCtx.state === 'suspended') return;

    if (type === 'warning') {
        playNote(audioCtx, 600, audioCtx.currentTime, 0.1); // Short, soft "tick"
    } else if (type === 'end') {
        const now = audioCtx.currentTime;
        playNote(audioCtx, 523, now, 0.15);       // C5 note
        playNote(audioCtx, 784, now + 0.2, 0.15); // G5 note, creating a pleasant chime
    }
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      const yellowThreshold = maxTime - minTime;
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev === yellowThreshold + 1 && !warningBeepPlayedRef.current) {
            playSound('warning');
            warningBeepPlayedRef.current = true;
          }
          if (prev <= 1) {
            playSound('end');
          }
          if (prev <= 0) {
             if (intervalRef.current) clearInterval(intervalRef.current);
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, minTime, maxTime]);

  const handleStart = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    onStart();
  };

  const handlePauseToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPaused(!isPaused);
  }

  const handleReset = (e: React.MouseEvent) => {
      e.stopPropagation();
      warningBeepPlayedRef.current = false;
      onReset();
  }
  
  const yellowThreshold = maxTime - minTime;
  const { colorClass, strokeClass } = useMemo(() => {
    if (timeLeft > yellowThreshold) return { colorClass: 'text-green-400', strokeClass: 'stroke-green-400' };
    if (timeLeft > 0) return { colorClass: 'text-yellow-400', strokeClass: 'stroke-yellow-400' };
    return { colorClass: 'text-red-500', strokeClass: 'stroke-red-500' };
  }, [timeLeft, yellowThreshold]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / maxTime) * circumference;

  const formatRestTimeRangeInMinutes = (min: number, max: number): string => {
    const minInMin = min / 60;
    const maxInMin = max / 60;

    const format = (num: number) => {
        return num % 1 === 0 ? num.toString() : num.toFixed(1).replace('.', ',');
    }

    if (minInMin === maxInMin) {
        return `${format(minInMin)} min`;
    }
    return `${format(minInMin)}-${format(maxInMin)} min`;
  };

  if (!isActive) {
    return (
      <button 
        onClick={handleStart}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
      >
        <ClockIcon className="w-5 h-5" />
        <span className="text-sm">{formatRestTimeRangeInMinutes(minTime, maxTime)}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`relative w-20 h-9 flex items-center justify-center rounded-lg bg-slate-800/60`}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
            <circle className="stroke-slate-600/50" strokeWidth="3" fill="transparent" r={radius} cx="18" cy="18" />
            <circle
            className={`${strokeClass} transition-all duration-500`}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx="18"
            cy="18"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
        </svg>
        <span className={`relative z-10 font-mono text-sm font-bold ${colorClass}`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col gap-1">
         <button onClick={handlePauseToggle} className="p-1 rounded-full text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">
            {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
         </button>
         <button onClick={handleReset} className="p-1 rounded-full text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">
            <ResetIcon className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};

export default RestTimer;