
import React from 'react';

interface Props {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onGoToHistory: () => void;
  onGoToNewPlan: () => void;
}

const WelcomeModal: React.FC<Props> = ({ isOpen, userName, onClose, onGoToHistory, onGoToNewPlan }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 w-full max-w-md text-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="welcome-modal-title" className="text-2xl font-bold text-white mb-2">
          Bentornato, <span className="text-cyan-400">{userName}</span>!
        </h2>
        <p className="text-slate-300 mb-6">Cosa vuoi fare oggi?</p>
        
        <div className="flex flex-col gap-4">
            <button
                onClick={onGoToNewPlan}
                className="w-full px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
            >
                Crea una nuova scheda
            </button>
            <button
                onClick={onGoToHistory}
                className="w-full px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
            >
                Vai alle mie schede
            </button>
        </div>
        
        <button 
          onClick={onClose} 
          className="mt-6 text-sm text-slate-400 hover:text-white"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
