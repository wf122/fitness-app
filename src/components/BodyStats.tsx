import React, { useMemo } from 'react';
import { DailyRecord, UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Props {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  allRecords: Record<string, DailyRecord>;
}

export default function BodyStats({ dailyRecord, updateDailyRecord, profile, updateProfile, allRecords }: Props) {
  const chartData = useMemo(() => {
    return Object.entries(allRecords)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, record]) => ({
        date: format(parseISO(date), 'MM-dd'),
        weight: record.body?.weight || null,
        bust: record.body?.bust || null,
        waist: record.body?.waist || null,
        hips: record.body?.hips || null,
      }))
      .filter((d) => d.weight || d.bust || d.waist || d.hips);
  }, [allRecords]);

  const renderChart = (dataKey: string, title: string, color: string) => (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">{title}</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.4)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#334155', fontWeight: 'bold' }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60 bg-white/40">
          <span className="font-bold text-slate-800 text-sm">🌐 个人专属档案 (仅需设置一次)</span>
        </div>
        <div className="p-5 flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 block mb-2 text-center">性别</label>
            <select
              value={profile.gender}
              onChange={(e) => updateProfile({ gender: e.target.value as 'male' | 'female' })}
              className="w-full p-3 border border-white rounded-2xl text-sm font-black text-slate-700 bg-white/60 outline-none shadow-sm text-center"
            >
              <option value="female">女</option>
              <option value="male">男</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 block mb-2 text-center">年龄</label>
            <input
              type="number"
              value={profile.age || ''}
              onChange={(e) => updateProfile({ age: Number(e.target.value) })}
              className="w-full p-3 border border-white rounded-2xl text-center text-sm font-black text-slate-700 bg-white/60 outline-none shadow-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 block mb-2 text-center">身高(cm)</label>
            <input
              type="number"
              step="0.1"
              value={profile.height || ''}
              onChange={(e) => updateProfile({ height: Number(e.target.value) })}
              className="w-full p-3 border border-white rounded-2xl text-center text-sm font-black text-indigo-600 bg-white/60 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60">
          <span className="font-bold text-slate-800 text-lg">今日体重与围度</span>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between bg-white/60 p-5 rounded-3xl border border-white shadow-sm">
            <span className="font-black text-slate-700 text-lg">⚖️ 体重 (kg)</span>
            <input
              type="number"
              step="0.1"
              value={dailyRecord.body.weight || ''}
              onChange={(e) =>
                updateDailyRecord({
                  body: { ...dailyRecord.body, weight: Number(e.target.value) },
                })
              }
              className="w-28 p-2 bg-transparent border-b-4 border-emerald-200 text-center font-black text-emerald-500 text-3xl focus:border-emerald-500 outline-none transition"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
              <label className="text-xs font-bold text-slate-500 block text-center mb-2">胸围</label>
              <input
                type="number"
                step="0.1"
                value={dailyRecord.body.bust || ''}
                onChange={(e) =>
                  updateDailyRecord({
                    body: { ...dailyRecord.body, bust: Number(e.target.value) },
                  })
                }
                className="w-full bg-transparent border-b-2 border-slate-300 p-1 text-center text-xl font-black text-slate-700 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
              <label className="text-xs font-bold text-slate-500 block text-center mb-2">腰围</label>
              <input
                type="number"
                step="0.1"
                value={dailyRecord.body.waist || ''}
                onChange={(e) =>
                  updateDailyRecord({
                    body: { ...dailyRecord.body, waist: Number(e.target.value) },
                  })
                }
                className="w-full bg-transparent border-b-2 border-slate-300 p-1 text-center text-xl font-black text-slate-700 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
              <label className="text-xs font-bold text-slate-500 block text-center mb-2">臀围</label>
              <input
                type="number"
                step="0.1"
                value={dailyRecord.body.hips || ''}
                onChange={(e) =>
                  updateDailyRecord({
                    body: { ...dailyRecord.body, hips: Number(e.target.value) },
                  })
                }
                className="w-full bg-transparent border-b-2 border-slate-300 p-1 text-center text-xl font-black text-slate-700 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {renderChart('weight', '⚖️ 体重变化 (kg)', '#10b981')}
        {renderChart('bust', '📏 胸围变化 (cm)', '#4f46e5')}
        {renderChart('waist', '📏 腰围变化 (cm)', '#f59e0b')}
        {renderChart('hips', '🍑 臀围变化 (cm)', '#ec4899')}
      </div>
    </div>
  );
}
