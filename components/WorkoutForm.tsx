import React, { useState, useEffect } from 'react';
import { UserData } from '../types';
import { GOALS, EXPERIENCE_LEVELS, MUSCLE_GROUPS, TRAINING_TYPES, RECOMMENDED_SPLITS, EQUIPMENT_OPTIONS, TRAINING_DURATIONS } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import Tooltip from './Tooltip';
import { InfoIcon } from './icons/InfoIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface Props {
  onSubmit: (data: Omit<UserData, 'name'>) => void;
  onGenerateProgression: (data: Omit<UserData, 'name'>) => void;
  isLoading: boolean;
  userName: string;
  hasHistory: boolean;
  onGoBack: () => void;
}

const StepHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="text-center mb-8">
    <h2 className="text-2xl font-bold text-cyan-400">{title}</h2>
    <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
  </div>
);

const WorkoutForm: React.FC<Props> = ({ onSubmit, onGenerateProgression, isLoading, userName, hasHistory, onGoBack }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4; // Changed to 4 steps for a clearer flow

  const [formData, setFormData] = useState<Omit<UserData, 'name' | 'previousPlan'>>(() => {
    try {
      const savedData = localStorage.getItem(`workoutFormData_${userName}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        delete parsedData.name; // Ensure name from profile is used, not from old saved data
        return {
          ...parsedData,
          trainingDuration: parsedData.trainingDuration,
        };
      }
    } catch (e) {
      console.error("Failed to load form data from localStorage", e);
    }
    return {
      gender: 'male',
      age: 25,
      height: 175,
      weight: 70,
      equipment: 'gym',
      trainingDays: 4,
      goal: 'hypertrophy',
      experience: 'intermediate',
      trainingType: 'multifrequenza',
      trainingDuration: undefined,
      focusMuscleGroups: [],
      recommendedSplit: RECOMMENDED_SPLITS[0].id,
      customSplitDescription: '',
    };
  });

  const [previousPlanFile, setPreviousPlanFile] = useState<{
    name: string;
    content: string;
    type: 'image' | 'text' | 'pdf' | 'word';
    mimeType?: string;
  } | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  useEffect(() => {
    try {
      localStorage.setItem(`workoutFormData_${userName}`, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to save form data to localStorage", e);
    }
  }, [formData, userName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'age' || name === 'height' || name === 'weight' || name === 'trainingDays' ? parseInt(value) : value }));
  };

  const handleMuscleGroupChange = (muscle: string) => {
    setFormData(prev => {
      const newFocusMuscleGroups = prev.focusMuscleGroups.includes(muscle)
        ? prev.focusMuscleGroups.filter(m => m !== muscle)
        : [...prev.focusMuscleGroups, muscle];
      return { ...prev, focusMuscleGroups: newFocusMuscleGroups };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) {
        setPreviousPlanFile(null);
        return;
    }
    
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
        reader.onload = (loadEvent) => {
            const base64String = (loadEvent.target?.result as string).split(',')[1];
            setPreviousPlanFile({ name: file.name, content: base64String, type: 'image', mimeType: file.type });
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'text/plain') {
        reader.onload = (loadEvent) => {
            const textContent = loadEvent.target?.result as string;
            setPreviousPlanFile({ name: file.name, content: textContent, type: 'text' });
        };
        reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        reader.onload = (loadEvent) => {
            const base64String = (loadEvent.target?.result as string).split(',')[1];
            const fileType = file.type === 'application/pdf' ? 'pdf' : 'word';
            setPreviousPlanFile({ name: file.name, content: base64String, type: fileType, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    } else {
        setFileError('Formato file non supportato. Carica immagine, txt, pdf, doc o docx.');
        if(e.target) e.target.value = '';
        setPreviousPlanFile(null);
    }
  };

  const removeFile = () => {
    setPreviousPlanFile(null);
    setFileError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }
  
  const handleSplitChange = (splitId: string) => {
    setFormData(prev => ({ ...prev, recommendedSplit: splitId }));
  };
  
  const getFullFormData = () => {
    const dataToSubmit: Omit<UserData, 'name'> = { ...formData };
    if (previousPlanFile) {
        dataToSubmit.previousPlan = {
            content: previousPlanFile.content,
            type: previousPlanFile.type,
            mimeType: previousPlanFile.mimeType,
        };
    }
    return dataToSubmit;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(getFullFormData());
  };
  
  const handleProgression = (e: React.FormEvent) => {
      e.preventDefault();
      onGenerateProgression(getFullFormData());
  };
  
  const handleDurationChange = (durationId: UserData['trainingDuration'] | 'no_preference') => {
    if (durationId === 'no_preference') {
        setFormData(prev => ({ ...prev, trainingDuration: undefined }));
    } else {
        setFormData(prev => ({ ...prev, trainingDuration: durationId }));
    }
  };

  const trainingTypeDescription = TRAINING_TYPES.map(t => `${t.label}: ${t.description}`).join('\n\n');

  return (
    <div className="animate-fade-in space-y-8">
      {hasHistory && (
        <div className="p-6 bg-gradient-to-br from-cyan-900/50 to-slate-900/50 backdrop-blur-sm border border-cyan-700/50 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2 font-display">PRONTO PER IL LIVELLO SUCCESSIVO?</h2>
            <p className="text-cyan-200 mb-6 max-w-xl mx-auto">IArnold può analizzare le tue performance passate per creare la fase successiva del tuo allenamento, applicando il sovraccarico progressivo in modo intelligente.</p>
            <button
                type="button"
                onClick={handleProgression}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-3 px-8 py-3 bg-cyan-500 text-slate-900 font-bold text-lg rounded-lg hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40"
            >
                <TrendingUpIcon className="w-6 h-6" />
                {isLoading ? 'Evoluzione in corso...' : 'Evolvi il Mio Allenamento'}
            </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-2xl font-bold text-slate-200 font-display">{hasHistory ? 'Oppure, Crea una Scheda da Zero' : 'Crea la Tua Scheda Personalizzata'}</h3>
             <button
                type="button"
                onClick={onGoBack}
                className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                Indietro
              </button>
        </div>
        <p className="text-slate-400 text-center mb-4">Compila i campi sottostanti per generare un nuovo piano di allenamento.</p>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <p className="text-center text-sm font-bold text-cyan-400 tracking-widest">PASSO {step} DI {totalSteps}</p>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
            <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 md:p-8 min-h-[400px]">
          {step === 1 && (
            <section>
              <StepHeader title="Dati Personali" subtitle="Questi dati ci aiuteranno a personalizzare la tua scheda." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-slate-300 mb-1">Sesso</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                    <option value="male">Uomo</option>
                    <option value="female">Donna</option>
                    <option value="other">Altro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-1">Età</label>
                  <input type="number" id="age" name="age" value={formData.age} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" min="14" max="99" />
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-1">Altezza (cm)</label>
                  <input type="number" id="height" name="height" value={formData.height} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" min="100" max="250" />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (kg)</label>
                  <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" min="30" max="200" />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <StepHeader title="Obiettivi e Livello" subtitle="Definisci cosa vuoi raggiungere e con quali strumenti." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="trainingDays" className="block text-sm font-medium text-slate-300 mb-1">Giorni di allenamento / settimana</label>
                  <input type="number" id="trainingDays" name="trainingDays" value={formData.trainingDays} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" min="2" max="7" />
                </div>
                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-1">Obiettivo principale</label>
                  <select id="goal" name="goal" value={formData.goal} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                    {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-slate-300 mb-1">Livello di esperienza</label>
                  <select id="experience" name="experience" value={formData.experience} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                    {EXPERIENCE_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                      <label htmlFor="trainingType" className="block text-sm font-medium text-slate-300">Tipologia di allenamento</label>
                      <Tooltip text={trainingTypeDescription}>
                          <InfoIcon className="w-4 h-4 text-slate-400 cursor-help" />
                      </Tooltip>
                  </div>
                  <select id="trainingType" name="trainingType" value={formData.trainingType} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                    {TRAINING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="equipment" className="block text-sm font-medium text-slate-300 mb-1">Attrezzatura Disponibile</label>
                  <select id="equipment" name="equipment" value={formData.equipment} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                    {EQUIPMENT_OPTIONS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                  </select>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
              <section>
                  <StepHeader title="Personalizzazione e Contesto" subtitle="Scegli la struttura, il focus e allega la tua scheda precedente (opzionale)." />
                  <div className="space-y-8">
                      <div>
                          <h3 className="text-lg font-bold text-white mb-1 font-display">STRUTTURA SCHEDA</h3>
                          <p className="text-slate-400 mb-4 text-sm">Scegli uno split classico, lascia fare all'IA, oppure descrivi tu cosa vorresti.</p>
                          <div className="flex flex-wrap gap-3">
                          {RECOMMENDED_SPLITS.map(split => (
                              <Tooltip key={split.id} text={split.description}>
                              <button
                                  type="button"
                                  onClick={() => handleSplitChange(split.id)}
                                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                                  formData.recommendedSplit === split.id
                                      ? 'bg-cyan-500 text-slate-900 ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-500'
                                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                  }`}
                              >
                                  {split.label}
                              </button>
                              </Tooltip>
                          ))}
                          </div>
                          {formData.recommendedSplit === 'Chiedi a IArnold' && (
                          <div className="mt-4 animate-fade-in">
                              <label htmlFor="customSplitDescription" className="block text-sm font-medium text-slate-300 mb-1">Descrivi la scheda che vorresti:</label>
                              <textarea
                              id="customSplitDescription"
                              name="customSplitDescription"
                              value={formData.customSplitDescription || ''}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder="Es: Vorrei una scheda basata sul metodo PHUL, con focus su squat e panca piana..."
                              />
                          </div>
                          )}
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-white mb-1 font-display">DURATA SESSIONE</h3>
                          <p className="text-slate-400 mb-4 text-sm">Quanto tempo hai a disposizione per ogni allenamento? (Opzionale)</p>
                          <div className="flex flex-wrap gap-3">
                            {TRAINING_DURATIONS.map(duration => {
                                const value = duration.id === 'no_preference' ? undefined : duration.id as UserData['trainingDuration'];
                                return (
                                <button
                                    key={duration.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, trainingDuration: value}))}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                                    formData.trainingDuration === value
                                        ? 'bg-cyan-500 text-slate-900 ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-500'
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                    }`}
                                >
                                    {duration.label}
                                </button>
                                );
                            })}
                          </div>
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-white mb-1 font-display">MUSCOLI CARENTI / FOCUS</h3>
                          <p className="text-slate-400 mb-4 text-sm">Seleziona i gruppi muscolari su cui vuoi porre maggiore enfasi.</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {MUSCLE_GROUPS.map(muscle => (
                              <label key={muscle} className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-md cursor-pointer hover:bg-slate-700/50 transition-colors border border-transparent has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-900/20">
                              <input
                                  type="checkbox"
                                  checked={formData.focusMuscleGroups.includes(muscle)}
                                  onChange={() => handleMuscleGroupChange(muscle)}
                                  className="h-5 w-5 rounded border-slate-600 text-cyan-600 bg-slate-800 focus:ring-cyan-500"
                              />
                              <span className="font-medium text-slate-200">{muscle}</span>
                              </label>
                          ))}
                          </div>
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-white mb-1 font-display">CONTESTO (OPZIONALE)</h3>
                          <p className="text-slate-400 mb-4 text-sm">Allega la tua scheda attuale (immagine, txt, pdf, doc) per permettere all'IA di creare una progressione logica.</p>
                          <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileChange}
                              accept="image/*,.txt,.pdf,.doc,.docx"
                              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-900/50 file:text-cyan-300 hover:file:bg-cyan-900"
                          />
                          {fileError && <p className="text-red-400 text-sm mt-2">{fileError}</p>}
                          {previousPlanFile && (
                              <div className="mt-4 p-3 bg-slate-900/50 rounded-md flex items-center justify-between">
                                  <p className="text-sm text-slate-300 truncate">File: <span className="font-medium text-white">{previousPlanFile.name}</span></p>
                                  <button type="button" onClick={removeFile} className="text-xs font-bold text-red-400 hover:text-red-300 ml-4">RIMUOVI</button>
                              </div>
                          )}
                      </div>
                  </div>
              </section>
          )}
          {step === 4 && (
            <section className="flex flex-col items-center justify-center h-full text-center">
                <StepHeader title="Pronto a Generare?" subtitle="Controlla i dati inseriti nei passaggi precedenti, poi clicca per creare la tua scheda." />
                <SparklesIcon className="w-16 h-16 text-amber-400 my-4 animate-pulse" />
                <p className="text-slate-400">L'IA sta per mettersi al lavoro per te!</p>
            </section>
          )}
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="w-full sm:w-auto px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Indietro
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="w-full sm:w-auto px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Avanti
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 text-slate-900 font-bold text-lg rounded-lg hover:bg-amber-300 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40"
            >
              <SparklesIcon className="w-6 h-6" />
              {isLoading ? 'Creazione in corso...' : 'Crea la Mia Scheda'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WorkoutForm;