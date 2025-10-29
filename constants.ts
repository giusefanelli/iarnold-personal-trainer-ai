export const GOALS = [
  { id: 'hypertrophy', label: 'Ipertrofia muscolare' },
  { id: 'strength', label: 'Forza' },
  { id: 'fat_loss', label: 'Definizione / Ricomposizione' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Principiante (0-1 anni)' },
  { id: 'intermediate', label: 'Intermedio (1-3 anni)' },
  { id: 'advanced', label: 'Avanzato (3+ anni)' },
];

export const TRAINING_TYPES = [
    { id: 'monofrequenza', label: 'Monofrequenza', description: 'Alleni ogni gruppo muscolare una sola volta a settimana, tipicamente con più esercizi e volume per sessione.' },
    { id: 'multifrequenza', label: 'Multifrequenza', description: 'Alleni ogni gruppo muscolare più volte a settimana, con meno volume per sessione ma una frequenza più alta.' },
];

export const EQUIPMENT_OPTIONS = [
  { id: 'gym', label: 'Palestra completa' },
  { id: 'homegym', label: 'Home Gym (rack, panca, bilanciere/manubri)' },
  { id: 'dumbbells_bands', label: 'Solo manubri ed elastici' },
];

export const MUSCLE_GROUPS = [
  'Petto',
  'Dorso',
  'Spalle',
  'Quadricipiti',
  'Femorali',
  'Glutei',
  'Bicipiti',
  'Tricipiti',
  'Polpacci',
  'Addome',
];

export const RECOMMENDED_SPLITS = [
    { id: 'Lascia decidere all\'IA', label: 'Lascia decidere all\'IA', description: 'L\'IA sceglierà la migliore struttura di allenamento per te in base ai dati forniti.' },
    { id: 'Push/Pull/Legs', label: 'Push/Pull/Legs', description: 'Una divisione classica:\n• Push: Spinta (petto, spalle, tricipiti)\n• Pull: Tirata (dorso, bicipiti)\n• Legs: Gambe e addome' },
    { id: 'Upper/Lower', label: 'Upper/Lower', description: 'Una divisione che separa gli allenamenti tra:\n• Upper: Parte superiore del corpo\n• Lower: Parte inferiore del corpo' },
    { id: 'Front/Rear', label: 'Front/Rear', description: 'Una divisione che separa gli allenamenti tra:\n• Front: Catena cinetica anteriore (petto, spalle, quadricipiti)\n• Rear: Catena cinetica posteriore (dorso, femorali, glutei)' },
    { id: 'Full Body', label: 'Full Body', description: 'Alleni tutti i principali gruppi muscolari del corpo in ogni singola sessione.' },
    { id: 'Chiedi a IArnold', label: 'Chiedi a IArnold', description: 'Descrivi liberamente la scheda che vorresti e l\'IA la creerà per te.' },
];

export const TRAINING_DURATIONS = [
  { id: 'no_preference', label: 'Nessuna preferenza' },
  { id: 'lt_45', label: '< 45 min' },
  { id: '45_60', label: '45-60 min' },
  { id: 'gt_60', label: '> 60 min' },
];