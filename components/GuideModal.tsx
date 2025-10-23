
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

const guideSteps = [
  {
    title: "Benvenuto in IArnold!",
    content: "Questa guida rapida ti mostrerà come ottenere il massimo dal tuo Personal Trainer AI. Inizia compilando il modulo con i tuoi dati e obiettivi.",
    targetClass: ".bg-slate-800\\/50", // A generic class for the form
  },
  {
    title: "La Tua Scheda Interattiva",
    content: "Una volta generata la scheda, puoi interagire con essa! Clicca sul nome di un esercizio per vederne l'esecuzione su YouTube o clicca sull'icona di scambio per trovare delle alternative.",
    targetClass: "#printable-area",
  },
  {
    title: "Chatta con l'IA",
    content: "Hai dubbi sulla scheda? Chiedi direttamente a IArnold! L'IA è consapevole del tuo piano e può darti consigli, spiegazioni e persino cercarti video.",
    targetClass: ".mt-12", // Class for the chat component
  },
  {
    title: "Monitora i Tuoi Progressi",
    content: "Registra i pesi che utilizzi e consulta la sezione 'I miei progressi' per visualizzare grafici e KPI sulla tua performance, come la consistenza e il volume totale.",
    targetClass: ".flex-items-center.gap-2", // Class for the header buttons
  },
];


const GuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) {
    return null;
  }
  
  const handleNext = () => {
      if (currentStep < guideSteps.length - 1) {
          setCurrentStep(currentStep + 1);
      } else {
          handleClose();
      }
  };
  
  const handlePrev = () => {
      if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
      }
  };

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  const step = guideSteps[currentStep];

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in print:hidden"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="guide-modal-title" className="text-2xl font-bold text-cyan-400 mb-4">{step.title}</h2>
        <p className="text-slate-300 mb-6">{step.content}</p>
        
        <div className="flex justify-center items-center gap-4 my-4">
            {guideSteps.map((_, index) => (
                <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'bg-cyan-400' : 'bg-slate-600'}`}
                />
            ))}
        </div>

        {currentStep === guideSteps.length - 1 && (
            <div className="my-4 flex items-center justify-center">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 text-cyan-600 bg-slate-700 focus:ring-cyan-500"
                    />
                    Non mostrare più all'avvio
                </label>
            </div>
        )}

        <div className="flex items-center justify-between mt-6 gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Indietro
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
          >
            {currentStep === guideSteps.length - 1 ? 'Ho capito!' : 'Avanti'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
