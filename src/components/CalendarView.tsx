import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Edit2, Maximize2, Mic, Calendar, Plus } from 'lucide-react';
import { Entry } from '../lib/constants';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  entries: Entry[];
  onEditEntry: (entry: Entry) => void;
  onFullscreenMedia: (url: string, type: string) => void;
}

export function CalendarView({ entries, onEditEntry, onFullscreenMedia }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const getEntriesForDate = (date: Date) => {
    return entries.filter(e => {
      const d = e.manualDate ? new Date(e.manualDate) : (e.createdAt?.toDate?.() || new Date());
      return d && isSameDay(d, date);
    });
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="max-w-6xl mx-auto w-full px-6 md:px-12 py-12 space-y-12 pb-40">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.2em] w-fit">
            <Calendar className="w-3 h-3" />
            Chronicle
          </div>
          <h2 className="text-5xl font-bold text-[var(--accent)] tracking-tight font-sans">Calendar</h2>
        </div>

        <div className="flex items-center gap-4 bg-[var(--surface)] p-3 rounded-[24px] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
          <button onClick={prevMonth} className="p-2.5 hover:bg-[var(--bg)]/50 rounded-xl transition-colors text-[var(--subtext)]">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-xs font-black w-40 text-center uppercase tracking-[0.2em] text-[var(--text)]">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="p-2.5 hover:bg-[var(--bg)]/50 rounded-xl transition-colors text-[var(--subtext)]">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 xl:col-span-7 bg-[var(--surface)] rounded-[44px] border border-[var(--border)]/50 p-10 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-8">
            {daysHeader.map(day => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-30">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((day, i) => {
              const dayEntries = getEntriesForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-[4/3] md:aspect-square rounded-[24px] flex flex-col items-center justify-center relative transition-all group",
                    !isCurrentMonth ? "opacity-10 pointer-events-none" : "hover:bg-[var(--bg)]/40",
                    isSelected ? "bg-[var(--accent)] text-white shadow-xl scale-105 z-10" : "text-[var(--text)]",
                    isToday(day) && !isSelected && "border-2 border-[var(--accent)]/30"
                  )}
                >
                  <span className="text-sm font-bold">{format(day, 'd')}</span>
                  {dayEntries.length > 0 && !isSelected && (
                    <div className="mt-1 flex gap-1">
                      {dayEntries.slice(0, 3).map((e, idx) => (
                        <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-30" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-5 space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-40">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Timeline Fragments'}
            </h3>
            {selectedDate && <Plus className="w-4 h-4 text-[var(--accent)] opacity-20" />}
          </div>

          <AnimatePresence mode="wait">
            {selectedDate && getEntriesForDate(selectedDate).length > 0 ? (
              <motion.div 
                key={selectedDate.getTime()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {getEntriesForDate(selectedDate).map(entry => (
                  <div 
                    key={entry.id}
                    className="bg-[var(--surface)] rounded-[40px] border border-[var(--border)]/50 p-8 shadow-sm hover:shadow-xl hover:shadow-black/[0.03] transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <span className="text-4xl">{entry.emoji}</span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">
                            {format(entry.manualDate ? new Date(entry.manualDate) : (entry.createdAt?.toDate?.() || new Date()), 'h:mm a')}
                          </p>
                          <h4 className="font-bold text-lg leading-tight line-clamp-1 text-[var(--text)]">{entry.title || "Untitled Fragment"}</h4>
                        </div>
                      </div>
                      <button 
                        onClick={() => onEditEntry(entry)}
                        className="p-3 rounded-full bg-[var(--bg)] text-[var(--subtext)] hover:bg-black hover:text-white transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-lg leading-relaxed text-[var(--text)]/70 line-clamp-4 mb-6">
                      {entry.content}
                    </p>

                    {entry.media && entry.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4 rounded-[28px] overflow-hidden">
                        {entry.media.slice(0, 2).map((m) => (
                          <div 
                            key={m.url}
                            className="aspect-square relative group/media cursor-pointer"
                            onClick={() => onFullscreenMedia(m.url, m.type)}
                          >
                            {m.type === 'image' && <img src={m.url} className="w-full h-full object-cover" />}
                            {m.type === 'video' && <div className="w-full h-full bg-black flex items-center justify-center"><Mic className="w-6 h-6 text-white/20" /></div>}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="text-white w-5 h-5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 rounded-[48px] border-2 border-dashed border-[var(--border)]/40 bg-[var(--surface)]/40"
              >
                <div className="w-20 h-20 rounded-full bg-[var(--bg)]/40 flex items-center justify-center mb-6">
                  <Calendar className="w-8 h-8 text-[var(--subtext)] opacity-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-30 italic">No remains for this epoch</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
