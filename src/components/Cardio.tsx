import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, startOfWeek, startOfMonth } from 'date-fns';

interface Props {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  allRecords: Record<string, DailyRecord>;
}

export default function Cardio({ dailyRecord, updateDailyRecord, allRecords }: Props) {
  const [cardioRange, setCardioRange] = useState<'day' | 'week' | 'month'>('day');

  const chartData = useMemo(() => {
    const aggregated: Record<string, number> = {};
    Object.entries(allRecords).forEach(([dateStr, record]) => {
      const t = (record.pilates?.duration || 0) + (record.treadmill?.duration || 0);
      if (t > 0) {
        let key = format(parseISO(dateStr), 'MM-dd');
        if (cardioRange === 'week') {
          key = format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), 'MM-dd') + '周';
        } else if (cardioRange === 'month') {
          key = format(startOfMonth(parseISO(dateStr)), 'yyyy-MM');
        }
        aggregated[key] = (aggregated[key] || 0) + t;
      }
    });

    return Object.keys(aggregated)
      .sort()
      .map((key) => ({
        date: key,
        duration: aggregated[key],
      }));
  }, [allRecords, cardioRange]);

  return (
    <div className="space-y-6 animate-fade-in">
      <label className="flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-md shadow-lg border border-white p-5 rounded-3xl cursor-pointer hover:shadow-xl transition">
        <input
          type="checkbox"
          checked={dailyRecord.noCardio}
          onChange={(e) => updateDailyRecord({ noCardio: e.target.checked })}
          className="w-6 h-6 text-pink-500 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
        />
        <span className="font-extrabold text-slate-700 text-lg">设为休息日 (无有氧)</span>
      </label>

      {!dailyRecord.noCardio && (
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-5 border-t-4 border-t-purple-400">
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-slate-800 text-xl">🧘‍♀️ 普拉提</span>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2 uppercase">练习时长 (分钟)</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={dailyRecord.pilates.duration || ''}
                  onChange={(e) =>
                    updateDailyRecord({
                      pilates: { duration: Number(e.target.value) },
                    })
                  }
                  className="flex-1 p-4 border border-white rounded-2xl bg-white/60 shadow-sm focus:bg-white outline-none font-black text-slate-700 text-center text-2xl"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-5 border-t-4 border-t-pink-400">
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-slate-800 text-xl">🏃‍♀️ 跑步机爬坡</span>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2 uppercase">运动时长 (分钟)</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={dailyRecord.treadmill.duration || ''}
                  onChange={(e) =>
                    updateDailyRecord({
                      treadmill: { duration: Number(e.target.value) },
                    })
                  }
                  className="flex-1 p-4 border border-white rounded-2xl bg-white/60 shadow-sm focus:bg-white outline-none font-black text-slate-700 text-center text-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl p-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-sm font-bold text-slate-800">⏱️ 时长追踪</span>
          <div className="flex bg-white/60 rounded-xl p-1 border border-white shadow-sm">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setCardioRange(range)}
                className={`px-4 py-1.5 text-xs rounded-lg transition ${
                  cardioRange === range ? 'bg-white shadow text-indigo-600 font-black' : 'text-slate-500 font-bold'
                }`}
              >
                {range === 'day' ? '日' : range === 'week' ? '周' : '月'}
              </button>
            ))}
          </div>
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
              <Line type="monotone" dataKey="duration" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
