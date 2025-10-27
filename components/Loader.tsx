

import React from 'react';
import { DumbbellIcon } from './icons/DumbbellIcon';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center">
      <DumbbellIcon className="w-24 h-24 text-cyan-400 animate-charge" />
      <h3 className="text-2xl font-bold text-white">IARNOLD STA FORGIANDO LA TUA SCHEDA...</h3>
      <p className="text-slate-400 max-w-sm">Questo processo potrebbe richiedere qualche istante. Stiamo creando il piano perfetto per i tuoi obiettivi!</p>
    </div>
  );
};

export default Loader;