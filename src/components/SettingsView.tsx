import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Lock, 
  Fingerprint, 
  Smartphone, 
  LogOut, 
  ShieldCheck, 
  Info, 
  Palette,
  User as UserIcon,
  BookHeart,
  Mail,
  HardDrive,
  MessageSquare,
  Unlock,
  Grid,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  FileText,
  FileCode,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Search,
  ArrowRight,
  HelpCircle,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FONTS, Entry, THEMES } from '../lib/constants';
import { PinLock } from './PinLock';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings, requestNotificationPermission, isNotificationsSupported, isInsideIframe } from '../services/notificationService';

interface SettingsViewProps {
  onSetLock: (type: 'pin' | 'password' | 'biometric' | 'pattern', value: string | null) => void;
  lockConfig: { type: 'pin' | 'password' | 'biometric' | 'pattern', value: string | null };
  biometricActive: boolean;
  onToggleBiometric: (active: boolean) => void;
  personalization: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  };
  onUpdatePersonalization: (updates: any) => void;
  theme: string;
  onSetTheme: (theme: string) => void;
  user: { uid: string; displayName: string; photoURL?: string; email: string } | null;
  onLogout: () => void;
  entries: Entry[];
}

export function SettingsView({ 
  onSetLock, 
  lockConfig, 
  biometricActive, 
  onToggleBiometric,
  personalization,
  onUpdatePersonalization,
  theme,
  onSetTheme,
  user,
  onLogout,
  entries
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'display' | 'atmosphere' | 'notifications' | 'about'>('account');
  const [screenConceal, setScreenConceal] = useState(true);
  const [showLockSetup, setShowLockSetup] = useState(false);
  const [exporting, setExporting] = useState<'json' | 'pdf' | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMode, setSupportMode] = useState<'home' | 'chat'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hello! I'm your TimeCapsule Assistant. I can help you with uploads, themes, AI features, and more. How can I help you preserve your memories today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings());

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!isNotificationsSupported()) {
      setNotification({ 
        type: 'error', 
        message: "Notifications are not supported by your browser or in this environment." 
      });
      return;
    }

    if (isInsideIframe()) {
      setNotification({ 
        type: 'error', 
        message: "Notifications are blocked in this environment. Please open the app in a browser tab and enable notifications in site settings." 
      });
      return;
    }

    if (enabled) {
      if (Notification.permission === 'denied') {
        setNotification({ 
          type: 'error', 
          message: "Notifications are blocked. Please enable them in your browser's site settings to use this feature." 
        });
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotification({ type: 'error', message: "Permission was denied. Please allow notifications to enable this feature." });
        return;
      }
    }
    const updated = { ...notifSettings, enabled };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleUpdateReminderTime = (reminderTime: string) => {
    const updated = { ...notifSettings, reminderTime };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const suggestions = [
    "Why is my upload failing?",
    "How do themes work?",
    "How to edit a memory?",
    "Explain AI summarize"
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const faqCategories = [
    {
      id: 'writing',
      title: 'Writing & Memories',
      icon: <BookHeart className="w-5 h-5" />,
      questions: [
        { q: "How do I write a memory?", a: "Tap “Write Memory”, add your thoughts, choose mood, and press Preserve." },
        { q: "Can I edit or delete a memory?", a: "Yes — open any memory and use edit or delete actions." }
      ]
    },
    {
      id: 'media',
      title: 'Media & Uploads',
      icon: <HardDrive className="w-5 h-5" />,
      questions: [
        { q: "Why is my media not uploading?", a: "Check file size limits, ensure internet connection, and wait until upload completes before saving." },
        { q: "What files can I upload?", a: "Images, videos, audio, documents (PDF, DOCX, PPTX), code files (JSON, JSX, TSX), and links." }
      ]
    },
    {
      id: 'themes',
      title: 'Themes & Appearance',
      icon: <Palette className="w-5 h-5" />,
      questions: [
        { q: "Why are themes not changing?", a: "Make sure a theme is selected. Themes update instantly across the app. If not, refresh or reselect." },
        { q: "What does Atmosphere do?", a: "It changes the visual mood of your journaling space." }
      ]
    },
    {
      id: 'ai',
      title: 'AI Features',
      icon: <Sparkles className="w-5 h-5" />,
      questions: [
        { q: "What does “Suggest Mood” do?", a: "AI analyzes your writing and recommends a mood." },
        { q: "What is AI Summarize?", a: "It creates a short version of your memory." }
      ]
    },
    {
      id: 'general',
      title: 'General',
      icon: <ShieldCheck className="w-5 h-5" />,
      questions: [
        { q: "Is my data safe?", a: "Yes — your data is securely stored and private." }
      ]
    }
  ];

  const filteredFaqs = searchQuery.trim() === '' 
    ? faqCategories 
    : faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0);

  const handleSendMessage = (textOverride?: string) => {
    const messageText = textOverride || chatInput.trim();
    if (!messageText) return;

    setChatMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setChatInput('');
    setIsTyping(true);

    // Bot Logic
    setTimeout(() => {
      let reply = "I didn’t quite get that. You can ask me things like:";
      const lowerMsg = messageText.toLowerCase();

      if (lowerMsg.includes('upload')) {
        reply = "Upload issues are usually due to file size limits or connection. Ensure you wait for the preserve button to activate after uploading. We support PDF, Images, Video, Audio, and even code files!";
      } else if (lowerMsg.includes('delete')) {
        reply = "To delete a memory, open any entry in the Archive or Gallery and tap the trash icon. Note: Deletions are permanent!";
      } else if (lowerMsg.includes('edit')) {
        reply = "Open any memory and tap the pencil icon to enter edit mode. You can update text, feelings, or media fragments.";
      } else if (lowerMsg.includes('safe') || lowerMsg.includes('privacy') || lowerMsg.includes('data')) {
        reply = "Your data is stored securely and private. We use local encryption for your inner sanctum.";
      } else if (lowerMsg.includes('add') || lowerMsg.includes('create') || lowerMsg.includes('write')) {
        reply = "Tap the 'Write Memory' button on the sidebar. Express your thoughts, add some media, choose a mood, and hit 'Preserve'.";
      } else if (lowerMsg.includes('theme') || lowerMsg.includes('atmosphere')) {
        reply = "Atmospheres change the visual mood. Go to Settings > Atmosphere to pick a theme that matches your current headspace.";
      } else if (lowerMsg.includes('summarize') || lowerMsg.includes('ai')) {
        reply = "Our AI features include Mood Suggestion and Summarization. When writing, look for the sparkles icon to get a smart recap of your entry.";
      }

      setChatMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleExportJSON = async () => {
    setExporting('json');
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const exportData = entries.map(e => ({
        id: e.id,
        title: e.title || "Untitled",
        content: e.content,
        emotion: e.emotion,
        emoji: e.emoji,
        media: e.media || [],
        location: e.location,
        tags: e.tags || [],
        isFavorite: e.isFavorite,
        manualDate: e.manualDate,
        fontFamily: e.fontFamily,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timecapsule-archive-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification({ type: 'success', message: "JSON Archive Exported Successfully" });
      setShowExportModal(false);
    } catch (error) {
      console.error("Export failed:", error);
      setNotification({ type: 'error', message: "Failed to export archive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 30;

      // Header
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246); // accent-primary colorish
      doc.text("My TimeCapsule Memories", margin, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${new Date().toLocaleDateString()} for ${user?.displayName}`, margin, y);
      y += 20;

      // Entries
      entries.forEach((entry, index) => {
        // Check if we need a new page
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 30;
        }

        // Date & Emoji
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        const dateStr = entry.manualDate ? new Date(entry.manualDate).toLocaleDateString() : new Date(entry.createdAt).toLocaleDateString();
        doc.text(`${dateStr} • ${entry.emoji || '✨'} • ${entry.emotion || 'Natural'}`, margin, y);
        y += 8;

        // Title
        if (entry.title) {
          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text(entry.title, margin, y);
          y += 8;
        }

        // Text Content
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        const splitText = doc.splitTextToSize(entry.content, pageWidth - margin * 2);
        
        // Handle multi-page text blocks
        splitText.forEach((line: string) => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 30;
          }
          doc.text(line, margin, y);
          y += 6;
        });

        // Location
        if (entry.location) {
          y += 2;
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Recorded at: ${entry.location}`, margin, y);
          y += 4;
        }

        y += 15; // Gap between entries
      });

      doc.save(`My_Memories_${new Date().toISOString().split('T')[0]}.pdf`);
      setNotification({ type: 'success', message: "Your memories are ready 💫" });
      setShowExportModal(false);
    } catch (error) {
      console.error("PDF Export failed:", error);
      setNotification({ type: 'error', message: "Failed to generate PDF" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-12 pb-40 text-[var(--text)]">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.2em]">
          <ShieldCheck className="w-3 h-3" />
          Control Center
        </div>
        <h2 className="text-5xl font-bold text-[var(--accent)] tracking-tight font-sans">Settings</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-2">
          <SettingsTab active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<UserIcon className="w-4 h-4" />} label="Account" />
          <SettingsTab active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<ShieldCheck className="w-4 h-4" />} label="Security" />
          <SettingsTab active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Bell className="w-4 h-4" />} label="Engagement" />
          <SettingsTab active={activeTab === 'display'} onClick={() => setActiveTab('display')} icon={<Palette className="w-4 h-4" />} label="Typography" />
          <SettingsTab active={activeTab === 'atmosphere'} onClick={() => setActiveTab('atmosphere')} icon={<Sparkles className="w-4 h-4" />} label="Atmosphere" />
          <SettingsTab active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Info className="w-4 h-4" />} label="TimeCapsule" />
        </div>

        {/* Content Area */}
        <div className="md:col-span-9 bg-[var(--surface)] rounded-[40px] border border-[var(--border)] p-10 shadow-sm overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex items-center gap-6">
                  <img src={user?.photoURL || undefined} alt="" className="w-20 h-20 rounded-full border-4 border-[var(--bg)] shadow-lg" />
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text)]">{user?.displayName}</h3>
                    <p className="text-[var(--subtext)] opacity-60 flex items-center gap-2"><Mail className="w-3 h-3" /> {user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-[var(--bg)] rounded-3xl border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[var(--subtext)] opacity-40 mb-1">Archive Status</p>
                      <p className="text-sm font-bold text-[var(--text)]">Local Archive Active</p>
                    </div>
                    <div className="p-2 bg-green-500/10 text-green-600 rounded-full">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <button 
                    onClick={onLogout}
                    className="w-full p-6 bg-red-50 text-red-500 rounded-3xl font-bold flex items-center justify-between hover:bg-red-500 hover:text-white transition-all group"
                  >
                    Logout of Capsule
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-black text-[var(--text)]">Inner Sanctum</h3>
                  <p className="text-[10px] text-[var(--subtext)] uppercase tracking-[0.2em] font-bold opacity-60">Keep your secret fragments safe from prying eyes.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <SecurityOption 
                      icon={<Lock className="w-5 h-5" />} 
                      title={lockConfig.value ? `${lockConfig.type.toUpperCase()} Lock Active` : "Setup Lock"} 
                      desc={lockConfig.value ? "Your archive is protected" : "PIN, Pattern, or Password protection"}
                      isActive={!!lockConfig.value}
                      onToggle={() => {
                        if (lockConfig.value) onSetLock('pin', null);
                        else setShowLockSetup(true);
                      }}
                    />
                    <SecurityOption 
                      icon={<Fingerprint className="w-5 h-5" />} 
                      title="Biometric Access" 
                      desc="Use TouchID, FaceID or Fingerprint"
                      isActive={biometricActive}
                      onToggle={() => onToggleBiometric(!biometricActive)}
                    />
                    <SecurityOption 
                      icon={<Smartphone className="w-5 h-5" />} 
                      title="Screen Conceal" 
                      desc="Blur diary content in multitasking view"
                      isActive={screenConceal}
                      onToggle={() => setScreenConceal(!screenConceal)}
                    />
                  </div>

                  {lockConfig.value && (
                    <div className="p-6 bg-[var(--bg)] rounded-[32px] border border-[var(--border)] text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40 mb-4">Current Protection Type</p>
                      <div className="inline-flex items-center gap-3 px-6 py-2 bg-[var(--surface)] rounded-full border border-[var(--border)] shadow-sm text-xs font-bold text-[var(--accent)]">
                        {lockConfig.type === 'pin' && <Grid className="w-3.5 h-3.5" />}
                        {lockConfig.type === 'password' && <Lock className="w-3.5 h-3.5" />}
                        {lockConfig.type === 'pattern' && <Unlock className="w-3.5 h-3.5" />}
                        {lockConfig.type === 'biometric' && <Fingerprint className="w-3.5 h-3.5" />}
                        {lockConfig.type.toUpperCase()}
                      </div>
                      <button 
                        onClick={() => setShowLockSetup(true)}
                        className="block w-full mt-4 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:opacity-100 opacity-60 transition-opacity"
                      >
                        Change Lock Method
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-black text-[var(--text)]">Daily Rhythm</h3>
                  <p className="text-[10px] text-[var(--subtext)] uppercase tracking-[0.2em] font-bold opacity-60">Smart nudges to keep your story moving forward.</p>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-[var(--bg)] rounded-[40px] border border-[var(--border)] flex items-center justify-between group hover:border-[var(--accent)]/30 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                        (notifSettings.enabled && isNotificationsSupported() && !isInsideIframe()) ? "bg-[var(--accent)] text-white shadow-[var(--accent)]/20" : "bg-[var(--surface)] text-[var(--subtext)] opacity-40 shadow-none border border-[var(--border)]"
                      )}>
                        <Bell className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--text)]">Daily Smart Reminder</h4>
                        {!isNotificationsSupported() ? (
                          <p className="text-[10px] uppercase font-black tracking-widest text-red-500 mt-0.5">Not supported in this browser</p>
                        ) : isInsideIframe() ? (
                          <p className="text-[10px] uppercase font-black tracking-widest text-orange-500 mt-0.5">Blocked in Preview (Open in new tab)</p>
                        ) : (
                          <p className="text-[10px] uppercase font-black tracking-widest text-[var(--subtext)] opacity-40 mt-0.5">Gentle nudges for your memories</p>
                        )}
                      </div>
                    </div>
                    <button 
                      disabled={!isNotificationsSupported() || isInsideIframe()}
                      onClick={() => handleToggleNotifications(!notifSettings.enabled)}
                      className={cn(
                        "w-14 h-8 rounded-full p-1 transition-all duration-500 ease-in-out relative",
                        notifSettings.enabled && isNotificationsSupported() && !isInsideIframe() ? "bg-[var(--accent)]" : "bg-black/10",
                        (!isNotificationsSupported() || isInsideIframe()) && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <motion.div 
                        animate={{ x: (notifSettings.enabled && isNotificationsSupported() && !isInsideIframe()) ? 24 : 0 }}
                        className="w-6 h-6 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {notifSettings.enabled && isNotificationsSupported() && !isInsideIframe() && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden"
                      >
                        <div className="p-8 bg-[var(--surface)] rounded-[40px] border-2 border-[var(--bg)] shadow-sm space-y-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">Preferred Reflection Time</h4>
                              <p className="text-[10px] text-[var(--subtext)] font-medium opacity-60">When should we reach out to you?</p>
                            </div>
                            <input 
                              type="time" 
                              value={notifSettings.reminderTime} 
                              onChange={(e) => handleUpdateReminderTime(e.target.value)}
                              className="px-6 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-[var(--text)] font-bold focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                            />
                          </div>

                          <div className="pt-6 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ReminderFeature icon={<Clock className="w-4 h-4" />} title="Timely" desc="Sent at your peak reflection hour." />
                            <ReminderFeature icon={<Sparkles className="w-4 h-4" />} title="Dynamic" desc="Unique messages that avoid repetition." />
                            <ReminderFeature icon={<BrainCircuit className="w-4 h-4" />} title="Smart" desc="Only sent if you haven't written today." />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-8 bg-black/5 rounded-[32px] border border-black/5 text-[10px] leading-relaxed text-[var(--subtext)] italic opacity-50">
                  TimeCapsule uses behavioral science to determine the best vibration and tone for your daily nudges. If you've been inactive for over 3 days, our messages subtly shift to an "encouraging" tone, and after 7 days, they focus on "emotional reconnection."
                </div>
              </motion.div>
            )}

            {activeTab === 'display' && (
              <motion.div key="display" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">Aesthetic Fonts</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {FONTS.map(font => (
                      <button 
                        key={font.id}
                        onClick={() => onUpdatePersonalization({ fontFamily: font.id })}
                        className={cn(
                          "p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden",
                          personalization.fontFamily === font.id 
                            ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg" 
                            : "bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                        )}
                      >
                        <div className="relative z-10">
                          <span className="text-2xl mb-2 block">{font.icon}</span>
                          <p className={cn("text-xs font-bold uppercase tracking-widest", font.class)} style={{ fontFamily: font.id === 'sans' ? 'inherit' : `var(--font-${font.id})` }}>{font.name}</p>
                        </div>
                        {personalization.fontFamily === font.id && (
                          <motion.div layoutId="activeFont" className="absolute inset-0 bg-white/10" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">Detail Adjustments</h3>
                  <div className="space-y-4">
                    <Slider label="Text Intensity" value={personalization.fontSize} min={14} max={24} onChange={(v) => onUpdatePersonalization({ fontSize: v })} />
                    <Slider label="Breathability" value={personalization.lineHeight} min={1.2} max={2} step={0.1} onChange={(v) => onUpdatePersonalization({ lineHeight: v })} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'atmosphere' && (
              <motion.div key="atmosphere" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">Visual Atmosphere</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(THEMES).map(([id, themeData]) => (
                      <button 
                        key={id}
                        onClick={() => onSetTheme(id)}
                        className={cn(
                          "group relative p-6 rounded-[32px] border-2 transition-all text-left overflow-hidden",
                          theme === id 
                            ? "border-[var(--accent)] shadow-xl scale-[1.02] bg-[var(--surface)]" 
                            : "border-[var(--border)] hover:border-[var(--accent)]/20 bg-[var(--surface)]"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div 
                            className="w-12 h-12 rounded-2xl shadow-inner border border-black/5"
                            style={{ backgroundColor: themeData.bg }}
                          >
                            <div 
                              className="w-6 h-6 rounded-lg m-1 shadow-sm"
                              style={{ backgroundColor: themeData.accent }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold flex items-center gap-2" style={{ color: themeData.text }}>
                              <span className="text-base">{themeData.emoji}</span>
                              {themeData.name}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: themeData.subtext }}>Atmosphere Fragment</p>
                          </div>
                          {theme === id && (
                            <div className="ml-auto w-6 h-6 bg-[var(--accent)] text-white rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        
                        {/* Selected Indicator */}
                        {theme === id && (
                          <motion.div 
                            layoutId="selectedTheme" 
                            className="absolute inset-0 border-2 border-[var(--accent)] rounded-[32px] pointer-events-none" 
                            initial={false}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-[var(--bg)] rounded-[32px] border border-[var(--border)] space-y-2">
                  <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-2">
                    <Info className="w-4 h-4 text-[var(--accent)]" />
                    Premium Theming
                  </h4>
                  <p className="text-[10px] text-[var(--subtext)] leading-relaxed opacity-60">Every Atmosphere has been carefully calibrated using high-contrast design tokens to ensure maximum legibility and distinctive aesthetic identity. Changes are applied instantly across all perspectives.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div key="about" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center space-y-6 py-10">
                  <div className="w-20 h-20 bg-[var(--accent)] rounded-[32px] mx-auto flex items-center justify-center shadow-xl">
                    <BookHeart className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif font-black tracking-tight text-[var(--text)]">TimeCapsule</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] opacity-50">Version 2.7.0 (Premium)</p>
                  </div>
                </div>

                <div className="p-8 bg-[var(--bg)] rounded-[48px] border border-[var(--border)] text-sm text-[var(--subtext)] leading-relaxed space-y-6 font-medium italic opacity-80 backdrop-blur-sm">
                  <p>Remember those childhood notebook diaries? The ones with the tiny locks where you preserved your most precious memories to read them years later? This is that same sacred space, evolved for your digital life.</p>
                  <p>In a world of vanishing moments, TimeCapsule is your permanent witness. We don't just store data; we preserve the texture of your existence—the subtle shifts in mood, the visual fragments of your travels, and the silent echoes of your thoughts.</p>
                  <p>Your archive is encrypted, private, and yours alone. Designed for the deep thinkers who understand that every day is a masterpiece worth remembering.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] flex flex-col items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm group"
                  >
                    <div className="p-3 bg-[var(--bg)] rounded-2xl group-hover:bg-white/20 transition-colors">
                      <Download className="w-5 h-5 text-[var(--text)]" />
                    </div>
                    <span className="text-[var(--text)] group-hover:text-white">Export Memories</span>
                  </button>
                  <button 
                    onClick={() => setShowSupport(true)}
                    className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] flex flex-col items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm group"
                  >
                    <div className="p-3 bg-[var(--bg)] rounded-2xl group-hover:bg-white/20 transition-colors">
                      <MessageSquare className="w-5 h-5 text-[var(--text)]" />
                    </div>
                    <span className="text-[var(--text)] group-hover:text-white">Support</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Export Options Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[var(--surface)] rounded-[48px] p-10 shadow-2xl relative overflow-hidden text-[var(--text)]"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-[var(--subtext)] opacity-40" />
                </button>
              </div>

              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-[32px] mx-auto flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[var(--accent)]" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif font-black text-[var(--text)]">Export Memories</h3>
                  <p className="text-sm text-[var(--subtext)] font-medium px-4">Choose how you wish to preserve your heritage.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={handleExportPDF}
                    disabled={!!exporting}
                    className="p-6 bg-[var(--accent)] text-white rounded-[32px] flex items-center gap-5 transition-all hover:scale-[1.02] shadow-xl shadow-[var(--accent)]/20 disabled:opacity-50"
                  >
                    <div className="p-4 bg-white/20 rounded-2xl">
                      {exporting === 'pdf' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Download as PDF</p>
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-60 text-white/70">Beautiful & Printable</p>
                    </div>
                  </button>

                  <div className="pt-4 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-40">Advanced Options</p>
                    <button 
                      onClick={handleExportJSON}
                      disabled={!!exporting}
                      className="w-full p-6 bg-[var(--bg)] border border-[var(--border)] rounded-[32px] flex items-center gap-5 transition-all hover:bg-[var(--surface)] group disabled:opacity-50"
                    >
                      <div className="p-4 bg-[var(--surface)] rounded-2xl shadow-sm text-[var(--subtext)] group-hover:text-[var(--accent)] transition-colors">
                        {exporting === 'json' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileCode className="w-6 h-6" />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[var(--text)]">JSON Data Export</p>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-40 italic">Developer backup (.json)</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setShowExportModal(false)}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40 hover:opacity-100 transition-opacity pt-4"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success/Error Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300]"
          >
            <div className={cn(
              "px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-4 border",
              notification.type === 'success' ? "bg-green-500 text-white border-green-400" : "bg-red-500 text-white border-red-400"
            )}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="w-4 h-4 opacity-50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupport && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-xl w-full bg-[var(--surface)] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col h-[85vh] max-h-[850px] text-[var(--text)]"
            >
              <div className="p-8 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] relative z-20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--accent)]/10 rounded-2xl">
                    <HelpCircle className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-black text-[var(--text)]">How can I help you?</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-[var(--subtext)] opacity-40">Get quick answers or ask the assistant</p>
                  </div>
                </div>
                <button onClick={() => { setShowSupport(false); setSupportMode('home'); setSearchQuery(''); }} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-[var(--subtext)] opacity-40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait">
                  {supportMode === 'home' ? (
                    <motion.div 
                      key="support-home"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      {/* Search Bar */}
                      <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--subtext)] opacity-40 group-focus-within:text-[var(--accent)] group-focus-within:opacity-100 transition-all" />
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for help... (uploads, themes, AI, etc.)"
                          className="w-full h-16 pl-16 pr-6 bg-[var(--bg)] border border-[var(--border)] rounded-[24px] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all outline-none"
                        />
                      </div>

                      {/* AI CTA */}
                      <button 
                        onClick={() => setSupportMode('chat')}
                        className="w-full p-6 bg-[var(--accent)]/5 rounded-[32px] border border-[var(--accent)]/10 flex items-center justify-between group hover:bg-[var(--accent)]/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/20">
                            <BrainCircuit className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-black text-sm uppercase tracking-tight text-[var(--text)]">Still stuck? Ask the assistant</h4>
                            <p className="text-[10px] font-bold text-[var(--subtext)] opacity-60 uppercase tracking-widest">Context-aware expert help</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </button>

                      {/* FAQ Categories */}
                      <div className="space-y-10">
                        {filteredFaqs.length > 0 ? (
                          filteredFaqs.map((category) => (
                            <section key={category.id} className="space-y-4">
                              <h5 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subtext)] opacity-40">
                                {category.icon}
                                {category.title}
                              </h5>
                              <div className="grid grid-cols-1 gap-3">
                                {category.questions.map((faq, fIdx) => {
                                  const globalIdx = `faq-${category.id}-${fIdx}`;
                                  const isExpanded = expandedFaq === globalIdx as any;
                                  return (
                                    <div 
                                      key={fIdx} 
                                      className={cn(
                                        "bg-[var(--surface)] border border-[var(--border)] rounded-[24px] overflow-hidden transition-all hover:shadow-md",
                                        isExpanded && "ring-2 ring-[var(--accent)]/10"
                                      )}
                                    >
                                      <button 
                                        onClick={() => setExpandedFaq(isExpanded ? null : globalIdx as any)}
                                        className="w-full p-6 text-left flex items-center justify-between"
                                      >
                                        <div className="space-y-1 pr-4">
                                          <p className="text-sm font-bold text-[var(--text)] leading-tight">{faq.q}</p>
                                          {!isExpanded && <p className="text-[10px] text-[var(--subtext)] opacity-60 line-clamp-1">{faq.a}</p>}
                                        </div>
                                        <div className={cn("p-2 rounded-xl bg-[var(--bg)] transition-transform", isExpanded && "rotate-180 bg-[var(--accent)]/10 text-[var(--accent)]")}>
                                          <ChevronDown className="w-4 h-4" />
                                        </div>
                                      </button>
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-6 pb-6 pt-2 text-sm text-[var(--subtext)] font-medium leading-relaxed bg-[var(--bg)]/10">
                                              {faq.a}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          ))
                        ) : (
                          <div className="text-center py-20 space-y-6">
                            <div className="w-20 h-20 bg-[var(--bg)] rounded-[32px] mx-auto flex items-center justify-center">
                              <HelpCircle className="w-10 h-10 opacity-10" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-[var(--subtext)] opacity-40 italic">Couldn't find what you're looking for?</p>
                              <button 
                                onClick={() => { setSupportMode('chat'); setSearchQuery(''); }}
                                className="px-8 py-3 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[var(--accent)]/20 hover:scale-105 transition-all"
                              >
                                Ask AI Assistant
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="support-chat"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col h-[70vh]"
                    >
                      <div className="p-4 bg-[var(--bg)]/50 border-b border-[var(--border)] flex items-center justify-between">
                         <button 
                          onClick={() => setSupportMode('home')}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] hover:text-[var(--accent)] transition-colors"
                         >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Back to Center
                         </button>
                         <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-[9px] font-black uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" />
                            Live Assistant
                         </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar h-full scroll-smooth">
                        {chatMessages.map((msg, idx) => {
                          const isLatest = idx === chatMessages.length - 1;
                          return (
                            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                              <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                                animate={{ 
                                  scale: 1, 
                                  opacity: isLatest ? 1 : 0.7,
                                  y: 0 
                                }}
                                className={cn(
                                  "max-w-[85%] p-5 rounded-[28px] text-[13px] font-medium leading-relaxed shadow-sm transition-all duration-300",
                                  msg.role === 'user' 
                                    ? "bg-[var(--accent)] text-white rounded-tr-none shadow-[var(--accent)]/20" 
                                    : "bg-[var(--surface)] text-[var(--text)] rounded-tl-none border border-[var(--border)]"
                                )}
                              >
                                {msg.text}
                              </motion.div>
                            </div>
                          );
                        })}
                        {isTyping && (
                          <div className="flex justify-start">
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-[var(--surface)] border border-[var(--border)] rounded-[28px] rounded-tl-none p-5 flex items-center gap-2"
                            >
                              <div className="flex gap-1">
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">Preserving thought...</span>
                            </motion.div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)] relative z-30">
                        {/* Suggestions */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mt-2">
                          {suggestions.map((s, i) => (
                            <button 
                              key={i}
                              onClick={() => handleSendMessage(s)}
                              className="whitespace-nowrap px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all flex-shrink-0"
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Ask something about your memories..."
                            className="w-full h-16 pl-6 pr-16 bg-[var(--bg)] border border-[var(--border)] rounded-[24px] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all outline-none text-[var(--text)] shadow-inner"
                          />
                          <button 
                            onClick={() => handleSendMessage()}
                            disabled={!chatInput.trim() || isTyping}
                            className="absolute right-3 top-3 w-10 h-10 bg-[var(--accent)] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--accent)]/20 disabled:opacity-30"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-center mt-4 text-[9px] font-bold text-[var(--subtext)] opacity-40 uppercase tracking-widest">AI assistant can understand text and context</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLockSetup && (
          <PinLock 
            isSetting 
            onSet={(val, type) => {
              onSetLock(type || 'pin', val);
              setShowLockSetup(false);
            }} 
            onCancel={() => setShowLockSetup(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReminderFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-[10px] text-[var(--subtext)] font-medium leading-relaxed opacity-60">{desc}</p>
    </div>
  );
}

function SettingsTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative group",
        active ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--subtext)] hover:bg-[var(--surface)] text-[var(--text)]"
      )}
    >
      {icon}
      {label}
      {active && <motion.div layoutId="settingActive" className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
    </button>
  );
}

function SecurityOption({ icon, title, desc, isActive, onToggle }: { icon: React.ReactNode, title: string, desc: string, isActive: boolean, onToggle: () => void }) {
  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] flex items-center justify-between group hover:border-[var(--accent)]/20 transition-all shadow-sm">
      <div className="flex items-center gap-5">
        <div className={cn("p-4 rounded-[20px] transition-all", isActive ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/10" : "bg-[var(--bg)] text-[var(--subtext)]")}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-[var(--text)] uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] font-bold text-[var(--subtext)] opacity-40 uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-14 h-7 rounded-full p-1 transition-all relative border border-[var(--border)]/20 shadow-inner",
          isActive ? "bg-[var(--accent)]" : "bg-[var(--bg)]"
        )}
      >
        <motion.div 
          animate={{ x: isActive ? 28 : 0 }}
          className="w-5 h-5 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4 text-[var(--text)]">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">
        <span>{label}</span>
        <span className="text-[var(--accent)] opacity-100">{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[var(--bg)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
}
