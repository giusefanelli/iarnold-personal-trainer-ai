
import React from 'react';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

const ApiKeyPrompt: React.FC = () => {
  return (
    <div className="text-center p-8 bg-slate-800/50 border border-yellow-500/50 rounded-lg max-w-lg mx-auto animate-fade-in">
      <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-yellow-300 mb-2">API Key Mancante</h2>
      <p className="text-slate-300">
        Per utilizzare IArnold, è necessario configurare una API Key di Google Gemini.
      </p>
      <p className="text-slate-400 mt-4 text-sm">
        Assicurati che la variabile d'ambiente <code className="bg-slate-900 px-2 py-1 rounded-md text-cyan-400 font-mono">API_KEY</code> sia impostata correttamente nell'ambiente di esecuzione di questa applicazione.
      </p>
    </div>
  );
};

export default ApiKeyPrompt;
