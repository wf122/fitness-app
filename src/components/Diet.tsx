import React, { useMemo } from 'react';
import { DailyRecord, UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Props {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  profile: UserProfile;
  allRecords: Record<string, DailyRecord>;
}

export default function Diet({ dailyRecord, updateDailyRecord, profile, allRecords }: Props) {
  const bmr = useMemo(() => {
    const w = dailyRecord.body.weight || 0;
    const h = profile.height || 0;
    const a = profile.age || 25;
    const g = profile.gender || 'female';
    if (!w || !h) return 0;
    let base = 10 * w + 6.25 * h - 5 * a;
    return Math.round(g === 'male' ? base + 5 : base - 161);
  }, [dailyRecord.body.weight, profile]);

  const strBurn = useMemo(() => {
    if (dailyRecord.noWorkout) return 0;
    let t = 0;
    ['胸', '背', '肩', '腿', '手臂'].forEach((p) => {
      t += dailyRecord.workoutStats[p]?.duration || 0;
    });
    // Simplified volume calculation since we don't have all sets in this component easily,
    // we'll just use duration for now or assume a flat rate.
    return Math.round(t * 4);
  }, [dailyRecord.workoutStats, dailyRecord.noWorkout]);

  const cardioBurn = useMemo(() => {
    if (dailyRecord.noCardio) return 0;
    const pilTime = dailyRecord.pilates.duration || 0;
    const runTime = dailyRecord.treadmill.duration || 0;
    return pilTime * 5 + runTime * 8;
  }, [dailyRecord.pilates.duration, dailyRecord.treadmill.duration, dailyRecord.noCardio]);

  const autoBurned = strBurn + cardioBurn;
  const intake = dailyRecord.calories.intake || 0;
  const calorieDiff = intake - (autoBurned + bmr);

  const chartData = useMemo(() => {
    return Object.entries(allRecords)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, record]) => {
        const recIntake = record.calories?.intake || 0;
        const recBurned = record.calories?.burned || 0;
        const recBmr = record.calories?.bmr || 0;
        const diff = recIntake > 0 ? recIntake - (recBurned + recBmr) : 0;
        return {
          date: format(parseISO(date), 'MM-dd'),
          diff,
        };
      })
      .filter((d) => d.diff !== 0);
  }, [allRecords]);

  // Update calories in DB when they change
  React.useEffect(() => {
    if (
      dailyRecord.calories.bmr !== bmr ||
      dailyRecord.calories.burned !== autoBurned
    ) {
      updateDailyRecord({
        calories: {
          ...dailyRecord.calories,
          bmr,
          burned: autoBurned,
        },
      });
    }
  }, [bmr, autoBurned]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60">
          <span className="font-bold text-slate-800 text-lg flex items-center gap-2">🔥 饮食与热量缺口</span>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
            <span className="text-sm font-bold text-slate-700">🍔 摄入总热量</span>
            <div className="flex items-center">
              <input
                type="number"
                value={dailyRecord.calories.intake || ''}
                onChange={(e) =>
                  updateDailyRecord({
                    calories: { ...dailyRecord.calories, intake: Number(e.target.value) },
                  })
                }
                placeholder="输入 kcal"
                className="w-24 p-2 bg-transparent border-b-2 border-indigo-200 text-center font-black text-indigo-600 focus:border-indigo-500 outline-none transition-colors text-xl"
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-bold text-slate-600">🏃‍♂️ 运动总消耗</span>
            <span className="font-black text-pink-500 text-2xl">
              {autoBurned} <span className="text-xs text-slate-400 font-bold">kcal</span>
            </span>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-bold text-slate-600">🫀 基础代谢 (BMR)</span>
            <span className="font-black text-slate-500 text-2xl">
              {bmr} <span className="text-xs text-slate-400 font-bold">kcal</span>
            </span>
          </div>

          <div className="pt-5 border-t border-slate-200/50 flex justify-between items-center">
            <span className="font-black text-slate-800 text-lg">今日热量差</span>
            <div className="text-right bg-white/80 px-5 py-3 rounded-2xl shadow-sm border border-white">
              <span className={`font-black text-3xl ${calorieDiff < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {calorieDiff > 0 ? '+' : ''}
                {calorieDiff}
              </span>
              <span className="text-xs text-slate-500 font-bold ml-1">kcal</span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/40 p-5 border-t border-white/60 text-xs text-slate-500 space-y-4">
          <h4 className="font-extrabold text-indigo-800 flex items-center gap-1 text-sm">ℹ️ 卡路里引擎计算明细</h4>
          <div>
            <p className="font-bold text-slate-700 mb-1">1. 基础代谢 (Mifflin-St Jeor)</p>
            <p className="font-mono bg-white/80 p-2.5 rounded-lg border border-indigo-50 overflow-x-auto whitespace-nowrap shadow-sm">
              10×{dailyRecord.body.weight || 0} + 6.25×{profile.height || 0} - 5×{profile.age || 0}{' '}
              {profile.gender === 'male' ? '+ 5' : '- 161'} = <span className="text-indigo-600 font-bold">{bmr}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">热量差趋势 (kcal)</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.4)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#334155', fontWeight: 'bold' }}
              />
              <Bar dataKey="diff" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.diff < 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
