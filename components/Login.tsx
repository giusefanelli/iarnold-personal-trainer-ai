

import React, { useState } from 'react';
import { DumbbellIcon } from './icons/DumbbellIcon';

interface Props {
  onLogin: (name: string, rememberMe: boolean) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim(), rememberMe);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <div className="w-full max-w-sm text-center">
        <DumbbellIcon className="w-20 h-20 text-cyan-400 mx-auto" />
        <h1 className="text-5xl md:text-6xl font-bold text-white mt-4" style={{textShadow: '0 0 12px rgb(34 211 238 / 0.5)'}}>
          IArnold
        </h1>
        <p className="text-lg font-medium text-slate-300 mt-2 tracking-wider">
          Il tuo Personal Trainer <span className="font-bold text-cyan-400">AI</span>
        </p>
        
        <form onSubmit={handleSubmit} className="mt-10">
          <label htmlFor="name" className="block text-md font-medium text-slate-300 mb-2 font-display">
            Come ti chiami?
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-center text-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            placeholder="Il tuo nome"
            required
          />
          
          <div className="mt-4 flex items-center justify-center">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 text-cyan-600 bg-slate-700 focus:ring-cyan-500"
              />
              Salva account su questo dispositivo
            </label>
          </div>

          <button
            type="submit"
            className="w-full mt-6 px-6 py-3 bg-amber-400 text-slate-900 font-bold text-lg rounded-lg hover:bg-amber-300 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40"
          >
            Entra
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;