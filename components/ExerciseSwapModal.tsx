
import React, { useState, useEffect } from 'react';
import { getExerciseAlternatives } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  muscleGroupFocus: string;
  equipment: 'gym' | 'homegym' | 'dumbbells_bands';
  onSelectAlternative: (newExercise: string) => void;
}

const ExerciseSwapModal: React.FC<Props> = ({ isOpen, onClose, exerciseName, muscleGroupFocus, equipment, onSelectAlternative }) => {
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchAlternatives = async () => {
        setIsLoading(true);
        setError(null);
        setAlternatives([]);
        try {
          const result = await getExerciseAlternatives(exerciseName, muscleGroupFocus, equipment);
          setAlternatives(result);
        } catch (err) {
          setError("Impossibile caricare le alternative. Riprova.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchAlternatives();
    }
  }, [isOpen, exerciseName, muscleGroupFocus, equipment]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-modal-title"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="swap-modal-title" className="text-xl font-bold text-cyan-400 mb-2">Sostituisci Esercizio</h2>
        <p className="text-slate-300 mb-4">Alternative per <span className="font-semibold text-white">{exerciseName}</span>:</p>
        
        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-cyan-400"></div>
            </div>
          )}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {!isLoading && !error && alternatives.length > 0 && (
            <ul className="space-y-2">
              {alternatives.map((alt, index) => (
                <li key={index}>
                  <button
                    onClick={() => onSelectAlternative(alt)}
                    className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    {alt}
                  </button>
                </li>
              ))}
            </ul>
          )}
           {!isLoading && !error && alternatives.length === 1 && alternatives[0].startsWith("Non è stato possibile") && (
             <p className="text-yellow-400 text-center py-4">{alternatives[0]}</p>
           )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  );
};

export default ExerciseSwapModal;