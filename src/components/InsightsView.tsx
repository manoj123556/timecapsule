import React from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReChartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { Entry, EMOTIONS } from '../lib/constants';
import { Award, Zap, Smile, BookOpen, Heart, TrendingUp, BarChart3, Activity, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface InsightsViewProps {
  entries: Entry[];
}

export function InsightsView({ entries }: InsightsViewProps) {
  // 1. Mood Statistics
  const emotionCounts = entries.reduce((acc, curr) => {
    if (curr.emotion) acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(emotionCounts).map(([name, value]) => ({ name, value }));
  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

  // Most active day (day of week)
  const dayOfWeekCounts = entries.reduce((acc, curr) => {
    const d = curr.manualDate ? new Date(curr.manualDate) : curr.createdAt?.toDate?.();
    if (d) {
      const day = format(d, 'EEEE');
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const mostActiveDay = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0];

  // 2. Activity / Streak
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const activityData = last7Days.map(day => {
    const count = entries.filter(e => {
      const d = e.manualDate ? new Date(e.manualDate) : e.createdAt?.toDate?.();
      return d && isSameDay(d, day);
    }).length;
    return { name: format(day, 'EEE'), value: count };
  });

  // Calculate Streak
  let streak = 0;
  let checkDay = new Date();
  while (true) {
    const hasEntry = entries.some(e => {
      const d = e.manualDate ? new Date(e.manualDate) : e.createdAt?.toDate?.();
      return d && isSameDay(d, checkDay);
    });
    if (hasEntry) {
      streak++;
      checkDay = subDays(checkDay, 1);
    } else {
      break;
    }
  }

  // 3. Word counts
  const totalWords = entries.reduce((acc, e) => acc + ((e.content || '').trim().split(/\s+/).filter(Boolean).length), 0);
  const avgWords = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 space-y-16 pb-40 scroll-smooth text-[var(--text)]">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.2em]">
          <BarChart3 className="w-3 h-3" />
          Neural Maps
        </div>
        <h2 className="text-5xl font-bold text-[var(--accent)] tracking-tight font-sans">Insights</h2>
        <p className="text-[var(--subtext)]/60 text-sm font-medium">Visualizing patterns in your personal narrative.</p>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Current Streak', value: `${streak} Days`, icon: Zap, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/5' },
          { label: 'Archived Moments', value: entries.length, icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-500/5' },
          { label: 'Word Count', value: totalWords.toLocaleString(), icon: BookOpen, color: 'text-green-600', bg: 'bg-green-500/5' },
          { label: 'Avg Words/Entry', value: avgWords, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/5' }
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-[var(--surface)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm hover:shadow-xl hover:shadow-black/[0.03] transition-all"
          >
            <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center mb-6 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-40 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--text)] tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="lg:col-span-4 bg-[var(--surface)] p-10 rounded-[48px] border border-[var(--border)] shadow-sm space-y-10"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-40">Emotional Spectrum</h3>
          </div>
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={EMOTIONS.find(e => e.name === entry.name)?.color || '#f1f1f1'} 
                    />
                  ))}
                </Pie>
                <ReChartsTooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
                    fontSize: '12px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl group-hover:scale-125 transition-transform duration-500">
                {topEmotion ? EMOTIONS.find(e => e.name === topEmotion[0])?.emoji : '✨'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-30 mt-2">Core Mood</span>
            </div>
          </div>
          <div className="space-y-6">
            {pieData.sort((a,b) => b.value - a.value).slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: EMOTIONS.find(e => e.name === d.name)?.color }} />
                  <span className="text-xs font-bold text-[var(--text)] tracking-tight">{d.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-[var(--subtext)] opacity-40">{Math.round((d.value / (entries.length || 1)) * 100)}%</span>
                  <div className="w-20 h-1 bg-[var(--bg)]/50 rounded-full mt-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.value / (entries.length || 1)) * 100}%` }}
                      className="h-full bg-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="lg:col-span-8 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-[var(--surface)] p-10 rounded-[48px] border border-[var(--border)] shadow-sm space-y-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-40">Frequency Rhythm</h3>
              </div>
              <div className="px-4 py-1.5 bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Last 7 Days</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    fontWeight={900}
                    axisLine={false} 
                    tickLine={false} 
                    dy={16}
                    tick={{ fill: 'var(--subtext)', opacity: 0.4 }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="var(--accent)" 
                    radius={[16, 16, 4, 4]} 
                    barSize={48}
                  />
                  <ReChartsTooltip 
                    cursor={{ fill: 'var(--bg)', opacity: 0.4 }}
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
                      fontSize: '11px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)'
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--text)] p-10 rounded-[48px] text-[var(--surface)] flex flex-col justify-between shadow-2xl overflow-hidden relative group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-150" />
              <Heart className="w-10 h-10 text-red-400 fill-current relative z-10" />
              <div className="mt-12 relative z-10">
                <h4 className="text-4xl font-bold tracking-tight mb-2">Favorite Echoes</h4>
                <p className="text-sm opacity-50 leading-relaxed font-bold tracking-tight">
                  You have preserved {entries.filter(e => e.isFavorite).length} core fragments.
                </p>
              </div>
            </div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-[var(--accent)] p-10 rounded-[48px] text-white flex flex-col justify-between shadow-2xl shadow-[var(--accent)]/30 relative group overflow-hidden"
            >
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
              <Smile className="w-10 h-10 text-white/40 relative z-10" />
              <div className="mt-12 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Peak Productivity</p>
                <h4 className="text-4xl font-bold tracking-tight">{mostActiveDay ? mostActiveDay[0] : 'N/A'}s</h4>
                <p className="text-[10px] mt-4 font-black uppercase tracking-widest opacity-30">Discipline leads to insight.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
