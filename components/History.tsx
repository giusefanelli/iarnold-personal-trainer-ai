

import React from 'react';
import { HistoryEntry } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrashIcon } from './icons/TrashIcon';

interface Props {
  history: HistoryEntry[];
  onView: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onGoBack: () => void;
  onClearAll: () => void;
}

const History: React.FC<Props> = ({ history, onView, onDelete, onGoBack, onClearAll }) => {
  const formatHistoryTitle = (entry: HistoryEntry) => {
    const { name } = entry.userData;
    const { mainTitle } = entry.plan.title;
    return name ? `${mainTitle} - ${name}` : mainTitle;
  };

  const formatHistorySubtitle = (entry: HistoryEntry) => {
    const { trainingDays, goal } = entry.userData;
    const goalMap = {
      hypertrophy: 'Ipertrofia',
      strength: 'Forza',
      fat_loss: 'Definizione',
    };
    return `${trainingDays} giorni/sett - ${goalMap[goal]}`;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-cyan-400">LE MIE SCHEDE</h2>
        <button
          onClick={onGoBack}
          className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
        >
          Indietro
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
          <p className="text-slate-400">Non hai ancora generato nessuna scheda. Creane una per vederla qui!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(entry => (
            <div key={entry.id} className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-white">{formatHistoryTitle(entry)}</h3>
                <p className="text-sm text-slate-300">{formatHistorySubtitle(entry)}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{new Date(entry.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 self-end sm:self-center">
                <button
                  onClick={() => onView(entry)}
                  className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                >
                  Visualizza
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  aria-label="Elimina scheda"
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <div className="text-center mt-8">
            <button
                onClick={onClearAll}
                className="text-sm text-red-500 hover:text-red-400 font-semibold"
            >
                Cancella tutta la cronologia
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;