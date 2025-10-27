import React, { useState, useCallback, useEffect } from 'react';
import { UserData, HistoryEntry, TrackedData, View, FormCheckTarget } from './types';
import { generateWorkoutPlan, generateWorkoutSummary } from './services/geminiService';
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
import FormCheckView from './components/FormCheckView';
import Dashboard from './components/Dashboard';
import PostWorkoutSummaryModal from './components/PostWorkoutSummaryModal';
import ShareModal from './components/ShareModal';

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [view, setView] = useState<View>('login');
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [formCheckTarget, setFormCheckTarget] = useState<FormCheckTarget | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);


  const loadUserDataFor = (userName: string) => {
    try {
      const savedHistory = localStorage.getItem(`workoutHistory_${userName}`);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      
      const savedUserData = localStorage.getItem(`workoutFormData_${userName}`);
      if (savedUserData) setUserData(JSON.parse(savedUserData));

      const guideSeen = localStorage.getItem(`guideSeen_${userName}`);
      if (!guideSeen) {
        setShowGuide(true);
        // Do not set guideSeen here, let the modal do it based on user preference
      }

    } catch (e) {
      console.error("Failed to load user data from localStorage", e);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      loadUserDataFor(savedUser);

      // Handle hash routing for PWA shortcuts
      const hash = window.location.hash;
      if (hash === '#new-plan') {
          setView('form');
      } else if (hash === '#progress') {
          setView('progress');
      } else {
          setView('dashboard');
      }

      const welcomeModalShown = sessionStorage.getItem(`welcomeModalShown_${savedUser}`);
       if (!welcomeModalShown) {
        setShowWelcomeModal(true);
        sessionStorage.setItem(`welcomeModalShown_${savedUser}`, 'true');
      }
    }
  }, []);
  
  const handleLogin = (name: string, rememberMe: boolean) => {
    setCurrentUser(name);
    if (rememberMe) {
      localStorage.setItem('currentUser', name);
    }
    loadUserDataFor(name);
    setView('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm("Sei sicuro di voler uscire? I tuoi dati di allenamento verranno conservati per il tuo prossimo accesso.")) {
      // Don't remove 'currentUser' if it was saved with 'rememberMe'
      sessionStorage.removeItem(`welcomeModalShown_${currentUser}`);
      setCurrentUser(null);
      setHistory([]);
      setUserData(null);
      setCurrentEntry(null);
      setView('login');
      setShowWelcomeModal(false);
    }
  };

  const performGeneration = useCallback(async (newUserData: Omit<UserData, 'name'>, lastWorkout: HistoryEntry | null = null) => {
    if (!currentUser) return;
    
    const fullUserData: UserData = { ...newUserData, name: currentUser };
    
    setView('loading');
    setError(null);
    setCurrentEntry(null);
    setUserData(fullUserData); 

    try {
      const plan = await generateWorkoutPlan(fullUserData, lastWorkout);
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

  const handleGeneratePlan = (newUserData: Omit<UserData, 'name'>) => {
    performGeneration(newUserData);
  };
  
  const handleGenerateProgression = (newUserData: Omit<UserData, 'name'>) => {
    const lastTrackedWorkout = history.find(entry => entry.trackedData && Object.keys(entry.trackedData).length > 0);
    performGeneration(newUserData, lastTrackedWorkout || null);
  };
  
  const handleFinishWorkout = async (finishedEntry: HistoryEntry) => {
      // Use the entry passed from the component, which now includes the latest tracked data
      if (!finishedEntry.trackedData || Object.keys(finishedEntry.trackedData).length === 0) {
        alert("Registra almeno un peso prima di terminare l'allenamento per ricevere un riepilogo.");
        return;
      }

      // Also update the main history state with this final tracked data
      handleTrackData(finishedEntry.id, finishedEntry.trackedData);

      setIsSummaryLoading(true);
      setShowSummaryModal(true);
      setSummaryContent('');
      try {
        const summary = await generateWorkoutSummary(finishedEntry);
        setSummaryContent(summary);
      } catch (err) {
        console.error(err);
        setSummaryContent("Non è stato possibile generare un riepilogo. Ottimo lavoro comunque!");
      } finally {
        setIsSummaryLoading(false);
      }
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
    setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(entry =>
            entry.id === entryId ? { ...entry, trackedData } : entry
        );
        localStorage.setItem(`workoutHistory_${currentUser}`, JSON.stringify(updatedHistory));
        return updatedHistory;
    });
  }, [currentUser]);
  
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
    if (dontShowAgain && currentUser) {
        localStorage.setItem(`guideSeen_${currentUser}`, 'true');
    }
    setShowGuide(false);
  };

  const handleStartFormCheck = (exerciseName: string) => {
    setFormCheckTarget({ exerciseName });
    setView('formCheck');
  };

  const handleEndFormCheck = () => {
    setFormCheckTarget(null);
    setView('plan');
  };

  const renderContent = () => {
    const isApiKeyMissing = !process.env.API_KEY;
    if (isApiKeyMissing) {
      return <ApiKeyPrompt />;
    }

    if (!currentUser) {
      return <Login onLogin={handleLogin} />;
    }

    switch(view) {
      case 'dashboard':
        return <Dashboard 
                  userName={currentUser}
                  history={history}
                  onStartWorkout={(entry) => {
                    setCurrentEntry(entry);
                    setView('plan');
                  }}
                  onNewPlan={() => setView('form')}
               />
      case 'loading':
        return <Loader />;
      case 'error':
        return (
          <div className="text-center p-8 bg-red-900/20 backdrop-blur-sm border border-red-500 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-2">ERRORE</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => setView('form')}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Riprova
            </button>
          </div>
        );
      case 'formCheck':
        if (formCheckTarget) {
          return <FormCheckView 
                    target={formCheckTarget} 
                    onExit={handleEndFormCheck} 
                 />;
        }
        setView('plan'); 
        return null;
      case 'progress':
          return <Progress 
                    history={history} 
                    userData={userData}
                    onGoBack={() => setView('dashboard')} 
                 />;
      case 'history':
        return <History 
                  history={history} 
                  onView={handleViewHistoryPlan} 
                  onDelete={handleDeleteHistoryEntry}
                  onClearAll={handleClearHistory}
                  onGoBack={() => setView('dashboard')}
               />;
      case 'plan':
        if (currentEntry) {
          return <WorkoutPlan 
                    entry={currentEntry} 
                    onNewPlan={() => setView('form')} 
                    onTrackData={handleTrackData}
                    onPlanUpdate={handleUpdatePlan}
                    onStartFormCheck={handleStartFormCheck}
                    onFinishWorkout={handleFinishWorkout}
                    onGoBack={() => setView('dashboard')}
                 />;
        }
        setView('dashboard');
        return null;
      case 'form':
      default:
        return <WorkoutForm 
                  key={currentUser} 
                  onSubmit={handleGeneratePlan} 
                  onGenerateProgression={handleGenerateProgression}
                  isLoading={view === 'loading'} 
                  userName={currentUser}
                  hasHistory={history.length > 0} 
                  onGoBack={() => setView('dashboard')}
               />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none print:hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500 rounded-full opacity-10 blur-3xl filter aurora-1"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 bg-amber-500 rounded-full opacity-5 blur-3xl filter aurora-2"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-grow">
        {currentUser && view !== 'formCheck' && (
            <Header 
                userName={currentUser}
                onLogout={handleLogout}
                onHistoryClick={() => setView('history')} 
                onProgressClick={() => setView('progress')}
                onGuideClick={() => setShowGuide(true)}
                onHomeClick={() => setView('dashboard')}
                onShareClick={() => setShowShareModal(true)}
            />
        )}
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {currentUser && view === 'dashboard' && <InstallPWA />}
            {renderContent()}
          </div>
        </main>
        {view !== 'formCheck' && <Footer />}
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
      {showSummaryModal && (
          <PostWorkoutSummaryModal
              isOpen={showSummaryModal}
              isLoading={isSummaryLoading}
              summaryText={summaryContent}
              onClose={() => setShowSummaryModal(false)}
          />
      )}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
}

export default App;