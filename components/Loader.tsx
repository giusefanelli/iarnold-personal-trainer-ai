
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
      <h3 className="text-xl font-semibold text-white">L'IA sta preparando la tua scheda...</h3>
      <p className="text-slate-400 max-w-sm">Questo processo potrebbe richiedere qualche istante. Stiamo creando il piano perfetto per i tuoi obiettivi!</p>
    </div>
  );
};

export default Loader;
