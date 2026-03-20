import React, { useState } from 'react';
import { useFitnessData } from './useFitnessData';
import { format } from 'date-fns';
import { Activity, Flame, Dumbbell, HeartPulse, Ruler, RefreshCw, Copy, Download, Upload, X } from 'lucide-react';
import DailyHabits from './components/DailyHabits';
import Diet from './components/Diet';
import Workout from './components/Workout';
import Cardio from './components/Cardio';
import BodyStats from './components/BodyStats';

const tabs = [
  { id: 'daily', name: '习惯', icon: <Activity size={24} /> },
  { id: 'diet', name: '热量', icon: <Flame size={24} /> },
  { id: 'workout', name: '力量', icon: <Dumbbell size={24} /> },
  { id: 'cardio', name: '有氧', icon: <HeartPulse size={24} /> },
  { id: 'body', name: '身体', icon: <Ruler size={24} /> },
];

export default function App() {
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentTab, setCurrentTab] = useState('daily');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [importData, setImportData] = useState('');

  const {
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
  } = useFitnessData(currentDate);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">加载中...</div>;
  }

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd');

  const handleExport = () => {
    const data = {
      profile: JSON.parse(localStorage.getItem('fitness_profile') || '{}'),
      records: JSON.parse(localStorage.getItem('fitness_records') || '{}'),
      sets: JSON.parse(localStorage.getItem('fitness_workout_sets') || '[]')
    };
    const str = JSON.stringify(data);
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(str).then(() => {
        alert('数据已成功复制到剪贴板！请发送到另一台设备。');
      }).catch(() => {
        prompt('复制失败，请手动复制以下内容：', str);
      });
    } else {
      prompt('请手动复制以下内容：', str);
    }
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        alert('请输入要导入的数据！');
        return;
      }
      const imported = JSON.parse(importData);
      
      if (imported.profile) {
        const localProfile = JSON.parse(localStorage.getItem('fitness_profile') || '{}');
        localStorage.setItem('fitness_profile', JSON.stringify({ ...localProfile, ...imported.profile }));
      }

      if (imported.records) {
        const localRecords = JSON.parse(localStorage.getItem('fitness_records') || '{}');
        const mergedRecords = { ...localRecords };
        for (const date in imported.records) {
          mergedRecords[date] = { ...mergedRecords[date], ...imported.records[date] };
        }
        localStorage.setItem('fitness_records', JSON.stringify(mergedRecords));
      }

      if (imported.sets && Array.isArray(imported.sets)) {
        const localSets = JSON.parse(localStorage.getItem('fitness_workout_sets') || '[]');
        const setsMap = new Map();
        localSets.forEach((s: any) => setsMap.set(s.id, s));
        imported.sets.forEach((s: any) => setsMap.set(s.id, s));
        const mergedSets = Array.from(setsMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
        localStorage.setItem('fitness_workout_sets', JSON.stringify(mergedSets));
      }

      alert('数据同步成功！页面将刷新以加载最新数据。');
      window.location.reload();
    } catch (e) {
      alert('导入失败，请检查数据格式是否正确！');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-10 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-sm pt-5 px-4 pb-4 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500">
              我的容量核心
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black bg-indigo-100/80 text-indigo-600 py-1 px-2 rounded-md shadow-sm uppercase tracking-widest">
                {isToday ? '🔥 今日记录' : '📅 历史补录'}
              </span>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-slate-500 text-xs font-bold outline-none border-b border-dashed border-slate-300"
              />
            </div>
          </div>
          <button 
            onClick={() => setShowSyncModal(true)}
            className="p-2 text-indigo-500 hover:text-indigo-600 transition-colors bg-indigo-50 hover:bg-indigo-100 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-1.5"
          >
            <RefreshCw size={18} />
            <span className="text-xs font-bold hidden sm:inline">数据同步</span>
          </button>
        </div>

        <div className="bg-slate-100/50 p-1.5 rounded-2xl flex justify-between gap-1 shadow-inner border border-white/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-300 ${
                currentTab === tab.id
                  ? 'bg-white shadow-sm text-indigo-600 scale-105 border border-white/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={currentTab === tab.id ? 'drop-shadow-sm' : ''}>{tab.icon}</div>
              <span className="text-[11px] font-black tracking-wide">{tab.name}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-6 mt-2">
        {currentTab === 'daily' && <DailyHabits dailyRecord={dailyRecord} updateDailyRecord={updateDailyRecord} allRecords={allRecords} currentDate={currentDate} />}
        {currentTab === 'diet' && <Diet dailyRecord={dailyRecord} updateDailyRecord={updateDailyRecord} profile={profile} allRecords={allRecords} />}
        {currentTab === 'workout' && <Workout dailyRecord={dailyRecord} updateDailyRecord={updateDailyRecord} profile={profile} updateProfile={updateProfile} workoutSets={workoutSets} allWorkoutSets={allWorkoutSets} addWorkoutSet={addWorkoutSet} removeWorkoutSet={removeWorkoutSet} currentDate={currentDate} />}
        {currentTab === 'cardio' && <Cardio dailyRecord={dailyRecord} updateDailyRecord={updateDailyRecord} allRecords={allRecords} />}
        {currentTab === 'body' && <BodyStats dailyRecord={dailyRecord} updateDailyRecord={updateDailyRecord} profile={profile} updateProfile={updateProfile} allRecords={allRecords} />}
      </main>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-white/50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <RefreshCw className="text-indigo-500" size={24} />
                多端数据同步
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Export Section */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-indigo-800 flex items-center gap-2 mb-2">
                  <Download size={18} /> 1. 导出本机数据
                </h4>
                <p className="text-xs text-indigo-600/80 mb-4 leading-relaxed">
                  将当前设备的数据复制为文本，然后通过微信/备忘录等发送到另一台设备。
                </p>
                <button
                  onClick={handleExport}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Copy size={18} />
                  复制本机数据
                </button>
              </div>

              {/* Import Section */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-2">
                  <Upload size={18} /> 2. 导入其他设备数据
                </h4>
                <p className="text-xs text-emerald-600/80 mb-4 leading-relaxed">
                  在下方粘贴来自其他设备的数据。系统会自动合并历史记录，如果存在冲突，<strong className="text-emerald-700">将以您粘贴的新数据为准</strong>。
                </p>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="在此粘贴数据..."
                  className="w-full h-32 p-3 text-xs font-mono bg-white border border-emerald-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
                <button
                  onClick={handleImport}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <RefreshCw size={18} />
                  合并并更新数据
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
