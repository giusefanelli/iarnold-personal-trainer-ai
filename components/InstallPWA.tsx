import React, { useState, useEffect } from 'react';
import { BeforeInstallPromptEvent } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstall, setShowIosInstall] = useState(false);

  useEffect(() => {
    // Detect if the app is running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Detect if the user is on an iOS device
    const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Show iOS install prompt if not standalone and on iOS
    if (isIos() && !isStandalone) {
      setShowIosInstall(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Don't show the prompt if it's already installed
      if (!isStandalone) {
          setDeferredPrompt(e as BeforeInstallPromptEvent);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };
  
  const handleCloseIosBanner = () => {
      setShowIosInstall(false);
      // Remember the choice for the current session
      sessionStorage.setItem('iosInstallDismissed', 'true');
  }

  // Hide banner if dismissed in the current session
  if (showIosInstall && sessionStorage.getItem('iosInstallDismissed')) {
      return null;
  }

  // Component for Android/Desktop Chrome install prompt
  if (deferredPrompt) {
    return (
      <div className="mb-6 p-4 bg-cyan-900/40 border border-cyan-700/50 rounded-lg flex items-center justify-between gap-4 print:hidden animate-fade-in">
        <div>
          <h3 className="font-bold text-white">Installa IArnold sul tuo dispositivo</h3>
          <p className="text-sm text-cyan-200">Aggiungi l'app alla home per un accesso rapido e offline, senza passare dal Play Store.</p>
        </div>
        <button
          onClick={handleInstallClick}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-900 font-bold text-sm rounded-lg hover:bg-cyan-400 transition-colors"
          aria-label="Installa applicazione"
        >
          <DownloadIcon className="w-5 h-5" />
          Installa
        </button>
      </div>
    );
  }

  // Component for iOS install instructions
  if (showIosInstall) {
    return (
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg print:hidden animate-fade-in relative">
            <button onClick={handleCloseIosBanner} className="absolute top-2 right-2 text-slate-400 hover:text-white" aria-label="Chiudi banner installazione">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="font-bold text-white mb-2">Installa IArnold su iPhone/iPad</h3>
            <p className="text-sm text-slate-300">
                Per il metodo di installazione ufficiale di Apple, tocca l'icona "Condividi" <ShareIcon className="w-4 h-4 inline-block mx-1"/> nella barra di Safari e poi seleziona "Aggiungi a schermata Home".
            </p>
        </div>
    );
  }

  return null;
};

export default InstallPWA;
