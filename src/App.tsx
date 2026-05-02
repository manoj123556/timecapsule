import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import Login from "./components/Login";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Clock, 
  BookOpen, 
  LayoutGrid, 
  BarChart2, 
  LogOut, 
  ChevronRight,
  Maximize2,
  X,
  Calendar,
  Settings,
  BookHeart,
  Map as MapIcon,
  WifiOff,
  Mic,
  FileText,
  User as UserIcon,
  Bell,
  PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfDay, isSameDay, subDays, differenceInDays } from 'date-fns';
import { cn } from './lib/utils';
import { Entry, EMOTIONS, FONTS, THEMES } from './lib/constants';

// Internal Components
import { Sidebar } from './components/Sidebar';
import { EntryList } from './components/EntryList';
import { EntryEditor } from './components/EntryEditor';
import { GalleryView } from './components/GalleryView';
import { InsightsView } from './components/InsightsView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { MapView } from './components/MapView';
import { TagsView } from './components/TagsView';
import { PinLock } from './components/PinLock';
import { checkAndSendNotification, requestNotificationPermission } from './services/notificationService';
// Internal Components
const STORAGE_KEY = 'time_capsule_entries';
const USER_KEY = 'time_capsule_user';

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string; displayName: string } | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<'archive' | 'gallery' | 'insights' | 'calendar' | 'settings' | 'map' | 'tags'>('archive');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'default');
  const [filterMode, setFilterMode] = useState<'today' | 'all' | 'favorites'>('all');
  const [personalization, setPersonalization] = useState<{
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  }>(() => {
    try {
      const saved = localStorage.getItem('personalization');
      return saved ? JSON.parse(saved) : { 
        fontFamily: 'sans', 
        fontSize: 16, 
        lineHeight: 1.6, 
        letterSpacing: 0 
      };
    } catch {
      return { fontFamily: 'sans', fontSize: 16, lineHeight: 1.6, letterSpacing: 0 };
    }
  });
  const [isAdding, setIsAdding] = useState(() => localStorage.getItem('app_is_adding') === 'true');
  const [editingId, setEditingId] = useState<string | null>(() => localStorage.getItem('app_editing_id'));
  const [searchTerm, setSearchTerm] = useState('');
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string, type: string } | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [appNotification, setAppNotification] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {

    const saved = localStorage.getItem('sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || ""
      };

      setUser(userData);
      localStorage.setItem("USER_KEY", JSON.stringify(userData));
    } else {
      setUser(null);
      localStorage.removeItem("USER_KEY");
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);
  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-collapse sidebar on writing (only on smaller screens or if user prefers)
  useEffect(() => {
    if ((isAdding || editingId) && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [isAdding, editingId]);

  useEffect(() => {
    if (user) {
      const loadEntries = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved).map((e: any) => ({
              ...e,
              content: e.content || e.text || ''
            }));
            parsed.sort((a: any, b: any) => {
              const timeA = new Date(a.manualDate || a.createdAt || 0).getTime();
              const timeB = new Date(b.manualDate || b.createdAt || 0).getTime();
              return timeB - timeA;
            });
            setEntries(parsed);
            return parsed;
          } catch (e) {
            console.error("Failed to parse entries", e);
            setEntries([]);
            return [];
          }
        }
        return [];
      };

      const freshEntries = loadEntries();
      
      // Check reminders if permission is already granted
      if ('Notification' in window && Notification.permission === 'granted') {
        checkAndSendNotification(freshEntries);
      }

      // Periodic check every 5 minutes
      const notificationInterval = setInterval(() => {
        // We need the most recent entries here. 
        // Since we are in an effect that depends on entries.length, 
        // this will be recreated when length changes, but better safe.
        const currentSaved = localStorage.getItem(STORAGE_KEY);
        const currentEntries = currentSaved ? JSON.parse(currentSaved) : [];
        checkAndSendNotification(currentEntries);
      }, 5 * 60 * 1000);

      // Listen for custom app notifications (in-app fallback)
      const handleAppNotification = (e: any) => {
        setAppNotification(e.detail);
        setTimeout(() => setAppNotification(null), 8000);
      };
      window.addEventListener('app-notification', handleAppNotification);

      // "Real-time" sync simulation across tabs
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === 'app_editing_id') {
          loadEntries();
          if (e.key === 'app_editing_id') setEditingId(e.newValue);
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(notificationInterval);
        window.removeEventListener('app-notification', handleAppNotification);
      };
    }
  }, [user, entries.length]); // Re-run when entries count changes to ensure fresh checks

  // Initial Splash/Loading Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setLoading(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // --- Auth Simulation ---
  const handleLogin = () => {
    const mockUser = { 
      uid: 'local-user', 
      email: 'explorer@timecapsule.ai', 
      displayName: 'Time Traveler' 
    };
    setUser(mockUser);
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };
  
  // Security
  const [lockConfig, setLockConfig] = useState<{ type: 'pin' | 'password' | 'biometric' | 'pattern', value: string | null }>(() => {
    try {
      const saved = localStorage.getItem('app_lock_config');
      return saved ? JSON.parse(saved) : { type: 'pin', value: localStorage.getItem('app_pin') };
    } catch {
      return { type: 'pin', value: null };
    }
  });
  const [isLocked, setIsLocked] = useState(() => !!localStorage.getItem('app_pin') || !!localStorage.getItem('app_lock_config'));

  // --- Stats & Streak ---
  const [streak, setStreak] = useState(0);
  const [onThisDay, setOnThisDay] = useState<Entry[]>([]);
  const [hasWrittenToday, setHasWrittenToday] = useState(false);

  useEffect(() => {
    if (entries.length > 0) {
      const today = new Date();
      setHasWrittenToday(entries.some(e => {
        const d = new Date(e.manualDate || e.createdAt as any || Date.now());
        return d ? isSameDay(d, today) : false;
      }));
      
      // Calculate Streak
      const uniqueDates = Array.from(new Set(entries.map(e => {
        const d = new Date(e.manualDate || e.createdAt as any || Date.now());
        return d ? format(d, 'yyyy-MM-dd') : null;
      }))).filter(Boolean).sort().reverse() as string[];

      let currentStreak = 0;
      let todayStr = format(new Date(), 'yyyy-MM-dd');
      let yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      if (uniqueDates.length > 0 && (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr)) {
        currentStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const d1 = new Date(uniqueDates[i]);
          const d2 = new Date(uniqueDates[i+1]);
          if (differenceInDays(d1, d2) === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      setStreak(currentStreak);

      // On This Day logic
      const pastMemories = entries.filter(e => {
        const d = new Date(e.manualDate || e.createdAt as any || Date.now());
        if (!d) return false;
        return isSameDay(d, today) && d.getFullYear() < today.getFullYear();
      });
      setOnThisDay(pastMemories);
    }
  }, [entries]);

  // --- Persistence & Theme ---
  const applyTheme = (themeName: string) => {
    const themeData = THEMES[themeName as keyof typeof THEMES] || THEMES.default;
    
    const tokens = {
      'bg': themeData.bg,
      'surface': themeData.surface,
      'text': themeData.text,
      'subtext': themeData.subtext,
      'accent': themeData.accent,
      'border': themeData.border
    };

    Object.entries(tokens).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_is_adding', String(isAdding));
    if (editingId) localStorage.setItem('app_editing_id', editingId);
    else localStorage.removeItem('app_editing_id');
  }, [isAdding, editingId]);

  const fontClass = useMemo(() => {
    const f = FONTS.find(f => f.id === personalization.fontFamily);
    return f ? f.class : 'font-sans';
  }, [personalization.fontFamily]);

  // --- Local CRUD Actions ---
  const saveToStorage = (newEntries: Entry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setEntries([...newEntries]);
  };

  const handleSaveEntry = async (data: Partial<Entry>, targetId?: string) => {
    if (!user) return null;

    const timestamp = new Date().toISOString();
    let newEntries: Entry[];
    const idToUse = targetId || editingId;

    if (idToUse) {
      newEntries = entries.map(e => e.id === idToUse ? { 
        ...e, 
        ...data, 
        updatedAt: timestamp as any
      } : e);
      console.log("Memory updated in unified collection:", idToUse);
      saveToStorage(newEntries);
      return idToUse;
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const newEntry: Entry = {
        title: '',
        content: '',
        ...data,
        id: newId,
        userId: user.uid,
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
      };
      
      console.log("New memory added to unified collection:", newId);
      newEntries = [newEntry, ...entries];
      saveToStorage(newEntries);
      return newId;
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!id) return;
    
    // Optimistic UI: Filter out the entry immediately
    const previousEntries = [...entries];
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      
      // If we are deleting the entry we are currently editing, close the editor
      if (editingId === id) {
        setEditingId(null);
        setIsAdding(false);
        localStorage.removeItem('app_editing_id');
      }
    } catch (err) {
      console.error("Delete failed", err);
      // Rollback on error
      setEntries(previousEntries);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const newEntries = entries.map(e => e.id === id ? { 
      ...e, 
      isFavorite, 
      updatedAt: new Date().toISOString() as any 
    } : e);
    saveToStorage(newEntries);
  };

  const [biometricActive, setBiometricActive] = useState(() => localStorage.getItem('app_biometric_active') === 'true');

  const handleSetLock = (type: 'pin' | 'password' | 'biometric' | 'pattern', value: string | null) => {
    const newConfig = { type, value };
    setLockConfig(newConfig);
    if (value || type === 'biometric') {
      localStorage.setItem('app_lock_config', JSON.stringify(newConfig));
      if (type === 'pin') localStorage.setItem('app_pin', value || '');
    } else {
      localStorage.removeItem('app_lock_config');
      localStorage.removeItem('app_pin');
      localStorage.removeItem('app_biometric_active');
      setBiometricActive(false);
    }
  };

  const handleToggleBiometric = (active: boolean) => {
    setBiometricActive(active);
    localStorage.setItem('app_biometric_active', active ? 'true' : 'false');
  };

  // --- Filters ---
  const filteredEntries = useMemo(() => {
    const cleanSearch = searchTerm.startsWith('#') ? searchTerm.slice(1) : searchTerm;
    return entries.filter(e => {
      const matchesSearch = !searchTerm || 
                            e.content.toLowerCase().includes(cleanSearch.toLowerCase()) || 
                            (e.title || '').toLowerCase().includes(cleanSearch.toLowerCase()) ||
                            (e.tags || []).some(t => t.toLowerCase().includes(cleanSearch.toLowerCase()));
      
      let matchesMode = true;
      if (view === 'archive') {
        if (filterMode === 'today') {
          const entryDate = new Date(e.manualDate || e.createdAt as any || Date.now());
          matchesMode = entryDate ? isSameDay(entryDate, new Date()) : false;
        } else if (filterMode === 'favorites') {
          matchesMode = !!e.isFavorite;
        }
      }

      return matchesSearch && matchesMode;
    });
  }, [entries, searchTerm, filterMode, view]);

  const editingEntry = editingId ? entries.find(e => e.id === editingId) : null;
  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;
  return (
    <>
      <AnimatePresence>
        {appNotification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] max-w-md w-full px-6"
          >
            <div className="bg-[var(--accent)] text-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">TimeCapsule Reminder</p>
                <p className="text-sm font-bold leading-tight">{appNotification}</p>
              </div>
              <button 
                onClick={() => setAppNotification(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSplash && (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="fixed inset-0 z-[1000] bg-bg-primary flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="relative flex flex-col items-center"
            >
              <div className="relative mb-12">
                <motion.div 
                  initial={{ rotate: -45, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, duration: 1.2, type: "spring" }}
                  className="w-32 h-32 bg-accent-primary rounded-[40px] flex items-center justify-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] relative z-10"
                >
                  <BookHeart className="w-16 h-16 text-white stroke-[2.5px]" />
                </motion.div>
                <div className="absolute -inset-8 bg-accent-primary/5 rounded-full blur-3xl animate-pulse" />
              </div>
              
              <div className="text-center space-y-6 relative z-10">
                <div className="space-y-1">
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-6xl font-sans font-bold tracking-tight text-accent-primary"
                  >
                    Time
                  </motion.h1>
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="text-6xl font-sans font-light tracking-tight text-accent-primary -mt-4 text-center w-full"
                  >
                    Capsule
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="text-xs font-black text-accent-primary/80 uppercase tracking-[0.5em] mt-3 blur-[0.05px]"
                  >
                    Your Sacred Diary
                  </motion.p>
                </div>
                
                <div className="h-px w-24 bg-accent-primary/20 mx-auto" />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 1.2, duration: 1 }}
                  className="text-sm font-medium text-text-secondary"
                >
                  Opening your sacred diary...
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!user && !loading && !showSplash && (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="max-w-2xl w-full text-center space-y-16"
            >
              <div className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 bg-accent-primary rounded-[32px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                    <BookHeart className="w-12 h-12 text-white stroke-[2.5px] relative z-10" />
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-8xl font-serif font-bold tracking-tight text-accent-primary mb-2">Time</h1>
                  <h1 className="text-8xl font-serif font-light tracking-tight text-accent-primary -mt-6">Capsule</h1>
                  <p className="text-sm font-bold text-accent-primary/60 uppercase tracking-[0.4em] mt-2">Personal Archive</p>
                </div>
                <div className="h-px w-32 bg-accent-primary/20 mx-auto" />
                <p className="text-text-secondary opacity-60 font-medium uppercase tracking-[0.4em] text-xs">A Sacred Space for Your Life's Journey</p>
              </div>
              
              <div className="max-w-sm mx-auto">
                <p className="text-xs text-text-secondary mb-10 leading-relaxed max-w-[280px] mx-auto italic">
                  "We do not remember days, we remember moments."
                </p>
                <button 
                  onClick={handleLogin}
                  className="w-full bg-accent-primary text-white py-6 rounded-[24px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-accent-primary/20 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  <span className="relative z-10">Enter Your Timeline</span>
                  <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
            
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-[50%] aspect-square bg-accent-primary/5 blur-[150px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[50%] aspect-square bg-accent-primary/5 blur-[150px] translate-y-1/2 -translate-x-1/2" />
            </div>
          </motion.div>
        )}

        {user && isLocked && lockConfig.value && !showSplash && (
          <motion.div
            key="lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PinLock lockConfig={lockConfig} biometricActive={biometricActive} onUnlock={() => setIsLocked(false)} />
          </motion.div>
        )}

        {user && (!isLocked || !lockConfig.value) && !showSplash && (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("flex h-screen bg-bg-primary text-text-primary overflow-hidden transition-all duration-700 ease-in-out", fontClass)} 
            style={{
              fontSize: `${personalization.fontSize}px`,
              lineHeight: personalization.lineHeight,
              letterSpacing: `${personalization.letterSpacing}px`
            }}
          >
          
            <Sidebar 
              user={user}
              view={view}
              setView={(v) => { 
                setView(v); 
                setIsAdding(false); 
                setEditingId(null); 
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              editingId={editingId}
              setEditingId={setEditingId}
              setIsAdding={setIsAdding}
              entries={entries}
              filteredEntries={filteredEntries}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              theme={theme}
              setTheme={setTheme}
              onAdd={() => { setIsAdding(true); setEditingId(null); setView('archive'); }}
              streak={streak}
              hasWrittenToday={hasWrittenToday}
              onLogout={handleLogout}
              onDeleteEntry={handleDeleteEntry}
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />

            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[45]"
                />
              )}
            </AnimatePresence>

            <main className="flex-1 h-full flex flex-col bg-bg-primary relative overflow-hidden transition-all duration-500 ease-in-out">
              {/* Global Sidebar Toggle Button (Desktop hidden when open, Mobile always controlled by menu) */}
              <div className="absolute top-6 left-6 z-[40] flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "p-3 rounded-2xl bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] text-[var(--text)] shadow-sm hover:scale-105 transition-all focus:ring-2 focus:ring-[var(--accent)]/20",
                    isSidebarOpen && "lg:hidden"
                  )}
                  title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isAdding || editingId ? (
                  <motion.div 
                    key="editor"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-0 z-[101] bg-bg-primary"
                  >
                    <EntryEditor 
                      user={user}
                      onSave={handleSaveEntry}
                      onDelete={handleDeleteEntry}
                      onClose={() => { setIsAdding(false); setEditingId(null); }}
                      entry={editingEntry}
                      isAdding={isAdding}
                      entries={entries}
                    />
                  </motion.div>
                ) : view === 'insights' ? (
                  <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full overflow-y-auto">
                    <InsightsView entries={entries} />
                  </motion.div>
                ) : view === 'gallery' ? (
                  <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full overflow-y-auto">
                    <GalleryView 
                      entries={entries} 
                      onFullscreenMedia={(url, type) => setFullscreenMedia({ url, type })} 
                      onEditEntry={(e) => { setEditingId(e.id); setIsAdding(false); }}
                    />
                  </motion.div>
                ) : view === 'calendar' ? (
                  <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full overflow-y-auto">
                    <CalendarView entries={entries} onEditEntry={(e) => { setEditingId(e.id); setIsAdding(false); }} onFullscreenMedia={(url, type) => setFullscreenMedia({ url, type })} />
                  </motion.div>
                ) : view === 'map' ? (
                  <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full">
                    <MapView entries={entries} onSelectEntry={(e) => { setEditingId(e.id); setIsAdding(false); }} />
                  </motion.div>
                ) : view === 'tags' ? (
                  <motion.div key="tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full overflow-y-auto">
                    <TagsView entries={entries} onEditEntry={(e) => { setEditingId(e.id); setIsAdding(false); }} />
                  </motion.div>
                ) : view === 'settings' ? (
                  <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full overflow-y-auto">
                    <SettingsView 
                      onSetLock={handleSetLock} 
                      lockConfig={lockConfig} 
                      biometricActive={biometricActive} 
                      onToggleBiometric={handleToggleBiometric}
                      personalization={personalization}
                      onUpdatePersonalization={(updates) => setPersonalization(prev => ({ ...prev, ...updates }))}
                      theme={theme}
                      onSetTheme={setTheme}
                      user={user}
                      onLogout={handleLogout}
                      entries={entries}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 h-full overflow-y-auto">
                    <EntryList 
                      entries={filteredEntries} 
                      allEntries={entries}
                      onThisDay={onThisDay}
                      filterMode={filterMode} 
                      onEdit={(e) => setEditingId(e.id)} 
                      onDelete={(id) => {
                        if (confirm('Erase this memory from eternity?')) {
                          handleDeleteEntry(id);
                        }
                      }}
                      onAdd={() => setIsAdding(true)}
                      onFullscreenMedia={(url, type) => setFullscreenMedia({ url, type })}
                      onToggleFavorite={handleToggleFavorite}
                      onTagClick={(tag) => setSearchTerm(tag)}
                      searchTerm={searchTerm}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {fullscreenMedia && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-20"
                    onClick={() => setFullscreenMedia(null)}
                  >
                    <button 
                      onClick={() => setFullscreenMedia(null)}
                      className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[210]"
                    >
                      <X className="w-8 h-8" />
                    </button>
                    
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="max-w-6xl w-full h-full flex items-center justify-center"
                      onClick={e => e.stopPropagation()}
                    >
                      {fullscreenMedia.type === 'image' && fullscreenMedia.url && (
                        <img src={fullscreenMedia.url} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                      )}
                      {fullscreenMedia.type === 'video' && fullscreenMedia.url && (
                        <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl" />
                      )}
                      {fullscreenMedia.type === 'audio' && fullscreenMedia.url && (
                        <div className="bg-white/10 p-12 rounded-[48px] border border-white/20 flex flex-col items-center gap-8 shadow-2xl">
                          <Mic className="w-20 h-20 text-white/50" />
                          <audio src={fullscreenMedia.url} controls className="w-80" />
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/80 backdrop-blur-xl border border-border-primary/50 rounded-[32px] grid grid-cols-5 px-4 items-center z-50 shadow-2xl"
            >
              <button onClick={() => setView('archive')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", view === 'archive' ? "text-accent-primary" : "text-text-secondary")}>
                <Clock className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Feed</span>
              </button>
              <button onClick={() => setView('calendar')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", view === 'calendar' ? "text-accent-primary" : "text-text-secondary")}>
                <Calendar className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Dates</span>
              </button>
              <div className="flex justify-center -mt-12">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setIsAdding(true); setEditingId(null); setView('archive'); }}
                  className="w-16 h-16 bg-accent-primary text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-accent-primary/40 border-4 border-white"
                >
                  <Plus className="w-8 h-8" />
                </motion.button>
              </div>
              <button onClick={() => setView('gallery')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", view === 'gallery' ? "text-accent-primary" : "text-text-secondary")}>
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Gallery</span>
              </button>
              <button onClick={() => setView('map')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", view === 'map' ? "text-accent-primary" : "text-text-secondary")}>
                <MapIcon className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Map</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
