
import React, { useState, useCallback, useEffect } from 'react';
import { UserData, HistoryEntry, TrackedData, View } from './types';
import { generateWorkoutPlan } from './services/geminiService';
import Header from './components/Header';
import WorkoutForm from './components/WorkoutForm';
import WorkoutPlan from './components/WorkoutPlan';
import Loader from './components/Loader';
import Footer from './components/Footer';
import InstallPWA from './components/InstallPWA';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import History from './components/History';
import Progress from './components/Progress';
import GuideModal from './components/GuideModal';
import Login from './components/Login';
import WelcomeModal from './components/WelcomeModal';

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [view, setView] = useState<View>('login');
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const loadUserDataFor = (userName: string) => {
    try {
      const savedHistory = localStorage.getItem(`workoutHistory_${userName}`);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      
      const savedUserData = localStorage.getItem(`workoutFormData_${userName}`);
      if (savedUserData) setUserData(JSON.parse(savedUserData));

      const guideSeen = localStorage.getItem('guideSeen');
      if (!guideSeen) setShowGuide(true);

    } catch (e) {
      console.error("Failed to load user data from localStorage", e);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      loadUserDataFor(savedUser);
      setView('form');
      setShowWelcomeModal(true);
    } else {
      setView('login');
    }
  }, []);

  const handleLogin = (name: string, rememberMe: boolean) => {
    setCurrentUser(name);
    if (rememberMe) {
      localStorage.setItem('currentUser', name);
    }
    loadUserDataFor(name);
    setView('form');
  };

  const handleLogout = () => {
    if (window.confirm("Sei sicuro di voler uscire? Il tuo profilo salvato verrà rimosso.")) {
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setHistory([]);
      setUserData(null);
      setView('login');
    }
  };

  const handleGeneratePlan = useCallback(async (newUserData: Omit<UserData, 'name'>) => {
    if (!currentUser) return;
    
    const fullUserData: UserData = { ...newUserData, name: currentUser };
    
    setView('loading');
    setError(null);
    setCurrentEntry(null);
    setUserData(fullUserData); 

    try {
      const plan = await generateWorkoutPlan(fullUserData);
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        userData: fullUserData,
        plan,
        trackedData: {},
      };

      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(`workoutHistory_${currentUser}`, JSON.stringify(updatedHistory));

      setCurrentEntry(newEntry);
      setView('plan');
    } catch (err) {
      console.error(err);
      setError('Si è verificato un errore durante la generazione della scheda. Assicurati che la tua API Key sia configurata correttamente e riprova.');
      setView('error');
    }
  }, [history, currentUser]);

  const handleReset = () => {
    setCurrentEntry(null);
    setError(null);
    setView('form');
  };

  const handleViewHistoryPlan = (entry: HistoryEntry) => {
    setCurrentEntry(entry);
    setView('plan');
  };
  
  const handleViewProgress = () => {
    setView('progress');
  };

  const handleDeleteHistoryEntry = (id: string) => {
    if (!currentUser) return;
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(`workoutHistory_${currentUser}`, JSON.stringify(updatedHistory));
  };
  
  const handleClearHistory = () => {
    if (!currentUser) return;
    if (window.confirm("Sei sicuro di voler cancellare tutta la cronologia? L'azione è irreversibile.")) {
        setHistory([]);
        localStorage.removeItem(`workoutHistory_${currentUser}`);
    }
  };

  const handleTrackData = useCallback((entryId: string, trackedData: TrackedData) => {
    if (!currentUser) return;
    const updatedHistory = history.map(entry =>
      entry.id === entryId ? { ...entry, trackedData } : entry
    );
    setHistory(updatedHistory);
    localStorage.setItem(`workoutHistory_${currentUser}`, JSON.stringify(updatedHistory));
  }, [history, currentUser]);
  
  const handleUpdatePlan = useCallback((updatedEntry: HistoryEntry) => {
      if (!currentUser) return;
      const updatedHistory = history.map(entry =>
          entry.id === updatedEntry.id ? updatedEntry : entry
      );
      setHistory(updatedHistory);
      localStorage.setItem(`workoutHistory_${currentUser}`, JSON.stringify(updatedHistory));
      if (currentEntry && currentEntry.id === updatedEntry.id) {
          setCurrentEntry(updatedEntry);
      }
  }, [history, currentEntry, currentUser]);

  const handleCloseGuide = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
        localStorage.setItem('guideSeen', 'true');
    }
    setShowGuide(false);
  };

  const renderContent = () => {
    const isApiKeyMissing = !process.env.API_KEY;
    if (isApiKeyMissing) {
      return <ApiKeyPrompt />;
    }

    if (!currentUser || view === 'login') {
      return <Login onLogin={handleLogin} />;
    }

    switch(view) {
      case 'loading':
        return <Loader />;
      case 'error':
        return (
          <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Riprova
            </button>
          </div>
        );
      case 'progress':
          return <Progress 
                    history={history} 
                    userData={userData}
                    onGoBack={() => setView('form')} 
                 />;
      case 'history':
        return <History 
                  history={history} 
                  onView={handleViewHistoryPlan} 
                  onDelete={handleDeleteHistoryEntry}
                  onClearAll={handleClearHistory}
                  onGoBack={() => setView('form')}
               />;
      case 'plan':
        if (currentEntry) {
          return <WorkoutPlan 
                    entry={currentEntry} 
                    onNewPlan={handleReset} 
                    onTrackData={handleTrackData}
                    onPlanUpdate={handleUpdatePlan}
                 />;
        }
        setView('form');
        return <WorkoutForm key={currentUser} onSubmit={handleGeneratePlan} isLoading={false} userName={currentUser} />;
      case 'form':
      default:
        return <WorkoutForm key={currentUser} onSubmit={handleGeneratePlan} isLoading={view === 'loading'} userName={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900/30 z-0 print:hidden"></div>
      <div className="relative z-10 flex flex-col flex-grow">
        {currentUser && (
            <Header 
                userName={currentUser}
                onLogout={handleLogout}
                onHistoryClick={() => setView('history')} 
                onProgressClick={handleViewProgress}
                onGuideClick={() => setShowGuide(true)}
            />
        )}
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {currentUser && view === 'form' && <InstallPWA />}
            {renderContent()}
          </div>
        </main>
        <Footer />
      </div>
      {currentUser && <GuideModal isOpen={showGuide} onClose={handleCloseGuide} />}
      {currentUser && (
          <WelcomeModal 
              isOpen={showWelcomeModal}
              userName={currentUser}
              onClose={() => setShowWelcomeModal(false)}
              onGoToHistory={() => { setView('history'); setShowWelcomeModal(false); }}
              onGoToNewPlan={() => { setView('form'); setShowWelcomeModal(false); }}
          />
      )}
    </div>
  );
}

export default App;
