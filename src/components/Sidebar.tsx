import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Clock, 
  BookOpen, 
  LayoutGrid, 
  FileText,
  BarChart2, 
  Search, 
  LogOut,
  Settings,
  Calendar,
  Lock,
  Star,
  Flame,
  Award,
  BookHeart,
  ChevronRight,
  Sparkles,
  Map as MapIcon,
  Palette,
  User as UserIcon,
  ChevronDown,
  Tag,
  X,
  PanelLeftClose
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Entry, THEMES } from '../lib/constants';

interface SidebarProps {
  user: { uid: string; displayName: string; photoURL?: string; email: string };
  view: string;
  setView: (view: any) => void;
  filterMode: string;
  setFilterMode: (mode: any) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setIsAdding: (val: boolean) => void;
  entries: Entry[];
  filteredEntries: Entry[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onAdd: () => void;
  streak: number;
  hasWrittenToday: boolean;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ 
  user, view, setView, filterMode, setFilterMode, 
  editingId, setEditingId, setIsAdding, 
  entries, filteredEntries, searchTerm, setSearchTerm,
  theme, setTheme,
  onAdd,
  streak, hasWrittenToday,
  onLogout,
  onDeleteEntry,
  isOpen,
  setIsOpen
}: SidebarProps & { onDeleteEntry: (id: string) => void }) {
  const [showAtmosphere, setShowAtmosphere] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isOpen ? 320 : 0,
        x: isOpen ? 0 : -320,
        opacity: isOpen ? 1 : 0
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "fixed lg:relative top-0 left-0 h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col shrink-0 overflow-hidden z-50",
        !isOpen && "pointer-events-none border-none lg:w-0"
      )}
    >
      <div className="w-[320px] h-full flex flex-col">
        {/* Premium Header */}
        <div className="p-8 pb-6 relative">
          {/* Internal Toggle Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-8 right-6 p-2 text-[var(--subtext)] hover:text-[var(--accent)] hover:bg-[var(--bg)] rounded-xl transition-all lg:flex hidden"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[var(--accent)] rounded-[20px] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 -rotate-2">
              <BookHeart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black tracking-tight text-[var(--text)] leading-none">TimeCapsule</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mt-1.5 ml-0.5 opacity-60">Your Daily Diary</p>
            </div>
          </div>
          
          <button 
            onClick={onAdd}
            className="w-full py-4 px-4 bg-[var(--accent)] text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span className="text-sm font-black uppercase tracking-widest">Write Memory</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-8 pb-8">
        {/* Navigation */}
        <section className="space-y-1">
          <NavItem 
            id="today" 
            icon={<Clock className="w-4 h-4" />} 
            label="Today" 
            isActive={view === 'archive' && filterMode === 'today'} 
            onClick={() => { setView('archive'); setFilterMode('today'); setIsAdding(false); setEditingId(null); }} 
          />
          <NavItem 
            id="all" 
            icon={<BookOpen className="w-4 h-4" />} 
            label="All Entries" 
            isActive={view === 'archive' && filterMode === 'all'} 
            onClick={() => { setView('archive'); setFilterMode('all'); setIsAdding(false); setEditingId(null); }} 
          />
          <NavItem 
            id="favorites" 
            icon={<Star className="w-4 h-4" />} 
            label="Favorites" 
            isActive={view === 'archive' && filterMode === 'favorites'} 
            onClick={() => { setView('archive'); setFilterMode('favorites'); setIsAdding(false); setEditingId(null); }} 
          />
          <NavItem 
            id="map" 
            icon={<MapIcon className="w-4 h-4" />} 
            label="Travelogue" 
            isActive={view === 'map'} 
            onClick={() => { setView('map'); setIsAdding(false); setEditingId(null); }} 
          />
          <NavItem 
            id="tags" 
            icon={<Tag className="w-4 h-4" />} 
            label="Tags" 
            isActive={view === 'tags'} 
            onClick={() => { setView('tags'); setIsAdding(false); setEditingId(null); }} 
          />
        </section>

        {/* View Switcher/Logout Section */}
        <section>
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--subtext)] mb-3 ml-2">Perspectives</h3>
          <div className="space-y-1">
            <NavItem 
              id="calendar" 
              icon={<Calendar className="w-4 h-4" />} 
              label="Calendar" 
              isActive={view === 'calendar'} 
              onClick={() => { setView('calendar'); setIsAdding(false); setEditingId(null); }} 
            />
            <NavItem 
              id="gallery" 
              icon={<LayoutGrid className="w-4 h-4" />} 
              label="Gallery" 
              isActive={view === 'gallery'} 
              onClick={() => { setView('gallery'); setIsAdding(false); setEditingId(null); }} 
            />
            <NavItem 
              id="insights" 
              icon={<BarChart2 className="w-4 h-4" />} 
              label="Insights" 
              isActive={view === 'insights'} 
              onClick={() => { setView('insights'); setIsAdding(false); setEditingId(null); }} 
            />
          </div>
        </section>

        {/* Search & Recent */}
        <section>
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--subtext)] mb-3 ml-2">Find Memory</h3>
          <div className="px-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--subtext)] group-focus-within:text-[var(--accent)] transition-all" />
              <input 
                type="text"
                placeholder="Find a memory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-[var(--bg)] rounded-2xl border border-[var(--border)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] transition-all focus:ring-4 focus:ring-[var(--accent)]/5 text-[var(--text)]"
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredEntries.slice(0, 5).map((entry) => (
                <motion.button 
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setEditingId(entry.id);
                    setIsAdding(false);
                    setView('archive');
                  }}
                  className={cn(
                    "w-full p-4 rounded-2xl flex flex-col text-left transition-all border group relative",
                    editingId === entry.id 
                      ? "bg-[var(--bg)] border-[var(--accent)] shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-[var(--bg)]"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-[var(--subtext)] uppercase tracking-widest">
                      {entry.manualDate ? format(new Date(entry.manualDate), 'MMM dd') : 'Recent'}
                    </span>
                    {entry.isFavorite && <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                    {entry.title || (entry.content || '').split('\n')[0] || 'Untitled'}
                  </h4>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Footer / Account */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-3">
        {/* Atmosphere Selector */}
        <section className="bg-[var(--bg)] rounded-[28px] overflow-hidden border border-[var(--border)] transition-all duration-300">
          <button 
            onClick={() => setShowAtmosphere(!showAtmosphere)}
            className="w-full px-5 py-4 flex items-center justify-between group hover:bg-[var(--surface)]/10 transition-colors"
          >
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text)] text-left">Atmosphere</h3>
              <p className="text-[9px] text-[var(--subtext)] font-medium mt-0.5 text-left italic">Choose your mood</p>
            </div>
            <motion.div
              animate={{ rotate: showAtmosphere ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-[var(--subtext)]"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
          
          <AnimatePresence initial={false}>
            {showAtmosphere && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-1 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                  {Object.entries(THEMES).map(([id, t]) => (
                    <button 
                      key={id}
                      onClick={() => {
                        setTheme(id);
                        setTimeout(() => setShowAtmosphere(false), 300);
                      }}
                      className={cn(
                        "w-full h-12 rounded-xl flex items-center gap-3 px-3 transition-all duration-300 group",
                        theme === id 
                          ? "bg-[var(--surface)] shadow-md border border-[var(--border)]" 
                          : "hover:bg-[var(--surface)]/50"
                      )}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg shadow-inner shrink-0 transition-transform duration-300 group-hover:scale-105 border border-black/5"
                        style={{ backgroundColor: t.bg }}
                      >
                        <div className="w-4 h-4 rounded-md m-0.5" style={{ backgroundColor: t.accent }} />
                      </div>
                      
                      <span className={cn(
                        "flex-1 text-left text-xs font-bold tracking-tight transition-colors flex items-center gap-2",
                        theme === id ? "text-[var(--text)]" : "text-[var(--subtext)]"
                      )}>
                        <span className="text-sm">{t.emoji}</span>
                        {t.name}
                      </span>
      
                      {theme === id && (
                        <motion.div 
                          layoutId="themeSelected"
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="flex gap-2 px-1">
          <button 
            onClick={() => { setView('settings'); setIsAdding(false); setEditingId(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
              view === 'settings' 
                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm" 
                : "text-[var(--subtext)] hover:bg-[var(--bg)] border-transparent hover:border-[var(--border)]"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button 
            onClick={onLogout}
            className="w-12 flex items-center justify-center py-3.5 rounded-2xl text-[var(--subtext)] hover:text-red-500 transition-all border border-transparent hover:border-red-100 hover:bg-red-50"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-[var(--surface)] rounded-[24px] border border-[var(--border)] flex items-center gap-3">
          <div className="relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full bg-[var(--accent)] p-0.5 border-2 border-[var(--surface)] shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)] shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold truncate tracking-tight text-[var(--text)] uppercase">{user.displayName}</p>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
              <p className="text-[8px] text-[var(--subtext)] uppercase tracking-[0.1em] font-black">{streak} Day Streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.aside>
  );
}

function NavItem({ id, icon, label, isActive, onClick, badge }: { id: string, icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group",
        isActive 
          ? "bg-[var(--accent)] text-white shadow-md" 
          : "text-[var(--subtext)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "transition-transform group-hover:scale-110",
          isActive ? "text-white" : "text-[var(--accent)] opacity-60"
        )}>
          {icon}
        </div>
        {label}
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className={cn(
            "text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-lg",
            isActive ? "bg-white text-[var(--accent)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"
          )}>
            {badge}
          </span>
        )}
        {isActive ? (
          <motion.div layoutId="navDot" className="w-1.5 h-1.5 rounded-full bg-white" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all" />
        )}
      </div>
    </button>
  );
}
