import React, { useMemo } from 'react';
import { HistoryEntry } from '../types';
import { FireIcon } from './icons/FireIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface Props {
  userName: string;
  history: HistoryEntry[];
  onStartWorkout: (entry: HistoryEntry) => void;
  onNewPlan: () => void;
}

const parseNumericValue = (value: string): number => {
  if (!value) return 0;
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const Dashboard: React.FC<Props> = ({ userName, history, onStartWorkout, onNewPlan }) => {
  const latestWorkout = history.length > 0 ? history[0] : null;

  const { streak, personalRecords } = useMemo(() => {
    // Calculate streak (workouts in the last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentWorkouts = history.filter(entry => new Date(entry.createdAt) > oneWeekAgo && entry.trackedData && Object.keys(entry.trackedData).length > 0);
    
    // Calculate Personal Records
    const records: { [key: string]: number } = {};
    const keyExercises = ['panca piana', 'squat', 'stacco', 'military press', 'trazioni', 'rematore'];
    
    history.forEach(entry => {
        if (entry.trackedData && entry.plan && entry.plan.plan) {
            Object.entries(entry.trackedData).forEach(([dayIndex, dayData]) => {
                Object.entries(dayData).forEach(([exIndex, exData]) => {
                    const exerciseName = entry.plan.plan[parseInt(dayIndex)]?.exercises[parseInt(exIndex)]?.name.toLowerCase();
                    if (exerciseName && keyExercises.some(keyEx => exerciseName.includes(keyEx))) {
                        const weight = parseNumericValue(exData.weight);
                        if (weight > (records[exerciseName] || 0)) {
                            records[exerciseName] = weight;
                        }
                    }
                });
            });
        }
    });

    const topRecords = Object.entries(records)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, weight]) => ({ name, weight }));

    return { streak: recentWorkouts.length, personalRecords: topRecords };
  }, [history]);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">Bentornato, <span className="text-cyan-400">{userName}</span>!</h1>
        <p className="text-slate-400 mt-1">Pronto a superare i tuoi limiti oggi?</p>
      </div>

      {/* Next Workout Card */}
      {latestWorkout ? (
        <div className="p-6 bg-gradient-to-br from-cyan-900/50 to-slate-900/50 backdrop-blur-sm border border-cyan-700/50 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-1 font-display">IL TUO PROSSIMO ALLENAMENTO</h2>
          <p className="text-cyan-200 mb-4">{latestWorkout.plan.title.mainTitle} - {latestWorkout.plan.title.subtitle}</p>
          <button
            onClick={() => onStartWorkout(latestWorkout)}
            className="w-full sm:w-auto px-8 py-3 bg-cyan-500 text-slate-900 font-bold text-lg rounded-lg hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40"
          >
            Inizia Ora
          </button>
        </div>
      ) : (
         <div className="p-6 bg-gradient-to-br from-amber-900/50 to-slate-900/50 backdrop-blur-sm border border-amber-700/50 rounded-xl text-center">
            <h2 className="text-xl font-bold text-white mb-2 font-display">INIZIA IL TUO PERCORSO</h2>
            <p className="text-amber-200 mb-4">Non hai ancora una scheda di allenamento. Creane una ora con l'IA!</p>
            <button
                onClick={onNewPlan}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 text-slate-900 font-bold text-lg rounded-lg hover:bg-amber-300 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40"
            >
                <SparklesIcon className="w-6 h-6" />
                Crea la mia prima scheda
            </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak */}
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl flex items-center gap-4">
          <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full ${streak > 0 ? 'bg-amber-500/10 border-2 border-amber-500/50' : 'bg-slate-700/50'}`}>
            <FireIcon className={`w-8 h-8 ${streak > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg font-display">SERIE VINCENTE</h3>
            <p className="text-3xl font-bold text-amber-400">{streak} <span className="text-lg text-slate-300 font-medium">allenamenti</span></p>
            <p className="text-sm text-slate-400">negli ultimi 7 giorni</p>
          </div>
        </div>

        {/* Personal Records */}
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full bg-cyan-500/10 border-2 border-cyan-500/50">
                    <TrophyIcon className="w-8 h-8 text-cyan-400" />
                </div>
                 <div>
                    <h3 className="font-bold text-white text-lg font-display">RECORD PERSONALI</h3>
                    <p className="text-sm text-slate-400">I tuoi migliori sollevamenti registrati</p>
                </div>
            </div>
          {personalRecords.length > 0 ? (
            <ul className="space-y-2">
              {personalRecords.map(rec => (
                <li key={rec.name} className="flex justify-between items-baseline p-2 bg-slate-900/50 rounded-md">
                  <span className="text-slate-300 capitalize text-sm">{rec.name.replace(/ con bilanciere| con manubri| alla macchina/g, '')}</span>
                  <span className="font-bold text-white text-lg">{rec.weight} kg</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-400 text-sm py-4">Registra i tuoi allenamenti per vedere qui i tuoi record!</p>
          )}
        </div>
      </div>
      
       {latestWorkout && (
         <div className="text-center">
            <button onClick={onNewPlan} className="text-slate-400 hover:text-cyan-400 font-semibold transition-colors">
                o crea una nuova scheda da zero
            </button>
         </div>
       )}
    </div>
  );
};

export default Dashboard;
