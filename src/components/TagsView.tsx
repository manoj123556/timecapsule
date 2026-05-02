import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, ChevronRight, ArrowLeft, Search, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Entry } from '../lib/constants';
import { cn } from '../lib/utils';

interface TagsViewProps {
  entries: Entry[];
  onEditEntry: (entry: Entry) => void;
}

export function TagsView({ entries, onEditEntry }: TagsViewProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tagGroups = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    entries.forEach(entry => {
      (entry.tags || []).forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(entry);
      });
    });
    
    // Sort tags by frequency (most used first)
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([tag, tagEntries]) => ({
        tag,
        count: tagEntries.length,
        entries: tagEntries.sort((a, b) => {
          const dateA = new Date(a.manualDate || a.createdAt as any || 0).getTime();
          const dateB = new Date(b.manualDate || b.createdAt as any || 0).getTime();
          return dateB - dateA;
        })
      }));
  }, [entries]);

  const filteredTags = tagGroups.filter(g => 
    g.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTagData = useMemo(() => 
    tagGroups.find(g => g.tag === selectedTag),
    [tagGroups, selectedTag]
  );

  if (entries.length === 0 || tagGroups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-[var(--accent)]/5 rounded-[32px] flex items-center justify-center text-[var(--accent)]/20">
          <Tag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-bold text-[var(--text)]">No tags yet</h3>
          <p className="text-sm text-[var(--subtext)] opacity-60 max-w-[280px] mx-auto">
            Organize your memories with tags like #travel, #family, or #ideas while writing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)] overflow-hidden">
      {/* Header */}
      <header className="p-8 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              {selectedTag ? (
                <motion.button 
                  key="back"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => setSelectedTag(null)}
                  className="p-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] hover:bg-[var(--bg)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[var(--text)]" />
                </motion.button>
              ) : (
                <motion.div 
                  key="icon"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="p-3 bg-[var(--accent)]/10 rounded-2xl"
                >
                  <Tag className="w-6 h-6 text-[var(--accent)]" />
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <h2 className="text-3xl font-serif font-black text-[var(--text)] tracking-tight">
                {selectedTag ? `#${selectedTag}` : 'Organized Archive'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] opacity-60 mt-0.5">
                {selectedTag ? `${selectedTagData?.count} Memories Found` : 'Exploration by Category'}
              </p>
            </div>
          </div>

          {!selectedTag && (
            <div className="relative group w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--subtext)] opacity-40 group-focus-within:text-[var(--accent)] group-focus-within:opacity-100 transition-all" />
              <input 
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] transition-all focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--accent)]/5 text-[var(--text)]"
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-20 custom-scrollbar">
        <AnimatePresence mode="wait">
          {!selectedTag ? (
            <motion.div 
              key="tag-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredTags.map((group) => (
                <button
                  key={group.tag}
                  onClick={() => setSelectedTag(group.tag)}
                  className="group p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] text-left hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/5 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-[var(--bg)] rounded-2xl flex items-center justify-center group-hover:bg-[var(--accent)]/10 transition-colors">
                      <Tag className="w-6 h-6 text-[var(--accent)] opacity-40 group-hover:opacity-100" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--text)] mb-1">#{group.tag}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">
                        {group.count} {group.count === 1 ? 'Memory' : 'Memories'}
                      </p>
                    </div>
                    
                    <div className="flex -space-x-2 pt-2">
                       {group.entries.slice(0, 3).map((e, i) => (
                         <div key={e.id} className="w-8 h-8 rounded-full bg-[var(--accent)]/5 border-2 border-[var(--surface)] flex items-center justify-center text-[10px] overflow-hidden">
                           {e.media && e.media.length > 0 && e.media[0].url ? (
                             <img src={e.media[0].url} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <span className="opacity-40 text-[var(--text)]">{e.emotion.slice(0, 2)}</span>
                           )}
                         </div>
                       ))}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="tag-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 max-w-4xl"
            >
              <button 
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] opacity-60 hover:opacity-100 transition-opacity mb-4"
              >
                <ArrowLeft className="w-3 h-3" />
                Return to all categories
              </button>

              <div className="grid gap-4">
                {selectedTagData?.entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onEditEntry(entry)}
                    className="group bg-[var(--surface)] border border-[var(--border)] rounded-[32px] p-6 text-left hover:border-[var(--accent)] hover:shadow-lg transition-all flex gap-6"
                  >
                    <div className="w-24 h-24 bg-[var(--bg)] rounded-2xl shrink-0 overflow-hidden relative border border-[var(--border)]">
                      {entry.media && entry.media.length > 0 && entry.media[0].url ? (
                        <img src={entry.media[0].url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">
                          {entry.emotion}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--subtext)] opacity-40 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {entry.manualDate ? format(new Date(entry.manualDate), 'MMMM dd, yyyy') : 'No Date'}
                          </span>
                          {entry.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {entry.title || ((entry.content || '').length > 40 ? (entry.content || '').slice(0, 40) + '...' : (entry.content || 'Untitled Fragment'))}
                      </h4>
                      <p className="text-sm text-[var(--subtext)] line-clamp-2 leading-relaxed opacity-60">
                        {entry.content || ''}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {entry.tags?.map(t => (
                          <span key={t} className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors",
                            t === selectedTag 
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                              : "bg-[var(--bg)] text-[var(--subtext)] border-transparent"
                          )}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
