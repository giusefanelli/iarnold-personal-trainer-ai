
import React, { useState, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Create a clean, shareable URL by removing query parameters and hash.
      const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
      setAppUrl(cleanUrl);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 w-full max-w-md text-center"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h2 id="share-modal-title" className="text-2xl font-bold text-cyan-400 mb-4">Condividi IArnold</h2>
        <p className="text-slate-300 mb-6">Copia il link qui sotto per condividere l'app con chi vuoi.</p>
        
        <div className="mt-2">
          <label htmlFor="app-url" className="sr-only">Link dell'applicazione</label>
          <div className="relative">
            <input 
              id="app-url"
              type="text" 
              value={appUrl} 
              readOnly 
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 pr-12 text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <button 
              onClick={handleCopy}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-cyan-400 transition-colors"
              aria-label={copied ? 'Copiato!' : 'Copia link'}
            >
              {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="mt-8 w-full px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};

export default ShareModal;