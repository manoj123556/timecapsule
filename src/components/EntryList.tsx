import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Maximize2, Mic, MapPin, 
  ArrowRight, BookOpen, Star, Sparkles, 
  Video as VideoIcon, Image as ImageIcon, Trash2, Clock
} from 'lucide-react';
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';
import { Entry, EMOTIONS, FONTS } from '../lib/constants';
import { cn } from '../lib/utils';

interface EntryListProps {
  entries: Entry[];
  allEntries?: Entry[];
  onThisDay?: Entry[];
  filterMode: 'today' | 'all' | 'favorites';
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onFullscreenMedia: (url: string, type: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onTagClick: (tag: string) => void;
  searchTerm?: string;
}

const HighlightText = ({ text, highlight }: { text?: string; highlight: string }) => {
  if (!text) return null;
  if (!highlight.trim()) return <>{text}</>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-black rounded px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const formatDateHeader = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return "TODAY";
  if (isYesterday(date)) return "YESTERDAY";
  return format(date, "EEEE, MMMM do");
};

export function EntryList({ 
  entries, allEntries = [], onThisDay, filterMode, onEdit, onDelete, onAdd, 
  onFullscreenMedia, onToggleFavorite, onTagClick, searchTerm = '' 
}: EntryListProps) {
  
  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    
    entries.forEach(entry => {
      const dateObj = entry.manualDate ? new Date(entry.manualDate) : (entry.createdAt?.toDate?.() || new Date());
      const dateKey = format(startOfDay(dateObj), "yyyy-MM-dd");
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const getHeaderTitle = () => {
    switch (filterMode) {
      case 'today': return "Today's Reflections";
      case 'favorites': return "Treasured Memories";
      default: return "Journal Timeline";
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[var(--bg)] px-6 md:px-12 py-16 scroll-smooth custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-12 pb-40">
        
        {/* Main Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/5 rounded-full text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.2em] border border-[var(--accent)]/10">
              <Clock className="w-3 h-3" />
              Journal Feed
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-[var(--text)] tracking-tight font-serif">
              {getHeaderTitle()}
            </h2>
            <p className="text-[var(--subtext)]/60 text-sm font-medium tracking-tight">
              {filterMode === 'today' ? `Recording ${format(new Date(), 'EEEE, MMMM do')}` : `Browsing through ${entries.length} captured moments`}
            </p>
          </motion.div>
          
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="w-16 h-16 bg-[var(--accent)] text-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-[var(--accent)]/40 transition-all border-4 border-[var(--surface)] shrink-0 self-start md:self-end"
          >
            <Plus className="w-8 h-8" />
          </motion.button>
        </header>

        {/* This Day Flashbacks */}
        <AnimatePresence>
          {onThisDay && onThisDay.length > 0 && filterMode === 'all' && (
            <motion.section 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-[var(--surface)] rounded-[40px] border border-[var(--border)] relative overflow-hidden shadow-sm mb-12 ring-1 ring-black/5"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-6 relative">
                <div className="p-2.5 bg-[var(--accent)] text-white rounded-2xl shadow-lg shadow-[var(--accent)]/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] leading-none">On This Day</h4>
                  <p className="text-xs text-[var(--subtext)] font-bold mt-1">Revisiting past versions of you</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                {onThisDay.map(entry => (
                  <button 
                    key={entry.id}
                    onClick={() => onEdit(entry)}
                    className="flex items-center gap-4 p-4 bg-[var(--bg)]/40 hover:bg-[var(--surface)] rounded-[24px] border border-transparent hover:border-[var(--border)] transition-all text-left group shadow-none hover:shadow-xl"
                  >
                    <div className="text-3xl filter transition-all group-hover:scale-110">{entry.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{entry.title || "Untitled Moment"}</h4>
                      <p className="text-[9px] text-[var(--subtext)] uppercase font-black tracking-widest mt-1 opacity-40">
                        {format(entry.manualDate ? new Date(entry.manualDate) : entry.createdAt?.toDate?.() || new Date(), 'yyyy')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Timeline Feed */}
        <div className="space-y-12">
          <AnimatePresence mode="popLayout" initial={false}>
            {groupedEntries.map(([dateKey, groupEntries]) => {
              const isDateToday = isToday(parseISO(dateKey));
              return (
                <div key={dateKey} className="space-y-4">
                  {/* Date Section Header with Divider */}
                  <div className="flex items-center gap-4 mt-6 mb-2 bg-[var(--bg)] relative">
                    <h3 className={cn(
                      "text-[10px] font-black uppercase tracking-[0.4em] transition-colors",
                      isDateToday ? "text-[var(--accent)]" : "text-[var(--subtext)] opacity-40"
                    )}>
                      {formatDateHeader(dateKey)}
                    </h3>
                    <div className={cn(
                      "flex-1 h-[1px] bg-gradient-to-r from-[var(--border)] to-transparent",
                      isDateToday && "bg-[var(--accent)]/20"
                    )} />
                    {isDateToday && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {groupEntries.map((entry, idx) => {
                      const fontClass = FONTS.find(f => f.id === entry.fontFamily)?.class || 'font-sans';
                      const date = entry.manualDate ? new Date(entry.manualDate) : (entry.createdAt?.toDate?.() || new Date());
                      
                      return (
                        <motion.div 
                          key={entry.id}
                          initial={{ opacity: 0, scale: 0.98, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ y: -4 }}
                          className={cn(
                            "group bg-[var(--surface)] rounded-[32px] border border-[var(--border)] hover:border-[var(--accent)]/20 p-8 md:p-10 shadow-sm hover:shadow-2xl hover:shadow-[var(--accent)]/5 transition-all relative overflow-hidden",
                            isDateToday && "ring-1 ring-[var(--accent)]/10 border-[var(--accent)]/20 shadow-[var(--accent)]/[0.02]"
                          )}
                        >
                          <div className="max-w-none space-y-8">
                            {/* 1. Header: Title + Intrusive-Free Actions */}
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1 space-y-2 cursor-pointer" onClick={() => onEdit(entry)}>
                                <h3 className={cn(
                                  "text-3xl md:text-4xl font-serif font-black tracking-tight text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-tight",
                                  fontClass
                                )}>
                                  <HighlightText text={entry.title || "A Moment Preserved"} highlight={searchTerm} />
                                </h3>
                                
                                {/* 2. Timestamp + Location */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-[var(--subtext)]/40 uppercase tracking-[0.2em]">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {format(date, 'h:mm a')}
                                  </div>
                                  {entry.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3 h-3" />
                                      {entry.location.address?.split(',')[0]}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Actions - Subtle until hover */}
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id, !entry.isFavorite); }}
                                  className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                    entry.isFavorite ? "bg-yellow-50 text-yellow-500 shadow-sm" : "bg-[var(--bg)]/50 text-[var(--subtext)] hover:bg-yellow-50 hover:text-yellow-500"
                                  )}
                                  title={entry.isFavorite ? "Unfavorite" : "Favorite"}
                                >
                                  <Star className={cn("w-3.5 h-3.5", entry.isFavorite && "fill-current")} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                                  className="w-9 h-9 rounded-full bg-bg-secondary/50 text-text-secondary hover:bg-accent-primary hover:text-white transition-all flex items-center justify-center"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                  className="w-9 h-9 rounded-full bg-red-50 text-red-500/50 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* 3. Main Content */}
                            <div 
                              className={cn(
                                "text-xl text-text-primary/90 leading-[1.8] line-clamp-4 group-hover:line-clamp-none transition-all duration-700 cursor-pointer",
                                fontClass
                              )}
                              onClick={() => onEdit(entry)}
                            >
                              <HighlightText text={entry.content} highlight={searchTerm} />
                            </div>

                            {/* 4. Media Preview (Natural Flow) */}
                            {entry.media && entry.media.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {entry.media.slice(0, 2).map((item, mIdx) => (
                                  <div 
                                    key={mIdx}
                                    className="aspect-[16/10] rounded-[24px] overflow-hidden bg-bg-secondary border border-black/5 relative group/media"
                                  >
                                    {item.type === 'image' && item.url && (
                                      <img src={item.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover/media:scale-110" loading="lazy" />
                                    )}
                                    {item.type === 'video' && item.url && (
                                      <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                                    )}
                                    <button 
                                      onClick={() => onFullscreenMedia(item.url, item.type)}
                                      className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
                                    >
                                      <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                                    </button>
                                    
                                    {mIdx === 1 && entry.media!.length > 2 && (
                                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                        <p className="text-white font-black text-xs uppercase tracking-[0.2em]">+{entry.media!.length - 2} more</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 5. Metadata (Bottom) */}
                            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border-primary/20">
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Mood Tag */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary rounded-full border border-border-primary/30">
                                  <span className="text-sm scale-110">{entry.emoji}</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{entry.emotion}</span>
                                </div>

                                {/* Feature Tags */}
                                {entry.tags && entry.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {entry.tags.map(t => (
                                      <button 
                                        key={t}
                                        onClick={(e) => { e.stopPropagation(); onTagClick(t); }}
                                        className="px-3 py-1.5 bg-accent-primary/5 hover:bg-accent-primary/10 rounded-full text-[10px] font-bold text-accent-primary border border-accent-primary/10 transition-colors"
                                      >
                                        #{t}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button 
                                onClick={() => onEdit(entry)}
                                className="group/btn inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary bg-accent-primary/5 px-4 py-2 rounded-full hover:bg-accent-primary hover:text-white transition-all shadow-sm"
                              >
                                Deep Relive <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                  })}
                </div>
              </div>
            );
          })}
        </AnimatePresence>

          {entries.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 flex flex-col items-center justify-center space-y-8 text-center"
            >
              <div className="w-32 h-32 bg-[var(--surface)] rounded-[48px] border border-[var(--border)] shadow-xl flex items-center justify-center group">
                <BookOpen className="w-12 h-12 text-[var(--accent)] opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-serif font-black text-[var(--text)] tracking-tight">Your story is waiting.</h3>
                <p className="text-sm text-[var(--subtext)] opacity-60 max-w-xs mx-auto font-medium">Capture a fragment of today—a thought, a feeling, or a moment that deserves preservation.</p>
                <button 
                  onClick={onAdd}
                  className="px-10 py-5 bg-[var(--accent)] text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/40 hover:scale-105 active:scale-95 transition-all mt-4"
                >
                  Start My First Entry ✨
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
