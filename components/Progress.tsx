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

const KpiCard = ({ title, value, icon, subValue }: { title: string; value: string; icon: React.ReactNode, subValue?: string }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 flex items-start gap-4">
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
    const completedWorkouts = trackedHistory.length;
    
    // Consistency KPI
    const totalGenerated = history.length;
    const skippedWorkouts = totalGenerated - completedWorkouts;
    const successRate = totalGenerated > 0 ? Math.round((completedWorkouts / totalGenerated) * 100) : 0;
    
    // Best Improver KPI
    let bestExercise: { name: string; improvement: number; start: number; end: number; } | null = null;
    if (completedWorkouts > 1) {
        uniqueExercises.forEach(exName => {
            const progress = trackedHistory.map(entry => {
                let maxWeight = 0;
                 entry.plan.plan.forEach((day, dayIndex) => {
                    day.exercises.forEach((ex, exIndex) => {
                        if (ex.name === exName) {
                            const trackedSets = entry.trackedData?.[dayIndex]?.[exIndex]?.sets;
                            if(trackedSets) {
                                for (const set of trackedSets) {
                                    const weight = parseNumericValue(set.weight);
                                    if (weight > maxWeight) maxWeight = weight;
                                }
                            }
                        }
                    });
                });
                return maxWeight > 0 ? maxWeight : null;
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
        let trackedSetsCount = 0;

        if (entry.trackedData) {
            Object.values(entry.trackedData).forEach(dayData => {
                Object.values(dayData).forEach(exTrackedData => {
                    if (exTrackedData.sets) {
                        exTrackedData.sets.forEach(set => {
                            const weight = parseNumericValue(set.weight);
                            const reps = parseNumericValue(set.reps);
                            if (weight > 0 && reps > 0) {
                                sessionVolume += weight * reps;
                            }
                        });
                    }
                });
            });
        }
        
        if (sessionVolume > 0) {
            sessionVolumes.push(sessionVolume);
        }

        if (userData && entry.trackedData) {
             entry.plan.plan.forEach((day, dayIndex) => {
                day.exercises.forEach((ex, exIndex) => {
                    const trackedExercise = entry.trackedData?.[dayIndex]?.[exIndex];
                    if (trackedExercise && trackedExercise.sets) {
                        const setsPerformed = trackedExercise.sets.filter(s => parseNumericValue(s.weight) > 0 && parseNumericValue(s.reps) > 0).length;
                        if (setsPerformed > 0) {
                            trackedSetsCount += setsPerformed;
                            const rest = parseNumericValue(ex.rest.split('-')[0]); 
                            totalRestSeconds += rest * (setsPerformed > 1 ? setsPerformed - 1 : 0);
                        }
                    }
                });
            });
            
            const durationMinutes = (totalRestSeconds + trackedSetsCount * 45) / 60;
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
        let maxWeight = 0;
        entry.plan.plan.forEach((day, dayIndex) => {
          day.exercises.forEach((ex, exIndex) => {
            if (ex.name === selectedExercise) {
              const trackedSets = entry.trackedData?.[dayIndex]?.[exIndex]?.sets;
              if (trackedSets) {
                for (const set of trackedSets) {
                  const weight = parseNumericValue(set.weight);
                  if (weight > maxWeight) maxWeight = weight;
                }
              }
            }
          });
        });
        return maxWeight > 0 ? { date: new Date(entry.createdAt), weight: maxWeight } : null;
      })
      .filter(Boolean) as { date: Date; weight: number }[];
  }, [selectedExercise, trackedHistory]);
  
  const totalVolumeData = useMemo(() => {
      return trackedHistory.map(entry => {
          let totalVolume = 0;
          if (entry.trackedData) {
            Object.values(entry.trackedData).forEach(dayData => {
                Object.values(dayData).forEach(exTrackedData => {
                    if (exTrackedData.sets) {
                        exTrackedData.sets.forEach(set => {
                            const weight = parseNumericValue(set.weight);
                            const reps = parseNumericValue(set.reps);
                            if (weight > 0 && reps > 0) {
                                totalVolume += weight * reps;
                            }
                        });
                    }
                });
            });
        }
          return { date: new Date(entry.createdAt), volume: totalVolume };
      }).filter(item => item.volume > 0);
  }, [trackedHistory]);

  const caloriesProgressData = useMemo(() => {
    if (!userData) return [];

    return trackedHistory.map(session => {
        let totalRestSeconds = 0;
        let trackedSetsCount = 0;
        if (session.trackedData) {
            session.plan.plan.forEach((day, dayIndex) => {
                day.exercises.forEach((ex, exIndex) => {
                    const trackedExercise = session.trackedData?.[dayIndex]?.[exIndex];
                    if (trackedExercise && trackedExercise.sets) {
                        const setsPerformed = trackedExercise.sets.filter(s => parseNumericValue(s.weight) > 0 && parseNumericValue(s.reps) > 0).length;
                        if (setsPerformed > 0) {
                            trackedSetsCount += setsPerformed;
                            const rest = parseNumericValue(ex.rest.split('-')[0]);
                            totalRestSeconds += rest * (setsPerformed > 1 ? setsPerformed - 1 : 0);
                        }
                    }
                });
            });
        }
        
        const durationMinutes = (totalRestSeconds + trackedSetsCount * 45) / 60;
        if (durationMinutes <= 0) return null;
        
        const MET = 6.0;
        const caloriesPerMinute = (MET * userData.weight * 3.5) / 200;
        const calories = Math.round(caloriesPerMinute * durationMinutes);

        return { date: new Date(session.createdAt), calories };
    }).filter(Boolean).filter(d => d && d.calories > 0) as { date: Date; calories: number }[];
  }, [trackedHistory, userData]);

  const renderChart = (data: {date: Date, value: number}[], label: string, color: string) => {
    if (data.length < 2) {
      return <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-900/50 rounded-lg">Pochi dati per generare un grafico. Registra i tuoi progressi per più sessioni!</div>;
    }
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue > 0 ? maxValue - minValue : 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minValue) / valueRange) * 100;
        return `${x},${y}`;
    }).join(' ');

    const svgId = `gradient-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

    return (
        <div className="w-full h-64 bg-slate-900/50 backdrop-blur-sm p-4 rounded-lg relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={svgId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <polygon fill={`url(#${svgId})`} points={`${points} 100,100 0,100`} />
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((d.value - minValue) / valueRange) * 100;
                    return <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke={color} strokeWidth="0.5" />;
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
        <h2 className="text-3xl font-bold text-cyan-400">I MIEI PROGRESSI</h2>
        <button
          onClick={onGoBack}
          className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
        >
          Indietro
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
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
                <h3 className="text-2xl font-bold text-white mb-4">ANALISI DETTAGLIATA</h3>
                {/* Exercise Progression Section */}
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">PROGRESSIONE PER ESERCIZIO</h3>
                    <select 
                        value={selectedExercise} 
                        onChange={e => setSelectedExercise(e.target.value)}
                        className="w-full mb-4 bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        <option value="">-- Seleziona un esercizio --</option>
                        {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                    {selectedExercise && (
                        <div className="mt-4 md:grid md:grid-cols-5 md:gap-6 items-start">
                            <div className="md:col-span-3">
                                {renderChart(exerciseProgressData.map(d => ({date: d.date, value: d.weight})), 'Carico (kg)', '#22d3ee')}
                            </div>
                            {exerciseProgressData.length > 0 && (
                                <div className="mt-4 md:mt-0 md:col-span-2 max-h-72 overflow-y-auto">
                                    {/* Mobile List View */}
                                    <ul className="md:hidden space-y-2">
                                        {exerciseProgressData.slice().reverse().map((data, index) => (
                                            <li key={index} className="flex justify-between items-center p-2 bg-slate-900/40 rounded-md text-sm">
                                                <span className="text-slate-400">{data.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span className="font-medium text-white">{data.weight} kg</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {/* Desktop Table View */}
                                    <table className="hidden md:table w-full text-sm text-left text-slate-300">
                                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0 backdrop-blur-sm">
                                            <tr>
                                                <th scope="col" className="px-4 py-2">Data</th>
                                                <th scope="col" className="px-4 py-2 text-right">Peso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exerciseProgressData.slice().reverse().map((data, index) => (
                                                <tr key={index} className="border-b border-slate-700/50">
                                                    <td className="px-4 py-2 whitespace-nowrap">{data.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                    <td className="px-4 py-2 text-right font-medium">{data.weight} kg</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Total Volume Section */}
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">VOLUME TOTALE PER SESSIONE (KG)</h3>
                    {renderChart(totalVolumeData.map(d => ({date: d.date, value: d.volume})), 'Volume (kg)', '#818cf8')}
                </div>

                {/* Stima Calorie Bruciate Section */}
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">ANDAMENTO CALORIE BRUCIATE PER SESSIONE</h3>
                    {userData ? 
                        (
                            <div className="space-y-4">
                                {renderChart(caloriesProgressData.map(d => ({date: d.date, value: d.calories})), 'Calorie (kcal)', '#f43f5e')}
                                {caloriesProgressData.length > 0 && (
                                    <div className="mt-4 max-h-48 overflow-y-auto">
                                         {/* Mobile List View */}
                                        <ul className="md:hidden space-y-2">
                                            {caloriesProgressData.slice().reverse().map((data, index) => (
                                                <li key={index} className="flex justify-between items-center p-2 bg-slate-900/40 rounded-md text-sm">
                                                    <span className="text-slate-400">{data.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="font-medium text-white">{data.calories} kcal</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {/* Desktop Table View */}
                                        <table className="hidden md:table w-full text-sm text-left text-slate-300">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0 backdrop-blur-sm">
                                                <tr>
                                                    <th scope="col" className="px-4 py-2">Data</th>
                                                    <th scope="col" className="px-4 py-2 text-right">Calorie Stimate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {caloriesProgressData.slice().reverse().map((data, index) => (
                                                    <tr key={index} className="border-b border-slate-700/50">
                                                        <td className="px-4 py-2 whitespace-nowrap">{data.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                        <td className="px-4 py-2 text-right font-medium">{data.calories} kcal</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )
                        : <p className="text-yellow-400 text-sm p-4 text-center">I tuoi dati personali (es. peso) sono necessari per stimare le calorie. Assicurati che siano compilati nel modulo principale.</p>
                    }
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Progress;
