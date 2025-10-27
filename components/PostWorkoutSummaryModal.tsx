import React from 'react';
import { BodybuilderIcon } from './icons/BodybuilderIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface Props {
  isOpen: boolean;
  isLoading: boolean;
  summaryText: string;
  onClose: () => void;
}

const PostWorkoutSummaryModal: React.FC<Props> = ({ isOpen, isLoading, summaryText, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 w-full max-w-md text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-16 mx-auto mb-4 p-3 bg-cyan-900/50 rounded-full border-2 border-cyan-700/50">
            <BodybuilderIcon className="w-full h-full text-cyan-400" />
        </div>
        <h2 id="summary-modal-title" className="text-2xl font-bold text-white mb-4">Riepilogo Allenamento</h2>
        
        <div className="min-h-[100px] flex items-center justify-center p-4 bg-slate-900/50 rounded-md">
            {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                    <SparklesIcon className="w-8 h-8 text-amber-400 animate-pulse" />
                    <p className="text-amber-300 text-sm">IArnold sta analizzando la tua performance...</p>
                </div>
            ) : (
                <p className="text-slate-200 text-lg leading-relaxed">{summaryText}</p>
            )}
        </div>

        <button 
          onClick={onClose} 
          className="mt-8 w-full px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          Grande!
        </button>
      </div>
    </div>
  );
};

export default PostWorkoutSummaryModal;
