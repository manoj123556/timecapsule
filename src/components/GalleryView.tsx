import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, 
  Video, 
  Mic, 
  Search, 
  X,
  Clock,
  Heart,
  Globe,
  Film,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { Entry, EMOTIONS, MediaItem } from '../lib/constants';
import { cn } from '../lib/utils';

interface GalleryViewProps {
  entries: Entry[];
  onFullscreenMedia: (url: string, type: string) => void;
  onEditEntry: (entry: Entry) => void;
}

interface FlattenedMedia extends MediaItem {
  entryId: string;
  entryTitle: string;
  entryTags: string[];
  date: Date;
  isFavorite: boolean;
}

export function GalleryView({ entries, onFullscreenMedia, onEditEntry }: GalleryViewProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'file' | 'link'>('all');

  const getFileIcon = (name?: string) => {
    if (!name) return "📎";
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return "📕";
    if (['doc', 'docx'].includes(ext!)) return "📘";
    if (['xls', 'xlsx', 'csv'].includes(ext!)) return "📊";
    if (['ppt', 'pptx'].includes(ext!)) return "📙";
    if (['json', 'xml', 'txt', 'md'].includes(ext!)) return "🧾";
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'go', 'rs', 'cpp', 'c', 'java'].includes(ext!)) return "💻";
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext!)) return "📦";
    return "📎";
  };

  const flattenedMedia = useMemo(() => {
    const list: FlattenedMedia[] = [];
    entries.forEach(e => {
      if (e.media && e.media.length > 0) {
        e.media.forEach(m => {
          list.push({
            ...m,
            entryId: e.id,
            entryTitle: e.title || (e.content || '').split('\n')[0] || 'Untitled',
            entryTags: e.tags || [],
            date: e.manualDate ? new Date(e.manualDate) : (e.createdAt?.toDate?.() || new Date()),
            isFavorite: !!e.isFavorite
          });
        });
      }
    });
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries]);

  const filteredMedia = useMemo(() => {
    return flattenedMedia.filter(m => {
      const matchesSearch = m.entryTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.entryTags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFav = !onlyFavorites || m.isFavorite;
      const matchesType = filterType === 'all' || m.type === filterType;
      return matchesSearch && matchesFav && matchesType;
    });
  }, [flattenedMedia, searchTerm, onlyFavorites, filterType]);

  const activeMedia = activeMediaIndex !== null ? filteredMedia[activeMediaIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMediaIndex === null) return;
      if (e.key === 'Escape') setActiveMediaIndex(null);
      if (e.key === 'ArrowLeft') {
        setActiveMediaIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev);
      }
      if (e.key === 'ArrowRight') {
        setActiveMediaIndex(prev => (prev !== null && prev < filteredMedia.length - 1) ? prev + 1 : prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMediaIndex, filteredMedia.length]);

  return (
    <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.2em]">
            <Film className="w-3 h-3" />
            Media Archive
          </div>
          <h2 className="text-5xl font-bold text-[var(--accent)] tracking-tight font-sans">Gallery</h2>
          <p className="text-[var(--subtext)]/60 text-sm font-medium tracking-tight">Exploring {filteredMedia.length} moments frozen in time.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--subtext)] opacity-40 group-focus-within:opacity-100 group-focus-within:text-[var(--accent)] transition-all" />
            <input 
              type="text" 
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-[var(--surface)]/60 backdrop-blur-xl border border-[var(--border)] rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/5 w-full md:w-80 shadow-sm transition-all text-[var(--text)]"
            />
          </div>
          <button 
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all border shadow-sm",
              onlyFavorites ? "bg-yellow-400 border-yellow-400 text-white" : "bg-[var(--surface)] border-[var(--border)] text-[var(--subtext)] hover:bg-yellow-50"
            )}
          >
            <Heart className={cn("w-6 h-6", onlyFavorites && "fill-current")} />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 p-1.5 bg-[var(--bg)]/50 rounded-[24px] w-fit border border-[var(--border)]/40 overflow-x-auto no-scrollbar max-w-full">
        {(['all', 'image', 'video', 'audio', 'file', 'link'] as const).map(type => (
          <button 
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              filterType === type ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm" : "text-[var(--subtext)] opacity-40 hover:opacity-100 hover:bg-[var(--surface)]/40"
            )}
          >
            {type === 'all' ? 'All Assets' : type}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredMedia.map((m, idx) => (
              <motion.div 
                key={`${m.entryId}-${idx}`}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ scale: 1.04, y: -4, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => {
                  if (m.type === 'file' || m.type === 'link') {
                    window.open(m.url, '_blank');
                  } else {
                    setActiveMediaIndex(idx);
                  }
                }}
                className="group relative aspect-square bg-[var(--surface)] rounded-[40px] overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]/30 cursor-pointer shadow-sm hover:shadow-2xl transition-all"
              >
                <div className="w-full h-full p-2">
                  <div className="w-full h-full rounded-[32px] overflow-hidden bg-[var(--bg)] flex items-center justify-center relative group">
                    {m.type === 'image' && (
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-black/5" />
                        </div>
                        <ImageWithBlur url={m.url} />
                      </div>
                    )}
                    {m.type === 'video' && (
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film className="w-8 h-8 text-black/5" />
                        </div>
                        <video 
                          src={m.url} 
                          className="w-full h-full object-cover transition-transform duration-700 relative z-10" 
                          muted 
                          loop
                          playsInline 
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      </div>
                    )}
                    {m.type === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--accent)]/5 transition-colors group-hover:bg-[var(--accent)]/10">
                        <Mic className="w-10 h-10 text-[var(--accent)] opacity-20 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mt-3">Voice Memo</span>
                      </div>
                    )}

                    {m.type === 'file' && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface)] p-6 group-hover:bg-[var(--bg)] transition-colors">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform drop-shadow-sm">{getFileIcon(m.name)}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center line-clamp-1 w-full px-2">{m.name}</span>
                      </div>
                    )}

                    {m.type === 'link' && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface)] p-6 group-hover:bg-[var(--bg)] transition-colors">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform drop-shadow-sm">🔗</div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center line-clamp-1 w-full px-2 text-[var(--text)]">
                          {m.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        </span>
                      </div>
                    )}
                    
                    {/* Play Overlay for Video */}
                    {m.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 group-hover:opacity-0 transition-opacity">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                          <Video className="w-5 h-5 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Overlay Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white text-left z-30">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{format(m.date, 'MMM d, yyyy')}</span>
                      <h4 className="text-sm font-bold leading-tight line-clamp-2 mb-4">{m.entryTitle}</h4>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const entry = entries.find(ent => ent.id === m.entryId);
                          if (entry) onEditEntry(entry);
                        }}
                        className="w-full py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                      >
                        Open Perspective
                      </button>
                    </div>

                    <div className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-30">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {filteredMedia.length === 0 && (
        <div className="py-40 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-[var(--surface)] rounded-full flex items-center justify-center border border-[var(--border)]">
            <Film className="w-10 h-10 text-[var(--subtext)] opacity-20" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--subtext)] opacity-30">No matching fragments found</p>
        </div>
      )}

      {/* Fullscreen Modal Explorer */}
      <AnimatePresence>
        {activeMediaIndex !== null && activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden p-6 md:p-12"
            onClick={() => setActiveMediaIndex(null)}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveMediaIndex(null)}
              className="absolute top-8 right-8 z-[1010] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-2xl"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between z-[1010] pointer-events-none">
              <button 
                disabled={activeMediaIndex === 0}
                onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev); }}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-2xl pointer-events-auto disabled:opacity-0"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button 
                disabled={activeMediaIndex === filteredMedia.length - 1}
                onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(prev => (prev !== null && prev < filteredMedia.length - 1) ? prev + 1 : prev); }}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-2xl pointer-events-auto disabled:opacity-0"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            <motion.div 
              key={activeMediaIndex}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
            >
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                {activeMedia.type === 'image' && (
                  <img 
                    src={activeMedia.url} 
                    className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" 
                    referrerPolicy="no-referrer" 
                  />
                )}
                {activeMedia.type === 'video' && (
                  <video 
                    src={activeMedia.url} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-full rounded-3xl shadow-2xl" 
                  />
                )}
                {activeMedia.type === 'audio' && (
                  <div className="bg-[var(--surface)] p-12 rounded-[48px] text-center shadow-2xl w-full max-w-md">
                    <div className="w-24 h-24 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Mic className="w-10 h-10 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-2xl font-serif font-black mb-2 text-[var(--text)]">{activeMedia.entryTitle}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 text-[var(--subtext)]">Audio Archive</p>
                    <audio src={activeMedia.url} controls className="w-full" />
                  </div>
                )}
              </div>

              {/* Info Overlay at the bottom of modal */}
              <div className="mt-8 text-center text-white space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                  {format(activeMedia.date, 'MMMM d, yyyy')}
                </span>
                <h4 className="text-2xl font-serif italic opacity-90">{activeMedia.entryTitle}</h4>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImageWithBlur({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img 
      src={url} 
      onLoad={() => setLoaded(true)}
      className={cn(
        "w-full h-full object-cover transition-all duration-700 relative z-10",
        loaded ? "blur-0 scale-100" : "blur-xl scale-110"
      )} 
      loading="lazy" 
      referrerPolicy="no-referrer" 
    />
  );
}
