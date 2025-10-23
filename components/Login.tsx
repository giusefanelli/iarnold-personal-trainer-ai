
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mt-4">
          IArnold
        </h1>
        <p className="text-lg md:text-xl font-medium text-slate-300 mt-1">
          Il tuo Personal Trainer <span className="text-cyan-400">AI</span>
        </p>
        
        <form onSubmit={handleSubmit} className="mt-10">
          <label htmlFor="name" className="block text-md font-medium text-slate-300 mb-2">
            Come ti chiami?
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 text-center text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
            className="w-full mt-6 px-6 py-3 bg-cyan-600 text-white font-bold text-lg rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Entra
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
