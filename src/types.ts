export interface UserProfile {
  height: number | null;
  age: number | null;
  gender: 'female' | 'male';
  customExercises: Record<string, string[]>;
  hiddenExercises?: string[];
}

export interface DailyRecord {
  date: string;
  habits: Record<string, boolean>;
  calories: {
    intake: number | null;
    burned: number | null;
    bmr: number | null;
  };
  workoutStats: Record<string, { duration: number | null }>;
  pilates: { duration: number | null };
  treadmill: { duration: number | null };
  body: {
    weight: number | null;
    bust: number | null;
    waist: number | null;
    hips: number | null;
  };
  noWorkout: boolean;
  noCardio: boolean;
}

export interface WorkoutSet {
  id: string;
  date: string;
  part: string;
  exercise: string;
  weight: number;
  reps: number;
  timestamp: number;
}
