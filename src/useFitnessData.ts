import { useState, useEffect } from 'react';
import { DailyRecord, UserProfile, WorkoutSet } from './types';
import { format } from 'date-fns';

export const getEmptyDailyRecord = (date: string): DailyRecord => ({
  date,
  habits: { arms: false, legs: false, creatine: false, water: false, sleep: false },
  calories: { intake: null, burned: null, bmr: null },
  workoutStats: {
    '胸': { duration: null },
    '背': { duration: null },
    '肩': { duration: null },
    '腿': { duration: null },
    '手臂': { duration: null },
  },
  pilates: { duration: null },
  treadmill: { duration: null },
  body: { weight: null, bust: null, waist: null, hips: null },
  noWorkout: false,
  noCardio: false,
});

export const defaultProfile: UserProfile = {
  height: null,
  age: null,
  gender: 'female',
  customExercises: {},
  hiddenExercises: [],
};

export function useFitnessData(currentDate: string) {
  const user = { uid: 'local-user' };
  
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [dailyRecord, setDailyRecord] = useState<DailyRecord>(getEmptyDailyRecord(currentDate));
  const [allRecords, setAllRecords] = useState<Record<string, DailyRecord>>({});
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [allWorkoutSets, setAllWorkoutSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('fitness_profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      const storedRecords = localStorage.getItem('fitness_records');
      if (storedRecords) {
        const parsedRecords = JSON.parse(storedRecords);
        setAllRecords(parsedRecords);
        if (parsedRecords[currentDate]) {
          setDailyRecord({ ...getEmptyDailyRecord(currentDate), ...parsedRecords[currentDate] });
        }
      }

      const storedSets = localStorage.getItem('fitness_workout_sets');
      if (storedSets) {
        const parsedSets = JSON.parse(storedSets) as WorkoutSet[];
        // Sort by timestamp descending
        parsedSets.sort((a, b) => b.timestamp - a.timestamp);
        setAllWorkoutSets(parsedSets);
        setWorkoutSets(parsedSets.filter(s => s.date === currentDate));
      }
    } catch (e) {
      console.error("Error loading data from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // When currentDate changes, update dailyRecord and workoutSets
  useEffect(() => {
    if (loading) return;
    
    if (allRecords[currentDate]) {
      setDailyRecord({ ...getEmptyDailyRecord(currentDate), ...allRecords[currentDate] });
    } else {
      setDailyRecord(getEmptyDailyRecord(currentDate));
    }

    setWorkoutSets(allWorkoutSets.filter(s => s.date === currentDate));
  }, [currentDate, allRecords, allWorkoutSets, loading]);

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    const merged = { ...profile, ...newProfile };
    setProfile(merged);
    localStorage.setItem('fitness_profile', JSON.stringify(merged));
  };

  const updateDailyRecord = async (newRecord: Partial<DailyRecord>) => {
    const merged = { ...dailyRecord, ...newRecord };
    setDailyRecord(merged);
    
    const updatedAllRecords = { ...allRecords, [currentDate]: merged };
    setAllRecords(updatedAllRecords);
    localStorage.setItem('fitness_records', JSON.stringify(updatedAllRecords));
  };

  const addWorkoutSet = async (set: Omit<WorkoutSet, 'id'>) => {
    const newId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newSet: WorkoutSet = { ...set, id: newId };
    
    const updatedSets = [newSet, ...allWorkoutSets];
    // Sort by timestamp descending
    updatedSets.sort((a, b) => b.timestamp - a.timestamp);
    
    setAllWorkoutSets(updatedSets);
    setWorkoutSets(updatedSets.filter(s => s.date === currentDate));
    localStorage.setItem('fitness_workout_sets', JSON.stringify(updatedSets));
  };

  const removeWorkoutSet = async (setId: string) => {
    const updatedSets = allWorkoutSets.filter(s => s.id !== setId);
    setAllWorkoutSets(updatedSets);
    setWorkoutSets(updatedSets.filter(s => s.date === currentDate));
    localStorage.setItem('fitness_workout_sets', JSON.stringify(updatedSets));
  };

  return {
    user,
    profile,
    dailyRecord,
    allRecords,
    workoutSets,
    allWorkoutSets,
    loading,
    updateProfile,
    updateDailyRecord,
    addWorkoutSet,
    removeWorkoutSet,
  };
}
