export interface UserData {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  equipment: 'gym' | 'homegym' | 'dumbbells_bands';
  trainingDays: number;
  goal: 'hypertrophy' | 'strength' | 'fat_loss';
  experience: 'beginner' | 'intermediate' | 'advanced';
  trainingType: 'monofrequenza' | 'multifrequenza';
  trainingDuration?: 'lt_45' | '45_60' | 'gt_60';
  focusMuscleGroups: string[];
  recommendedSplit?: string;
  customSplitDescription?: string;
  previousPlan?: {
    content: string; // base64 for image/pdf/word, raw text for txt
    type: 'image' | 'text' | 'pdf' | 'word';
    mimeType?: string; // e.g., 'image/jpeg', 'application/pdf'
  };
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  note?: string;
}

export interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlanType {
  title: {
    mainTitle: string;
    subtitle: string;
  };
  description: string;
  notes: string[];
  plan: DayPlan[];
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface TrackedSetData {
  weight: string;
  reps: string;
}

export interface TrackedExerciseData {
  sets: TrackedSetData[];
  notes: string;
}

export interface TrackedData {
  [dayIndex: string]: {
    [exerciseIndex: string]: TrackedExerciseData;
  };
}


export interface HistoryEntry {
  id: string;
  createdAt: string;
  userData: UserData;
  plan: WorkoutPlanType;
  trackedData?: TrackedData;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type View = 'login' | 'form' | 'plan' | 'history' | 'loading' | 'error' | 'progress' | 'formCheck' | 'dashboard';

export interface FormCheckTarget {
  exerciseName: string;
}
