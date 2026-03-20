import React from 'react';
import { DailyRecord } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  allRecords: Record<string, DailyRecord>;
  currentDate: string;
}

const habitLabels: Record<string, string> = {
  arms: '瘦手臂打卡',
  legs: '瘦大腿打卡',
  creatine: '补充肌酸',
  water: '饮水达标',
  sleep: '早睡早起',
};

export default function DailyHabits({ dailyRecord, updateDailyRecord, allRecords, currentDate }: Props) {
  const toggleHabit = (key: string) => {
    updateDailyRecord({
      habits: {
        ...dailyRecord.habits,
        [key]: !dailyRecord.habits[key],
      },
    });
  };

  const currentMonthDate = new Date(currentDate);
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60 flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="font-bold text-slate-800">每日小习惯</span>
        </div>
        <div className="p-5 space-y-4">
          {Object.entries(habitLabels).map(([key, label]) => {
            const isChecked = dailyRecord.habits[key];
            return (
              <label
                key={key}
                className="flex items-center space-x-4 cursor-pointer group bg-white/40 p-3 rounded-2xl hover:bg-white/60 transition border border-transparent hover:border-white shadow-sm"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isChecked || false}
                    onChange={() => toggleHabit(key)}
                    className="sr-only"
                  />
                  {isChecked ? (
                    <CheckCircle2 className="text-indigo-500 w-6 h-6 transition-all" />
                  ) : (
                    <Circle className="text-slate-300 w-6 h-6 transition-all group-hover:text-indigo-300" />
                  )}
                </div>
                <span
                  className={`text-base transition-all duration-300 ${
                    isChecked ? 'line-through text-slate-400' : 'font-bold text-slate-700'
                  }`}
                >
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="font-bold text-slate-800">{format(currentMonthDate, 'yyyy年MM月')} 坚持热力图</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 mb-3">
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const record = allRecords[dateStr];
              let score = 0;
              if (record?.habits) {
                score += record.habits.arms ? 1 : 0;
                score += record.habits.legs ? 1 : 0;
                score += record.habits.creatine ? 1 : 0;
                score += record.habits.water ? 1 : 0;
                score += record.habits.sleep ? 1 : 0;
              }

              let bgClass = 'bg-white/40 text-slate-400 shadow-sm border border-white/40';
              if (score === 1) bgClass = 'bg-indigo-100 text-indigo-600 border border-white';
              else if (score === 2) bgClass = 'bg-indigo-300 text-indigo-800 border border-white';
              else if (score === 3) bgClass = 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 border border-indigo-400';
              else if (score >= 4) bgClass = 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-500 ring-2 ring-white/50';

              if (dateStr === currentDate) {
                bgClass += ' scale-110 z-10 border-2 border-pink-400';
              }

              return (
                <div
                  key={dateStr}
                  className={`h-10 flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-300 ${bgClass}`}
                >
                  <span className="font-bold">{score > 0 ? score : '-'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
