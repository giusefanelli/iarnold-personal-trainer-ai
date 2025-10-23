
import React, { useState, useEffect } from 'react';
import { HistoryEntry, TrackedData, WorkoutPlanType } from '../types';
import WorkoutChat from './WorkoutChat';
import { ReplaceIcon } from './icons/ReplaceIcon';
import ExerciseSwapModal from './ExerciseSwapModal';

interface Props {
  entry: HistoryEntry;
  onNewPlan: () => void;
  onTrackData: (entryId: string, trackedData: TrackedData) => void;
  onPlanUpdate: (updatedEntry: HistoryEntry) => void;
}

const WorkoutPlan: React.FC<Props> = ({ entry, onNewPlan, onTrackData, onPlanUpdate }) => {
  const { plan, userData } = entry;
  const [isDownloading, setIsDownloading] = useState(false);
  const [trackedData, setTrackedData] = useState<TrackedData>(entry.trackedData || {});
  
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [exerciseToSwap, setExerciseToSwap] = useState<{ dayIndex: number; exIndex: number; name: string; focus: string; } | null>(null);

  // This effect listens for changes in trackedData and calls the parent handler
  // to persist the data.
  useEffect(() => {
    // Only call onTrackData if the data has actually changed from what was passed in
    if (JSON.stringify(trackedData) !== JSON.stringify(entry.trackedData || {})) {
      onTrackData(entry.id, trackedData);
    }
  }, [trackedData, entry.id, entry.trackedData, onTrackData]);

  const handleTrackingChange = (dayIndex: number, exIndex: number, field: 'weight' | 'notes', value: string) => {
    setTrackedData(prev => {
      const dayKey = String(dayIndex);
      const exKey = String(exIndex);
      const updatedDay = {
        ...(prev[dayKey] || {}),
        [exKey]: {
          ...(prev[dayKey]?.[exKey] || { weight: '', notes: '' }),
          [field]: value,
        },
      };
      return {
        ...prev,
        [dayKey]: updatedDay,
      };
    });
  };

  const handleOpenSwapModal = (dayIndex: number, exIndex: number, name: string, focus: string) => {
    setExerciseToSwap({ dayIndex, exIndex, name, focus });
    setIsSwapModalOpen(true);
  };
  
  const handleSelectAlternative = (newExerciseName: string) => {
    if (!exerciseToSwap) return;

    // Create a deep copy of the entry to avoid direct state mutation
    const newEntry = JSON.parse(JSON.stringify(entry)) as HistoryEntry;
    
    // Update the exercise name in the copied plan
    newEntry.plan.plan[exerciseToSwap.dayIndex].exercises[exerciseToSwap.exIndex].name = newExerciseName;
    
    // Call the parent handler to update the global state and localStorage
    onPlanUpdate(newEntry);
    
    setIsSwapModalOpen(false);
    setExerciseToSwap(null);
  };

  const handleDownloadWord = async () => {
    const printableArea = document.getElementById('printable-area');
    if (!printableArea) return;

    setIsDownloading(true);

    try {
      const contentClone = printableArea.cloneNode(true) as HTMLElement;
      
      contentClone.querySelectorAll('.print-hidden').forEach(el => el.remove());
      contentClone.querySelectorAll('.md\\:hidden').forEach(el => el.remove());
      contentClone.querySelectorAll('.hidden.md\\:block').forEach(el => {
        el.classList.remove('hidden', 'md:block');
      });
      contentClone.querySelectorAll('a.exercise-link').forEach(link => {
        link.replaceWith(document.createTextNode(link.textContent || ''));
      });
      
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 10pt; }
          .text-center { text-align: center; }
          h1 { font-size: 22pt; font-weight: bold; color: #0891b2; margin-bottom: 4px; }
          p { font-size: 12pt; }
          h3 { font-size: 16pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
          .text-cyan-400 { color: #0891b2; }
          ul { list-style-position: inside; padding-left: 0; }
          li { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 1em; }
          thead { background-color: #f0f0f0; }
          th { font-weight: bold; text-align: left; padding: 8px; border: 1px solid #cccccc; }
          td { padding: 8px; border: 1px solid #cccccc; vertical-align: top; }
          .font-medium { font-weight: 500; }
          .text-xs { font-size: 9pt; }
          .text-slate-400 { color: #64748b; }
          .mt-1 { margin-top: 4px; }
        </style>
      `;

      const htmlSource = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            ${styles}
          </head>
          <body>
            ${contentClone.innerHTML}
          </body>
        </html>
      `;

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlSource);
      
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `Scheda_${plan.title.mainTitle.replace(/\s+/g, '_')}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);

    } catch (error) {
        console.error("Errore durante la creazione del file Word:", error);
        alert("Si è verificato un errore durante la preparazione del download.");
    } finally {
        setIsDownloading(false);
    }
  };
  
  const createYoutubeLink = (exerciseName: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`esecuzione ${exerciseName}`)}`;

  return (
    <div className="space-y-8 animate-fade-in">
      <div id="printable-area" className="p-6 md:p-8 bg-slate-800/50 border border-slate-700 rounded-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-cyan-400">{plan.title.mainTitle}</h1>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-slate-200">{plan.title.subtitle}</p>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">{plan.description}</p>
        </div>
        
        {plan.notes && plan.notes.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-md">
                <h3 className="font-bold text-lg text-white mb-2">Note importanti dell'IA:</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {plan.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                    ))}
                </ul>
            </div>
        )}

        <div className="space-y-8">
          {plan.plan.map((dayPlan, dayIndex) => (
            <div key={dayIndex} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 break-inside-avoid">
              <h3 className="text-2xl font-bold text-white mb-4">{dayPlan.day} - <span className="text-cyan-400">{dayPlan.focus}</span></h3>
              
              {/* Mobile view: cards */}
              <div className="md:hidden space-y-4">
                {dayPlan.exercises.map((exercise, exIndex) => (
                  <div key={exIndex} className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-white text-base flex-grow">
                           <a 
                            href={createYoutubeLink(exercise.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="exercise-link hover:text-cyan-400 hover:underline transition-colors"
                            aria-label={`Cerca video per ${exercise.name} su YouTube`}
                          >
                            {exercise.name}
                          </a>
                        </h4>
                        <button onClick={() => handleOpenSwapModal(dayIndex, exIndex, exercise.name, dayPlan.focus)} className="print-hidden flex-shrink-0 p-1 text-slate-400 hover:text-cyan-400 transition-colors" aria-label="Sostituisci esercizio">
                            <ReplaceIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {exercise.note && <p className="text-xs text-slate-400 mt-1 mb-3">{exercise.note}</p>}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center border-t border-slate-700/50 pt-3">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Serie</p>
                        <p className="font-bold text-slate-100 text-lg">{exercise.sets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Reps</p>
                        <p className="font-bold text-slate-100 text-lg">{exercise.reps}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Recupero</p>
                        <p className="font-bold text-slate-100 text-lg">{exercise.rest}</p>
                      </div>
                    </div>
                    {/* Tracking Fields - Mobile */}
                    <div className="border-t border-slate-700/50 pt-3 mt-3 space-y-2 print-hidden">
                      <div>
                        <label className="text-xs text-slate-300 uppercase tracking-wider">Peso Utilizzato</label>
                        <input
                          type="text"
                          className="w-full mt-1 bg-slate-900/80 border border-slate-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-cyan-500"
                          placeholder="Es. 80kg"
                          value={trackedData[String(dayIndex)]?.[String(exIndex)]?.weight || ''}
                          onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'weight', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 uppercase tracking-wider">Note Personali</label>
                        <input
                          type="text"
                          className="w-full mt-1 bg-slate-900/80 border border-slate-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-cyan-500"
                          placeholder="Es. +2 reps, prossima volta +2.5kg"
                          value={trackedData[String(dayIndex)]?.[String(exIndex)]?.notes || ''}
                          onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop view: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm md:text-base">
                  <thead className="text-xs text-slate-200 uppercase bg-slate-800/50">
                    <tr>
                      <th scope="col" className="px-4 py-3">Esercizio</th>
                      <th scope="col" className="px-4 py-3 text-center">Serie</th>
                      <th scope="col" className="px-4 py-3 text-center">Reps</th>
                      <th scope="col" className="px-4 py-3 text-center">Recupero</th>
                      <th scope="col" className="px-4 py-3 text-center print-hidden">Peso Utilizzato</th>
                      <th scope="col" className="px-4 py-3 text-center print-hidden">Note Personali</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayPlan.exercises.map((exercise, exIndex) => (
                      <tr key={exIndex} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <a 
                              href={createYoutubeLink(exercise.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="exercise-link hover:text-cyan-400 hover:underline transition-colors"
                              aria-label={`Cerca video per ${exercise.name} su YouTube`}
                            >
                              {exercise.name}
                            </a>
                            <button onClick={() => handleOpenSwapModal(dayIndex, exIndex, exercise.name, dayPlan.focus)} className="print-hidden p-1 text-slate-400 hover:text-cyan-400 transition-colors" aria-label="Sostituisci esercizio">
                                <ReplaceIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {exercise.note && <p className="text-xs text-slate-400 font-normal mt-1">{exercise.note}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-100">{exercise.sets}</td>
                        <td className="px-4 py-3 text-center text-slate-100">{exercise.reps}</td>
                        <td className="px-4 py-3 text-center text-slate-100">{exercise.rest}</td>
                        {/* Tracking Fields - Desktop */}
                        <td className="px-4 py-3 text-center print-hidden">
                            <input
                                type="text"
                                className="w-24 bg-slate-700 border border-slate-600 rounded-md p-1 text-center text-white focus:ring-1 focus:ring-cyan-500"
                                placeholder="kg/lbs"
                                value={trackedData[String(dayIndex)]?.[String(exIndex)]?.weight || ''}
                                onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'weight', e.target.value)}
                            />
                        </td>
                        <td className="px-4 py-3 text-center print-hidden">
                             <input
                                type="text"
                                className="w-full min-w-[150px] bg-slate-700 border border-slate-600 rounded-md p-1 text-white focus:ring-1 focus:ring-cyan-500"
                                placeholder="Le tue note..."
                                value={trackedData[String(dayIndex)]?.[String(exIndex)]?.notes || ''}
                                onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'notes', e.target.value)}
                            />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 print:hidden">
        <button
          onClick={onNewPlan}
          className="w-full sm:w-auto px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          Crea una nuova scheda
        </button>
        <button
          onClick={handleDownloadWord}
          disabled={isDownloading}
          className="w-full sm:w-auto px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2 disabled:bg-cyan-800 disabled:cursor-wait"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {isDownloading ? 'Download in corso...' : 'Scarica come Word (.doc)'}
        </button>
      </div>
      
      {isSwapModalOpen && exerciseToSwap && (
        <ExerciseSwapModal
            isOpen={isSwapModalOpen}
            onClose={() => setIsSwapModalOpen(false)}
            exerciseName={exerciseToSwap.name}
            muscleGroupFocus={exerciseToSwap.focus}
            equipment={userData.equipment}
            onSelectAlternative={handleSelectAlternative}
        />
      )}

      <WorkoutChat plan={plan} />

    </div>
  );
};

export default WorkoutPlan;