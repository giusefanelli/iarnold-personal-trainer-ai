
import React, { useState, useMemo } from 'react';
import { HistoryEntry, UserData } from '../types';
import { TargetIcon } from './icons/TargetIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface Props {
  history: HistoryEntry[];
  userData: UserData | null;
  onGoBack: () => void;
}

// --- Helper functions for data processing ---
const parseNumericValue = (value: string): number => {
  if (!value) return 0;
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const parseRange = (range: string): number => {
  if (!range || typeof range !== 'string') return 0;
  if (range.includes('-')) {
    const parts = range.split('-').map(s => parseInt(s.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2;
    }
  }
  const singleVal = parseInt(range.trim(), 10);
  return isNaN(singleVal) ? 0 : singleVal;
};

const KpiCard = ({ title, value, icon, subValue }: { title: string; value: string; icon: React.ReactNode, subValue?: string }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-cyan-900/50 rounded-lg text-cyan-400">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{subValue}</p>}
    </div>
  </div>
);


const Progress: React.FC<Props> = ({ history, userData, onGoBack }) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  const trackedHistory = useMemo(() => history.filter(entry => entry.trackedData && Object.keys(entry.trackedData).length > 0).reverse(), [history]);

  const uniqueExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    trackedHistory.forEach(entry => {
      entry.plan.plan.forEach(day => {
        day.exercises.forEach(ex => {
          exerciseSet.add(ex.name);
        });
      });
    });
    return Array.from(exerciseSet).sort();
  }, [trackedHistory]);

  const { consistency, bestImprover, volumeStats, calorieStats } = useMemo(() => {
    // Consistency KPI
    const totalGenerated = history.length;
    const completedWorkouts = trackedHistory.length;
    const skippedWorkouts = totalGenerated - completedWorkouts;
    const successRate = totalGenerated > 0 ? Math.round((completedWorkouts / totalGenerated) * 100) : 0;
    
    // Best Improver KPI
    let bestExercise: { name: string; improvement: number; start: number; end: number; } | null = null;
    if (trackedHistory.length > 1) {
        uniqueExercises.forEach(exName => {
            const progress = trackedHistory.map(entry => {
                let weight = 0;
                 entry.plan.plan.forEach((day, dayIndex) => {
                    day.exercises.forEach((ex, exIndex) => {
                        if (ex.name === exName) {
                            const trackedWeight = entry.trackedData?.[dayIndex]?.[exIndex]?.weight;
                            if (trackedWeight) {
                                weight = Math.max(weight, parseNumericValue(trackedWeight));
                            }
                        }
                    });
                });
                return weight > 0 ? weight : null;
            }).filter(Boolean) as number[];

            if (progress.length > 1) {
                const startWeight = progress[0];
                const endWeight = progress[progress.length - 1];
                if (startWeight > 0 && endWeight > startWeight) {
                    const improvement = ((endWeight - startWeight) / startWeight) * 100;
                    if (!bestExercise || improvement > bestExercise.improvement) {
                        bestExercise = { name: exName, improvement, start: startWeight, end: endWeight };
                    }
                }
            }
        });
    }

    // Volume & Calories KPIs
    const sessionVolumes: number[] = [];
    const sessionCalories: number[] = [];

    trackedHistory.forEach(entry => {
        let sessionVolume = 0;
        let totalRestSeconds = 0;
        let totalSets = 0;

        entry.plan.plan.forEach((day, dayIndex) => {
            day.exercises.forEach((ex, exIndex) => {
                 totalSets += parseRange(ex.sets);
                 totalRestSeconds += parseNumericValue(ex.rest) * parseRange(ex.sets);
                const trackedWeight = entry.trackedData?.[dayIndex]?.[exIndex]?.weight;
                if (trackedWeight) {
                    const weight = parseNumericValue(trackedWeight);
                    const sets = parseRange(ex.sets);
                    const reps = parseRange(ex.reps);
                    sessionVolume += sets * reps * weight;
                }
            });
        });
        
        if (sessionVolume > 0) {
            sessionVolumes.push(sessionVolume);
        }

        if (userData) {
            const durationMinutes = (totalRestSeconds + totalSets * 45) / 60;
            if (durationMinutes > 0) {
                const MET = 6.0;
                const caloriesPerMinute = (MET * userData.weight * 3.5) / 200;
                const calories = Math.round(caloriesPerMinute * durationMinutes);
                if (calories > 0) {
                    sessionCalories.push(calories);
                }
            }
        }
    });
    
    const totalVolume = sessionVolumes.reduce((a, b) => a + b, 0);
    const finalVolumeStats = {
        total: totalVolume,
        avg: sessionVolumes.length > 0 ? totalVolume / sessionVolumes.length : 0,
        max: sessionVolumes.length > 0 ? Math.max(...sessionVolumes) : 0,
        min: sessionVolumes.length > 0 ? Math.min(...sessionVolumes) : 0,
    };

    const totalCalories = sessionCalories.reduce((a, b) => a + b, 0);
    const finalCalorieStats = {
        total: totalCalories,
        avg: sessionCalories.length > 0 ? totalCalories / sessionCalories.length : 0,
        max: sessionCalories.length > 0 ? Math.max(...sessionCalories) : 0,
        min: sessionCalories.length > 0 ? Math.min(...sessionCalories) : 0,
    };

    return {
        consistency: { completed: completedWorkouts, skipped: skippedWorkouts, rate: successRate },
        bestImprover: bestExercise,
        volumeStats: finalVolumeStats,
        calorieStats: finalCalorieStats
    };

  }, [history, trackedHistory, uniqueExercises, userData]);


  const exerciseProgressData = useMemo(() => {
    if (!selectedExercise) return [];
    return trackedHistory
      .map(entry => {
        let weight = 0;
        entry.plan.plan.forEach((day, dayIndex) => {
          day.exercises.forEach((ex, exIndex) => {
            if (ex.name === selectedExercise) {
              const trackedWeight = entry.trackedData?.[dayIndex]?.[exIndex]?.weight;
              if (trackedWeight) {
                weight = Math.max(weight, parseNumericValue(trackedWeight));
              }
            }
          });
        });
        return weight > 0 ? { date: new Date(entry.createdAt), weight } : null;
      })
      .filter(Boolean) as { date: Date; weight: number }[];
  }, [selectedExercise, trackedHistory]);
  
  const totalVolumeData = useMemo(() => {
      return trackedHistory.map(entry => {
          let totalVolume = 0;
          entry.plan.plan.forEach((day, dayIndex) => {
              day.exercises.forEach((ex, exIndex) => {
                  const trackedWeight = entry.trackedData?.[dayIndex]?.[exIndex]?.weight;
                  if (trackedWeight) {
                      const weight = parseNumericValue(trackedWeight);
                      const sets = parseRange(ex.sets);
                      const reps = parseRange(ex.reps);
                      totalVolume += sets * reps * weight;
                  }
              });
          });
          return { date: new Date(entry.createdAt), volume: totalVolume };
      });
  }, [trackedHistory]);

  const selectedSession = useMemo(() => {
      return history.find(h => h.id === selectedSessionId);
  }, [selectedSessionId, history]);

  const caloriesBurned = useMemo(() => {
    if (!selectedSession || !userData) return 0;
    
    let totalRestSeconds = 0;
    let totalSets = 0;
    selectedSession.plan.plan.forEach(day => {
        day.exercises.forEach(ex => {
            totalSets += parseRange(ex.sets);
            totalRestSeconds += parseNumericValue(ex.rest) * parseRange(ex.sets);
        });
    });
    const durationMinutes = (totalRestSeconds + totalSets * 45) / 60; 
    if (durationMinutes === 0) return 0;
    
    const MET = 6.0; 
    const caloriesPerMinute = (MET * userData.weight * 3.5) / 200;
    
    return Math.round(caloriesPerMinute * durationMinutes);

  }, [selectedSession, userData]);


  const renderChart = (data: {date: Date, value: number}[], label: string, color: string) => {
    if (data.length < 2) {
      return <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-900/50 rounded-md">Pochi dati per generare un grafico. Registra i pesi per più sessioni!</div>;
    }
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue > 0 ? maxValue - minValue : 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minValue) / valueRange) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-64 bg-slate-900/50 p-4 rounded-md relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((d.value - minValue) / valueRange) * 100;
                    return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
                })}
            </svg>
            <div className="absolute bottom-2 left-4 text-xs text-slate-400">
                {data[0].date.toLocaleDateString('it-IT')}
            </div>
             <div className="absolute bottom-2 right-4 text-xs text-slate-400">
                {data[data.length - 1].date.toLocaleDateString('it-IT')}
            </div>
            <div className="absolute top-2 left-4 text-xs text-slate-200 font-bold">{label}: {minValue.toFixed(0)} - {maxValue.toFixed(0)}</div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-cyan-400">I miei progressi</h2>
        <button
          onClick={onGoBack}
          className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
        >
          Indietro
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
          <p className="text-slate-400">Non hai ancora registrato nessun allenamento. Completa una sessione e torna qui per vedere i tuoi progressi!</p>
        </div>
      ) : (
        <>
            {/* KPIs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KpiCard 
                    title="Consistenza Allenamenti"
                    value={`${consistency.rate}%`}
                    icon={<TargetIcon className="w-6 h-6" />}
                    subValue={`${consistency.completed} completati / ${consistency.skipped} saltati`}
                />
                <KpiCard 
                    title="Miglior Esercizio"
                    value={bestImprover ? `+${bestImprover.improvement.toFixed(0)}%` : 'N/D'}
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    subValue={bestImprover ? `${bestImprover.name} (${bestImprover.start}kg -> ${bestImprover.end}kg)` : 'Più dati necessari'}
                />
                <KpiCard 
                    title="Volume Sollevato"
                    value={`${(volumeStats.total / 1000).toFixed(1)} t`}
                    icon={<>🏋️</>}
                    subValue={`Media: ${(volumeStats.avg/1000).toFixed(2)}t\nMax: ${(volumeStats.max/1000).toFixed(2)}t | Min: ${(volumeStats.min/1000).toFixed(2)}t`}
                />
                <KpiCard 
                    title="Calorie Stimate"
                    value={`${calorieStats.total.toLocaleString('it-IT')} kcal`}
                    icon={<>🔥</>}
                    subValue={`Media: ${calorieStats.avg.toFixed(0)} kcal\nMax: ${calorieStats.max} | Min: ${calorieStats.min}`}
                />
            </div>
            
            {/* Detailed Analysis Section */}
            <div className="space-y-4 pt-4">
                <h3 className="text-2xl font-bold text-white mb-4">Analisi Dettagliata</h3>
                {/* Exercise Progression Section */}
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Progressione per Esercizio</h3>
                    <select 
                        value={selectedExercise} 
                        onChange={e => setSelectedExercise(e.target.value)}
                        className="w-full mb-4 bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        <option value="">-- Seleziona un esercizio --</option>
                        {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                    {selectedExercise && renderChart(exerciseProgressData.map(d => ({date: d.date, value: d.weight})), 'Carico (kg)', '#22d3ee')}
                </div>
                
                {/* Total Volume Section */}
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Volume Totale per Sessione (kg)</h3>
                    {renderChart(totalVolumeData.map(d => ({date: d.date, value: d.volume})), 'Volume (kg)', '#818cf8')}
                </div>

                {/* Calorie Calculator Section */}
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Stima Calorie per Sessione</h3>
                    <select 
                        value={selectedSessionId} 
                        onChange={e => setSelectedSessionId(e.target.value)}
                        className="w-full mb-4 bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        <option value="">-- Seleziona una sessione completata --</option>
                        {trackedHistory.map(s => <option key={s.id} value={s.id}>{s.plan.title.mainTitle} - {new Date(s.createdAt).toLocaleDateString('it-IT')}</option>)}
                    </select>
                    {selectedSessionId && userData && (
                        <div className="text-center p-4 bg-slate-900/50 rounded-md">
                            <p className="text-slate-300">Stima calorie bruciate per la sessione:</p>
                            <p className="text-4xl font-bold text-cyan-400 mt-2">{caloriesBurned} kcal</p>
                        </div>
                    )}
                    {selectedSessionId && !userData && (
                        <p className="text-yellow-400 text-sm">Per calcolare le calorie, assicurati che i tuoi dati personali (peso, etc.) siano compilati nel modulo principale.</p>
                    )}
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Progress;