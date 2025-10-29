import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, TrackedData, WorkoutPlanType, Exercise } from '../types';
import WorkoutChat from './WorkoutChat';
import { ReplaceIcon } from './icons/ReplaceIcon';
import ExerciseSwapModal from './ExerciseSwapModal';
import { CameraIcon } from './icons/CameraIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import AccordionSection from './AccordionSection';
import { FlameIcon } from './icons/FlameIcon';
import { DocumentDownloadIcon } from './icons/DocumentDownloadIcon';
import Tooltip from './Tooltip';
import { DumbbellWeightIcon } from './icons/DumbbellWeightIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import RestTimer from './RestTimer';

interface Props {
  entry: HistoryEntry;
  onNewPlan: () => void;
  onTrackData: (entryId: string, trackedData: TrackedData) => void;
  onPlanUpdate: (updatedEntry: HistoryEntry) => void;
  onStartFormCheck: (exerciseName: string) => void;
  onFinishWorkout: (entry: HistoryEntry) => void;
  onGoBack: () => void;
}

const SUPPORTED_FORM_CHECK_EXERCISES = [
    'squat', 
    'push up', 
    'piegamenti', 
    'curl',
    'affondi',
    'lunge',
    'rematore',
    'row',
    'overhead press',
    'lento avanti',
    'military press'
];

const getMuscleGroupInfo = (focus: string): { name: string; gradient: string } => {
    const lowerFocus = focus.toLowerCase();
    if (lowerFocus.includes('spinta') || lowerFocus.includes('petto') || lowerFocus.includes('push')) {
        return { name: 'Push', gradient: 'from-red-900/50 to-slate-900/50' };
    }
    if (lowerFocus.includes('tirata') || lowerFocus.includes('dorso') || lowerFocus.includes('pull')) {
        return { name: 'Pull', gradient: 'from-blue-900/50 to-slate-900/50' };
    }
    if (lowerFocus.includes('gambe') || lowerFocus.includes('lower') || lowerFocus.includes('legs')) {
        return { name: 'Legs', gradient: 'from-green-900/50 to-slate-900/50' };
    }
    if (lowerFocus.includes('full body')) {
        return { name: 'Full Body', gradient: 'from-purple-900/50 to-slate-900/50' };
    }
    if (lowerFocus.includes('upper')) {
        return { name: 'Upper', gradient: 'from-orange-900/50 to-slate-900/50' };
    }
    return { name: 'Focus', gradient: 'from-slate-800 to-slate-900/50' };
};

const NoteDisplay: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
    const isProgressionNote = useMemo(() => 
        exercise.note && (exercise.note.toLowerCase().includes('obiettivo:') || exercise.note.includes('(+' || exercise.note.includes('kg')))
    , [exercise.note]);

    if (!exercise.note) return null;

    if (isProgressionNote) {
        return (
            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-300 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <TrendingUpIcon className="w-4 h-4 flex-shrink-0" />
                <span>{exercise.note}</span>
            </div>
        );
    }

    return <p className="text-xs text-slate-400 mt-2">{exercise.note}</p>;
};

