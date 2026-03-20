import React, { useState, useMemo, useEffect } from 'react';
import { DailyRecord, UserProfile, WorkoutSet } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Timer, Play, Square, X, Edit2 } from 'lucide-react';

interface Props {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  workoutSets: WorkoutSet[];
  allWorkoutSets: WorkoutSet[];
  addWorkoutSet: (set: Omit<WorkoutSet, 'id'>) => void;
  removeWorkoutSet: (id: string) => void;
  currentDate: string;
}

const exerciseLibrary: Record<string, string[]> = {
  胸: ['史密斯平推', '下胸器械', '胸外沿器械', '上胸ISO', '三头器械', '绳索夹胸', '器械夹胸'],
  背: ['单边下拉器械', '单边划船', '高位下拉绳索', 't-bar', '低背划船', '二头弯举', '蝴蝶机背', '绳索下压', '高位下拉'],
  肩: ['后飞鸟器械', '肩推器械', '绳索面拉', '中后器械', '卷腹'],
  腿: ['深蹲', '硬拉', '前侧器械', '后侧器械', '夹腿器械', '外展臀器械', '臀蹬器械'],
  手臂: ['三头固定器械', '三头绳索下拉', '三头绳索过头', '二头锤式弯举', '二头器械'],
};

export default function Workout({
  dailyRecord,
  updateDailyRecord,
  profile,
  updateProfile,
  workoutSets,
  allWorkoutSets,
  addWorkoutSet,
  removeWorkoutSet,
  currentDate,
}: Props) {
  const [currentPart, setCurrentPart] = useState('胸');
  const [currentExercise, setCurrentExercise] = useState('史密斯平推');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [chartSelectedExercise, setChartSelectedExercise] = useState('');

  // Tag Management State
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagModal, setTagModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit' | 'delete';
    targetTag?: string;
    inputValue?: string;
  }>({ isOpen: false, mode: 'add' });

  // Rest Timer State
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1);
      }, 1000);
    } else if (restTime === 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const startRest = () => {
    setRestTime(90); // Default 90 seconds
    setIsResting(true);
  };

  const stopRest = () => {
    setIsResting(false);
    setRestTime(0);
  };

  const currentExerciseList = useMemo(() => {
    const baseList = exerciseLibrary[currentPart] || [];
    const customList = profile.customExercises[currentPart] || [];
    const hidden = profile.hiddenExercises || [];
    return [...baseList, ...customList].filter(ex => !hidden.includes(ex));
  }, [currentPart, profile.customExercises, profile.hiddenExercises]);

  const selectPart = (part: string) => {
    setCurrentPart(part);
    const baseList = exerciseLibrary[part] || [];
    const customList = profile.customExercises[part] || [];
    const hidden = profile.hiddenExercises || [];
    const combined = [...baseList, ...customList].filter(ex => !hidden.includes(ex));
    setCurrentExercise(combined.length > 0 ? combined[0] : '');
    setIsEditingTags(false);
  };

  const openAddModal = () => setTagModal({ isOpen: true, mode: 'add', inputValue: '' });
  const openEditModal = (tag: string) => setTagModal({ isOpen: true, mode: 'edit', targetTag: tag, inputValue: tag });
  const openDeleteModal = (tag: string) => setTagModal({ isOpen: true, mode: 'delete', targetTag: tag });
  const closeTagModal = () => setTagModal({ isOpen: false, mode: 'add' });

  const handleTagModalConfirm = () => {
    const { mode, targetTag, inputValue } = tagModal;
    const trimmed = inputValue?.trim() || '';

    if (mode === 'add') {
      if (!trimmed) return closeTagModal();
      if (currentExerciseList.includes(trimmed)) return;
      const customEx = { ...profile.customExercises };
      if (!customEx[currentPart]) customEx[currentPart] = [];
      customEx[currentPart].push(trimmed);
      updateProfile({ customExercises: customEx });
      setCurrentExercise(trimmed);
      setWeight('');
      setReps('');
    } else if (mode === 'edit' && targetTag) {
      if (!trimmed || trimmed === targetTag) return closeTagModal();
      if (currentExerciseList.includes(trimmed)) return;
      const isDefault = (exerciseLibrary[currentPart] || []).includes(targetTag);
      const customEx = { ...profile.customExercises };
      if (!customEx[currentPart]) customEx[currentPart] = [];

      if (isDefault) {
        const hidden = profile.hiddenExercises || [];
        updateProfile({
          hiddenExercises: [...hidden, targetTag],
          customExercises: {
            ...customEx,
            [currentPart]: [...customEx[currentPart], trimmed]
          }
        });
      } else {
        customEx[currentPart] = customEx[currentPart].map(ex => ex === targetTag ? trimmed : ex);
        updateProfile({ customExercises: customEx });
      }
      if (currentExercise === targetTag) setCurrentExercise(trimmed);
    } else if (mode === 'delete' && targetTag) {
      const isDefault = (exerciseLibrary[currentPart] || []).includes(targetTag);
      if (isDefault) {
        const hidden = profile.hiddenExercises || [];
        updateProfile({ hiddenExercises: [...hidden, targetTag] });
      } else {
        const customEx = { ...profile.customExercises };
        if (customEx[currentPart]) {
          customEx[currentPart] = customEx[currentPart].filter(ex => ex !== targetTag);
          updateProfile({ customExercises: customEx });
        }
      }
      if (currentExercise === targetTag) {
        const remaining = currentExerciseList.filter(ex => ex !== targetTag);
        setCurrentExercise(remaining.length > 0 ? remaining[0] : '');
      }
    }
    closeTagModal();
  };

  const lastRecordStats = useMemo(() => {
    let lastRecord = { weight: null as number | null, reps: null as number | null };
    const sortedSets = [...allWorkoutSets].sort((a, b) => b.timestamp - a.timestamp);
    const match = sortedSets.find((s) => s.exercise === currentExercise && s.date !== currentDate);
    if (match) {
      lastRecord = { weight: match.weight, reps: match.reps };
    }
    return lastRecord;
  }, [allWorkoutSets, currentExercise, currentDate]);

  const fillLastRecord = () => {
    if (lastRecordStats.weight) {
      setWeight(lastRecordStats.weight.toString());
      setReps(lastRecordStats.reps?.toString() || '');
    }
  };

  const saveWorkoutSet = () => {
    if (!weight || !reps || !currentExercise) return;
    addWorkoutSet({
      date: currentDate,
      part: currentPart,
      exercise: currentExercise,
      weight: parseFloat(weight),
      reps: parseInt(reps, 10),
      timestamp: Date.now(),
    });
    setWeight('');
    setReps('');
    if (!chartSelectedExercise) setChartSelectedExercise(currentExercise);
    startRest(); // Start rest timer automatically after saving a set
  };

  const allTrackedExercises = useMemo(() => {
    const exSet = new Set<string>();
    allWorkoutSets.forEach((s) => exSet.add(s.exercise));
    return Array.from(exSet).sort();
  }, [allWorkoutSets]);

  const chartData = useMemo(() => {
    if (!chartSelectedExercise) return [];
    const dataMap: Record<string, number> = {};
    allWorkoutSets.forEach((s) => {
      if (s.exercise === chartSelectedExercise && s.weight && s.reps) {
        const e1RM = s.weight * (1 + s.reps / 30);
        if (!dataMap[s.date] || e1RM > dataMap[s.date]) {
          dataMap[s.date] = e1RM;
        }
      }
    });
    return Object.entries(dataMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, e1RM]) => ({
        date: format(parseISO(date), 'MM-dd'),
        e1RM: parseFloat(e1RM.toFixed(1)),
      }));
  }, [allWorkoutSets, chartSelectedExercise]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <label className="flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-md shadow-lg border border-white p-5 rounded-3xl cursor-pointer hover:shadow-xl transition">
        <input
          type="checkbox"
          checked={dailyRecord.noWorkout}
          onChange={(e) => updateDailyRecord({ noWorkout: e.target.checked })}
          className="w-6 h-6 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
        <span className="font-extrabold text-slate-700 text-lg">设为休息日 (不举铁)</span>
      </label>

      {!dailyRecord.noWorkout && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-5 relative overflow-hidden">
          {/* Rest Timer Overlay */}
          {isResting && (
            <div className="absolute top-0 right-0 m-4 bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 z-10 animate-pulse">
              <Timer size={18} />
              <span className="font-black font-mono text-lg">{formatTime(restTime)}</span>
              <button onClick={stopRest} className="ml-2 bg-white/20 p-1 rounded-lg hover:bg-white/30 transition">
                <Square size={14} fill="currentColor" />
              </button>
            </div>
          )}

          <h2 className="font-black text-slate-800 text-lg border-b border-slate-200/50 pb-3 mb-4">力量指挥中心</h2>

          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Step 1. 目标大类</label>
            <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
              {Object.keys(exerciseLibrary).map((part) => (
                <button
                  key={part}
                  onClick={() => selectPart(part)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    currentPart === part
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white text-slate-600 border border-slate-100 shadow-sm'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">Step 2. 当前动作 / 标签</label>
              <button
                onClick={() => setIsEditingTags(!isEditingTags)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm ${isEditingTags ? 'bg-indigo-500 text-white' : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200'}`}
              >
                {isEditingTags ? '完成管理' : '管理标签'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              {currentExerciseList.map((act) => (
                <div key={act} className="relative group">
                  <button
                    onClick={() => isEditingTags ? openEditModal(act) : setCurrentExercise(act)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      currentExercise === act && !isEditingTags
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : isEditingTags
                        ? 'bg-white text-slate-600 border border-slate-300 border-dashed pr-8 hover:bg-slate-50'
                        : 'bg-white text-slate-600 border border-white shadow-sm'
                    }`}
                  >
                    {isEditingTags && <Edit2 size={12} className="text-slate-400" />}
                    {act}
                  </button>
                  {isEditingTags && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteModal(act); }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors shadow-sm"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {!isEditingTags && (
                <button
                  onClick={openAddModal}
                  className="px-3 py-1.5 rounded-xl text-sm font-bold text-indigo-500 border-2 border-dashed border-indigo-300 bg-white/60 hover:bg-indigo-50 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                >
                  <span className="text-lg leading-none">+</span> 自定义
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-5">
            <div className="flex-1 bg-white/60 p-3 rounded-2xl border border-white shadow-sm">
              <label className="block text-xs font-bold text-slate-500 mb-1 text-center">重量 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-300 p-2 text-center text-3xl font-black text-slate-800 focus:border-indigo-500 outline-none transition"
              />
              <p className="text-[10px] font-bold text-indigo-400 mt-2 text-center">最好: {lastRecordStats.weight || '--'}</p>
            </div>
            <div className="flex-1 bg-white/60 p-3 rounded-2xl border border-white shadow-sm">
              <label className="block text-xs font-bold text-slate-500 mb-1 text-center">次数</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-300 p-2 text-center text-3xl font-black text-slate-800 focus:border-indigo-500 outline-none transition"
              />
              <p className="text-[10px] font-bold text-indigo-400 mt-2 text-center">最好: {lastRecordStats.reps || '--'}</p>
            </div>
          </div>

          <div className="flex gap-3 mb-5">
            <button
              onClick={fillLastRecord}
              disabled={!lastRecordStats.weight}
              className="flex-[0.8] bg-white text-indigo-600 font-bold py-3.5 rounded-2xl text-sm shadow-sm border border-indigo-100 transition disabled:opacity-50 active:scale-95"
            >
              ⚡ 填入上次
            </button>
            <button
              onClick={saveWorkoutSet}
              className="flex-[1.2] bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black py-3.5 rounded-2xl transition shadow-lg shadow-slate-500/20 active:scale-95 text-lg"
            >
              💾 记录本组
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-200/50">
            <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">分类总时长 (计算消耗)</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={dailyRecord.workoutStats[currentPart]?.duration || ''}
                  onChange={(e) =>
                    updateDailyRecord({
                      workoutStats: {
                        ...dailyRecord.workoutStats,
                        [currentPart]: { duration: Number(e.target.value) },
                      },
                    })
                  }
                  placeholder="分钟"
                  className="w-full p-4 pl-4 border border-white rounded-2xl bg-white/60 shadow-sm focus:bg-white outline-none font-black text-xl text-slate-700"
                />
                <span className="absolute right-4 top-4 text-slate-400 font-bold">min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!dailyRecord.noWorkout && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>今日容量池</span>
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">{workoutSets.length} 组</span>
          </h3>
          {workoutSets.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8 bg-white/40 rounded-2xl border border-dashed border-slate-300 font-bold">
              暂无数据，干就完了！
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
              {workoutSets.map((set) => (
                <div key={set.id} className="flex justify-between items-center bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                  <div>
                    <span className="font-black text-slate-700 block text-base">{set.exercise}</span>
                    <span className="font-mono text-indigo-500 font-black text-sm mt-1 block">
                      {set.weight}
                      <span className="text-xs text-slate-400 font-bold">kg</span> × {set.reps}
                      <span className="text-xs text-slate-400 font-bold">次</span>
                    </span>
                  </div>
                  <button
                    onClick={() => removeWorkoutSet(set.id)}
                    className="text-sm text-rose-500 font-bold bg-rose-50 px-4 py-2.5 rounded-xl active:scale-95 transition"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-4">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-sm font-bold text-slate-800">📈 强度进化 (e1RM)</span>
          <select
            value={chartSelectedExercise}
            onChange={(e) => setChartSelectedExercise(e.target.value)}
            className="text-sm border border-white rounded-xl py-2 px-3 bg-white/80 shadow-sm text-slate-700 font-bold outline-none max-w-[140px] truncate"
          >
            <option value="">选择动作...</option>
            {allTrackedExercises.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.4)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#334155', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="e1RM" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {tagModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-white/50">
            <h3 className="text-lg font-black text-slate-800 mb-4">
              {tagModal.mode === 'add' ? `添加【${currentPart}】动作标签` : tagModal.mode === 'edit' ? '重命名标签' : '删除标签'}
            </h3>

            {tagModal.mode === 'delete' ? (
              <p className="text-slate-600 mb-6 font-medium">确定要删除标签「<span className="font-bold text-rose-500">{tagModal.targetTag}</span>」吗？</p>
            ) : (
              <input
                type="text"
                autoFocus
                value={tagModal.inputValue}
                onChange={(e) => setTagModal({ ...tagModal, inputValue: e.target.value })}
                placeholder="输入标签名称..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={closeTagModal}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTagModalConfirm}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-colors ${
                  tagModal.mode === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