const WorkoutPlan: React.FC<Props> = ({ entry, onNewPlan, onTrackData, onPlanUpdate, onStartFormCheck, onFinishWorkout, onGoBack }) => {
  const { plan, userData } = entry;
  const [trackedData, setTrackedData] = useState<TrackedData>(entry.trackedData || {});
  const [activeTimerKey, setActiveTimerKey] = useState<string | null>(null);
  
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [exerciseToSwap, setExerciseToSwap] = useState<{ dayIndex: number; exIndex: number; name: string; focus: string; } | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number | string; right?: number } | null>(null);
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);


  useEffect(() => {
    if (JSON.stringify(trackedData) !== JSON.stringify(entry.trackedData || {})) {
      onTrackData(entry.id, trackedData);
    }
  }, [trackedData, entry.id, entry.trackedData, onTrackData]);

  const handleTrackingChange = (dayIndex: number, exIndex: number, field: 'notes' | 'weight' | 'reps', value: string, setIndex?: number) => {
    setTrackedData(prev => {
        const dayKey = String(dayIndex);
        const exKey = String(exIndex);

        // Deep copy for safe mutation
        const newTrackedData = JSON.parse(JSON.stringify(prev));

        // Ensure path exists
        if (!newTrackedData[dayKey]) newTrackedData[dayKey] = {};
        if (!newTrackedData[dayKey][exKey]) newTrackedData[dayKey][exKey] = { sets: [], notes: '' };
        
        if (field === 'notes') {
            newTrackedData[dayKey][exKey].notes = value;
        } else if (setIndex !== undefined) {
            // Ensure sets array is long enough, filling with empty objects if needed
            while (newTrackedData[dayKey][exKey].sets.length <= setIndex) {
                newTrackedData[dayKey][exKey].sets.push({ weight: '', reps: '' });
            }
            newTrackedData[dayKey][exKey].sets[setIndex][field] = value;
        }

        return newTrackedData;
    });
  };

  const handleOpenSwapModal = (event: React.MouseEvent<HTMLButtonElement>, dayIndex: number, exIndex: number, name: string, focus: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const modalWidth = 320; 
    const estimatedModalHeight = 360; 

    let top: number;
    let left: number | string;

    if (windowWidth < 768) { 
      top = windowHeight / 2 - estimatedModalHeight / 2;
      left = windowWidth / 2 - modalWidth / 2;
      
      if (top < 16) top = 16;
      if (left < 16) left = 16;

    } else { 
      top = rect.top + rect.height / 2 - estimatedModalHeight / 2;
      left = rect.left + rect.width / 2 - modalWidth / 2;

      if (top < 16) { top = 16; }
      if (top + estimatedModalHeight > windowHeight - 16) { top = windowHeight - estimatedModalHeight - 16; }
      if (left < 16) { left = 16; }
      if (left + modalWidth > windowWidth - 16) { left = windowWidth - modalWidth - 16; }
    }

    setModalPosition({ top, left });
    setExerciseToSwap({ dayIndex, exIndex, name, focus });
    setIsSwapModalOpen(true);
  };
  
  const handleSelectAlternative = (newExerciseName: string) => {
    if (!exerciseToSwap) return;

    const newEntry = JSON.parse(JSON.stringify(entry)) as HistoryEntry;
    
    newEntry.plan.plan[exerciseToSwap.dayIndex].exercises[exerciseToSwap.exIndex].name = newExerciseName;
    
    onPlanUpdate(newEntry);
    
    setIsSwapModalOpen(false);
    setExerciseToSwap(null);
  };
  
  const handleFinishWorkoutClick = () => {
    const updatedEntryWithLatestTracking = {
        ...entry,
        trackedData: trackedData,
    };
    onFinishWorkout(updatedEntryWithLatestTracking);
  };
  
  const createYoutubeLink = (exerciseName: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`esecuzione ${exerciseName}`)}`;
  
  const handleDownloadAsWord = () => {
    const { plan } = entry;
    const title = plan.title.mainTitle || 'Piano_Allenamento';
    const filename = `${title.replace(/\s+/g, '_')}.doc`;

    let content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${title}</title>
            <style>
                body { font-family: Calibri, sans-serif; font-size: 11pt; }
                h1, h2 { color: #2E74B5; }
                h1 { font-size: 20pt; }
                h2 { font-size: 16pt; }
                table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                th, td { border: 1px solid #BFBFBF; padding: 8px; text-align: left; }
                th { background-color: #F2F2F2; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>${plan.title.mainTitle}</h1>
            <p><strong>${plan.title.subtitle}</strong></p>
            <p>${plan.description}</p>
            <h2>Note Importanti</h2>
            <ul>${plan.notes.map(note => `<li>${note}</li>`).join('')}</ul>`;

    plan.plan.forEach(dayPlan => {
        content += `
            <br clear="all" style="page-break-before:always" />
            <h2>${dayPlan.day}: ${dayPlan.focus}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Esercizio</th>
                        <th>Serie</th>
                        <th>Reps</th>
                        <th>Recupero</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>
        `;
        dayPlan.exercises.forEach(ex => {
            content += `
                <tr>
                    <td>${ex.name}</td>
                    <td>${ex.sets}</td>
                    <td>${ex.reps}</td>
                    <td>${ex.rest}</td>
                    <td>${ex.note || ''}</td>
                </tr>
            `;
        });
        content += `</tbody></table>`;
    });

    content += `</body></html>`;

    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFormCheckButton = (exerciseName: string) => {
    const isSupported = SUPPORTED_FORM_CHECK_EXERCISES.some(supported => exerciseName.toLowerCase().includes(supported));
    
    const button = (
      <button
        onClick={() => isSupported && onStartFormCheck(exerciseName)}
        disabled={!isSupported}
        className={`print-hidden p-1 text-slate-400 transition-colors ${isSupported ? 'hover:text-amber-400' : 'opacity-50 cursor-not-allowed'}`}
        aria-label={isSupported ? "Verifica Esecuzione" : "Verifica Esecuzione (non disponibile)"}
      >
        <CameraIcon className="w-5 h-5" />
      </button>
    );

    if (isSupported) {
      return button;
    }

    return (
      <Tooltip text="Vision Coach non ancora disponibile per questo esercizio.">
        <span className="inline-block">{button}</span>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <button onClick={onGoBack} className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 font-semibold">
          <ChevronLeftIcon className="w-5 h-5" />
          Torna alla Dashboard
      </button>

      <div className="p-6 md:p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-cyan-400" style={{textShadow: '0 0 8px rgb(34 211 238 / 0.4)'}}>{plan.title.mainTitle}</h1>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-slate-200">{plan.title.subtitle}</p>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">{plan.description}</p>
        </div>
        
        {plan.notes && plan.notes.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-md">
                <h3 className="font-bold text-lg text-white mb-2 font-display">NOTE IMPORTANTI DELL'IA:</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {plan.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                    ))}
                </ul>
            </div>
        )}

        <AccordionSection
            title="Guida al Riscaldamento"
            subtitle="Prepara il tuo corpo per una performance sicura ed efficace."
            isOpen={isWarmupOpen}
            onToggle={() => setIsWarmupOpen(!isWarmupOpen)}
            icon={<FlameIcon className="w-8 h-8 text-amber-400 flex-shrink-0" />}
        >
            <div className="text-slate-300 space-y-4 text-sm">
                <h4 className="text-base font-semibold text-amber-300">Perché è Fondamentale?</h4>
                <p>
                    Un riscaldamento adeguato aumenta il flusso sanguigno ai muscoli, migliora l'elasticità di tendini e legamenti e attiva il sistema nervoso. Questo non solo ti permette di sollevare più carico in sicurezza, ma riduce drasticamente il rischio di infortuni.
                </p>
                <h4 className="text-base font-semibold text-amber-300 pt-2">Fase 1: Riscaldamento Generale (5-7 minuti)</h4>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong className="font-semibold text-slate-200">Cardio Leggero:</strong> 5 minuti di cyclette, tapis roulant (camminata veloce) o ellittica. Devi iniziare a sudare leggermente, non essere senza fiato.</li>
                    <li><strong className="font-semibold text-slate-200">Mobilità Articolare:</strong> Esegui circonduzioni controllate per le articolazioni che andrai a usare: spalle, gomiti, polsi, anche, ginocchia e caviglie (10-15 ripetizioni per direzione).</li>
                </ul>
                <h4 className="text-base font-semibold text-amber-300 pt-2">Fase 2: Serie di Avvicinamento (Specifiche per il primo esercizio)</h4>
                <p>
                    Queste serie preparano specificamente i muscoli e lo schema motorio del primo esercizio pesante della giornata. L'obiettivo è "avvicinarsi" al carico allenante senza accumulare fatica.
                </p>
                <div className="p-3 my-2 bg-slate-900/50 border border-slate-700 rounded-md">
                  <p className="font-bold text-slate-200">Esempio Pratico: Panca Piana con obiettivo 4x6-8 con 80kg</p>
                  <ol className="list-decimal list-inside pl-2 text-sm mt-2 space-y-1">
                      <li><strong>Serie 1:</strong> Solo bilanciere (20kg) x 12-15 reps (movimento fluido). Recupero 60s.</li>
                      <li><strong>Serie 2:</strong> 40kg x 8 reps. Recupero 60-90s.</li>
                      <li><strong>Serie 3:</strong> 60kg x 4-5 reps. Recupero 90-120s.</li>
                      <li><strong>Serie 4:</strong> 70kg x 1-2 reps (attivazione). Recupero 2-3 minuti.</li>
                      <li><strong>Inizio Allenamento:</strong> Inizia la tua prima serie allenante con 80kg.</li>
                  </ol>
                </div>
                <p className="font-semibold text-slate-200">Ora sei pronto per spingere al massimo in totale sicurezza!</p>
            </div>
        </AccordionSection>

        <div className="space-y-8">
          {plan.plan.map((dayPlan, dayIndex) => {
             const muscleInfo = getMuscleGroupInfo(dayPlan.focus);
             return (
            <div key={dayIndex} className={`p-4 bg-gradient-to-br ${muscleInfo.gradient} rounded-lg border border-slate-700/50 break-inside-avoid backdrop-blur-sm`}>
              <h3 className="text-2xl font-bold text-white mb-4">{dayPlan.day} - <span className="text-cyan-400">{dayPlan.focus}</span></h3>
              
              <div className="space-y-6">
                {dayPlan.exercises.map((exercise, exIndex) => {
                  const timerKey = `${dayIndex}-${exIndex}`;
                  const isTimerActive = activeTimerKey === timerKey;
                  const numSets = parseInt(exercise.sets.split('-')[0], 10) || 1;
                  const isTracked = trackedData[String(dayIndex)]?.[String(exIndex)]?.sets?.some(s => s.weight || s.reps);

                  return (
                    <div key={exIndex} className={`p-4 bg-slate-800/60 rounded-lg border transition-colors ${isTracked ? 'border-cyan-600/70' : 'border-slate-700/30'}`}>
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-white text-lg flex-grow">
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
                            <div className="flex items-center flex-shrink-0">
                                <button onClick={(e) => handleOpenSwapModal(e, dayIndex, exIndex, exercise.name, dayPlan.focus)} className="print-hidden p-1 text-slate-400 hover:text-cyan-400 transition-colors" aria-label="Sostituisci esercizio">
                                    <ReplaceIcon className="w-5 h-5" />
                                </button>
                                {renderFormCheckButton(exercise.name)}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4 mt-2 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <DumbbellWeightIcon className="w-5 h-5 text-cyan-400" />
                            <span><strong className="text-white">{exercise.sets}</strong> Serie</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RepeatIcon className="w-5 h-5 text-cyan-400" />
                            <span><strong className="text-white">{exercise.reps}</strong> Reps</span>
                          </div>
                           <div className="flex justify-end">
                            <RestTimer
                                restTime={exercise.rest}
                                isActive={isTimerActive}
                                onStart={() => setActiveTimerKey(timerKey)}
                                onReset={() => setActiveTimerKey(null)}
                            />
                          </div>
                        </div>

                        <NoteDisplay exercise={exercise} />
                        
                        {/* Tracking Inputs Section */}
                        <div className="mt-4 space-y-2 print-hidden">
                            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400">
                                <div className="col-span-3">SERIE</div>
                                <div className="col-span-4 text-center">PESO (KG)</div>
                                <div className="col-span-4 text-center">RIPETIZIONI</div>
                            </div>
                            {Array.from({ length: numSets }).map((_, setIndex) => (
                               <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                                 <div className="col-span-3">
                                   <div className="px-3 py-2 bg-slate-900/80 rounded-md text-center font-semibold text-slate-200">
                                     {setIndex + 1}
                                   </div>
                                 </div>
                                 <div className="col-span-4">
                                   <input
                                      type="text"
                                      inputMode="decimal"
                                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white text-center text-sm focus:ring-1 focus:ring-cyan-500"
                                      placeholder="--"
                                      value={trackedData[String(dayIndex)]?.[String(exIndex)]?.sets[setIndex]?.weight || ''}
                                      onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'weight', e.target.value, setIndex)}
                                   />
                                 </div>
                                 <div className="col-span-4">
                                  <input
                                      type="number"
                                      inputMode="numeric"
                                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white text-center text-sm focus:ring-1 focus:ring-cyan-500"
                                      placeholder="--"
                                      value={trackedData[String(dayIndex)]?.[String(exIndex)]?.sets[setIndex]?.reps || ''}
                                      onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'reps', e.target.value, setIndex)}
                                   />
                                 </div>
                               </div>
                            ))}
                        </div>
                        <div className="mt-4 print-hidden">
                           <textarea
                            className="w-full mt-1 bg-slate-900/80 border border-slate-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-cyan-500"
                            placeholder="Note personali sull'esercizio..."
                            rows={2}
                            value={trackedData[String(dayIndex)]?.[String(exIndex)]?.notes || ''}
                            onChange={(e) => handleTrackingChange(dayIndex, exIndex, 'notes', e.target.value)}
                           />
                        </div>
                    </div>
                  )})}
              </div>
            </div>
          )})}
        </div>
      </div>
      
       <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 print:hidden">
         <button
          onClick={handleFinishWorkoutClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 text-slate-900 font-bold text-lg rounded-lg hover:bg-amber-300 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40"
        >
          <SparklesIcon className="w-6 h-6" />
          Termina Allenamento e Ottieni Riepilogo AI
        </button>
        <button
          onClick={handleDownloadAsWord}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
          aria-label="Scarica come documento Word"
        >
          <DocumentDownloadIcon className="w-5 h-5" />
          <span>Scarica</span>
        </button>
      </div>
      
      {isSwapModalOpen && exerciseToSwap && modalPosition && (
        <ExerciseSwapModal
            isOpen={isSwapModalOpen}
            onClose={() => {
              setIsSwapModalOpen(false);
              setModalPosition(null);
            }}
            exerciseName={exerciseToSwap.name}
            muscleGroupFocus={exerciseToSwap.focus}
            equipment={userData.equipment}
            onSelectAlternative={handleSelectAlternative}
            position={modalPosition}
        />
      )}

      <WorkoutChat plan={plan} />

    </div>
  );
};

export default WorkoutPlan;
