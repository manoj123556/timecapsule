import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, Image as ImageIcon, Video, Mic, 
  Sparkles, Star, Tag, Clock, Loader2, Type, Paperclip,
  Check, MapPin, Plus, RefreshCw, ExternalLink,
  Calendar, Eye, ChevronDown, Wand2, AlignLeft, Maximize2, Minimize2,
  AlertTriangle, Trash
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Entry, EMOTIONS, FONTS, MediaItem, EntryLocation } from '../lib/constants';
import { uploadFile, deleteFileFromUrl } from '../services/storageService';
import { generateAutoTitle, suggestMood, summarizeEntry } from '../services/aiService';
import { MediaCapture } from './MediaCapture';
import { LocationSearch } from './LocationSearch';
import heic2any from 'heic2any';

interface EntryEditorProps {
  user: { uid: string; displayName: string; photoURL?: string; email: string };
  onSave: (data: Partial<Entry>, targetId?: string) => Promise<string | null>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
  entry?: Entry | null;
  isAdding: boolean;
  entries?: Entry[];
}

const DEFAULT_TAGS = [
  "travel",
  "family",
  "work",
  "friends",
  "health",
  "ideas",
  "personal"
];

export function EntryEditor({ user, onSave, onDelete, onClose, entry, isAdding, entries = [] }: EntryEditorProps) {
  // --- State ---
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isAdding ? 'create' : 'view');
  const [isEditing, setIsEditing] = useState(!isAdding && !!entry);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [manualDate, setManualDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [location, setLocation] = useState<EntryLocation | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [fontFamily, setFontFamily] = useState('sans');
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const memoryIdRef = useRef<string | null>(entry?.id || null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = (newText: string) => {
    setContent(newText);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  };
  
  const [pendingMedia, setPendingMedia] = useState<{ id: string; file: File; progress: number; previewUrl?: string; type: MediaItem['type'] }[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMoodLoading, setAiMoodLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<{ message: string; type: 'add' | 'edit' | 'delete' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [captureMode, setCaptureMode] = useState<'audio' | 'video' | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: MediaItem['type']; name?: string } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Theme Calculations ---
  const themeStyles = useMemo(() => {
    const color = (emotion as any).color || '#0066FF';
    const bg = (emotion as any).bg || '#FAF9F6';
    return {
      bgTint: bg,
      bgSoft: `${color}10`,
      accent: color,
      border: `${color}20`,
      shadow: `0 24px 60px -12px ${color}25`,
    };
  }, [emotion]);

  // Apply mood color globally
  useEffect(() => {
    document.documentElement.style.setProperty('--mood-color', themeStyles.accent);
  }, [themeStyles.accent]);

  // --- Effects ---
  // Handle ESC key for Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  const isSavingRef = useRef(false);
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const emotionRef = useRef(emotion);
  const mediaRef = useRef(media);
  const locationRef = useRef(location);
  const tagsRef = useRef(tags);
  const isFavoriteRef = useRef(isFavorite);
  const fontFamilyRef = useRef(fontFamily);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { emotionRef.current = emotion; }, [emotion]);
  useEffect(() => { mediaRef.current = media; }, [media]);
  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { tagsRef.current = tags; }, [tags]);
  useEffect(() => { isFavoriteRef.current = isFavorite; }, [isFavorite]);
  useEffect(() => { fontFamilyRef.current = fontFamily; }, [fontFamily]);

  const hasInitializedRef = useRef(false);

  // Reset or Load State based on Mode
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (isAdding) {
      setMode('create');
      setIsEditing(false);
      setContent('');
      setTitle('');
      setEmotion(EMOTIONS[0]);
      setMedia([]);
      setLocation(undefined);
      setIsFavorite(false);
      setTags([]);
      setFontFamily('sans');
      setManualDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      memoryIdRef.current = null;
    } else if (entry) {
      setMode('view');
      setIsEditing(true);
      setContent(entry.content || '');
      setTitle(entry.title || '');
      const emo = EMOTIONS.find(e => e.name === entry.emotion) || EMOTIONS[0];
      setEmotion(emo);
      setMedia(entry.media || []);
      setLocation(entry.location);
      setIsFavorite(entry.isFavorite || false);
      memoryIdRef.current = entry.id;
      
      // Defensive tag loading: ensure tags is always an array and normalized
      const rawTags = entry.tags as any;
      let entryTags: string[] = [];
      if (Array.isArray(rawTags)) {
        entryTags = rawTags.map(t => String(t).toLowerCase());
      } else if (typeof rawTags === 'string' && rawTags) {
        entryTags = [rawTags.toLowerCase()];
      }
      
      setTags(entryTags);
      setFontFamily(entry.fontFamily || 'sans');
      setManualDate(entry.manualDate ? format(new Date(entry.manualDate), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [entry, isAdding, user.uid]);

  // --- Handlers ---
  const handleSummarize = async () => {
    if (content.trim().length < 5) {
      setErrorMsg("Write at least a few words to summarize.");
      return;
    }
    setSummarizing(true);
    try {
      const summary = await summarizeEntry(content);
      if (summary) {
        setContent(prev => prev + "\n\n---\n**AI Insight:** " + summary);
      }
    } catch (err) {
      console.error("Summary error:", err);
      setErrorMsg("Failed to generate summary.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleAIAutoTitle = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const t = await generateAutoTitle(content);
      if (t) setTitle(t);
    } catch (err) {
      console.error("AI Title Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestMood = async () => {
    if (!content.trim()) {
      setEmotion(EMOTIONS.find(e => e.name === 'Thoughtful') || EMOTIONS[0]);
      return;
    }
    setAiMoodLoading(true);
    try {
      const m = await suggestMood(content);
      if (m) {
        const emo = EMOTIONS.find(e => e.name === m);
        if (emo) {
          setEmotion(emo);
          // Highlight that a change happened
          textareaRef.current?.focus();
        }
      }
    } catch (err) {
      console.error("AI Mood Error:", err);
      setErrorMsg("Failed to analyze mood.");
    } finally {
      setAiMoodLoading(false);
    }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    
    for (const file of fileList) {
      const id = Math.random().toString(36).substring(7);
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isPDF = file.type === 'application/pdf';
      const sizeLimit = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
      
      if (file.size > sizeLimit) {
        setErrorMsg(`File ${file.name} too large.`);
        continue;
      }

      let type: MediaItem['type'] = 'file';
      if (isImage) type = 'image';
      else if (isVideo) type = 'video';
      else if (isAudio) type = 'audio';
      
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      setPendingMedia(prev => [...prev, { id, file, progress: 0, previewUrl, type }]);

      (async () => {
        try {
          let fileToUpload: File | Blob = file;
          let finalFileName = file.name;

          if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            try {
              const converted = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
              });
              fileToUpload = (Array.isArray(converted) ? converted[0] : converted) as Blob;
              finalFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
            } catch (heicErr) {
              console.error("HEIC conversion failed:", heicErr);
            }
          }

          const { url, type: uploadedType } = await uploadFile(fileToUpload, user.uid, finalFileName, (p) => {
            setPendingMedia(prev => prev.map(m => m.id === id ? { ...m, progress: p } : m));
          });

          // Correct the mapping for general files
          let finalType = uploadedType as MediaItem['type'];
          if (finalType as string === 'application/pdf' || uploadedType.includes('pdf')) finalType = 'file';
          else if (uploadedType.includes('image')) finalType = 'image';
          else if (uploadedType.includes('video')) finalType = 'video';
          else if (uploadedType.includes('audio')) finalType = 'audio';
          else finalType = 'file';

          setMedia(prev => [...prev, { url, type: finalType, name: finalFileName }]);
          setPendingMedia(prev => prev.filter(m => m.id !== id));

          if (previewUrl) URL.revokeObjectURL(previewUrl);
        } catch (err: any) {
          console.error("Upload error:", err);
          setErrorMsg(`Failed to upload ${file.name}`);
          setPendingMedia(prev => prev.filter(m => m.id !== id));
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }
      })();
    }
    e.target.value = '';
  };

  const removePendingMedia = (id: string, previewUrl?: string) => {
    setPendingMedia(prev => prev.filter(m => m.id !== id));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  const handleCapture = async (blob: Blob) => {
    const id = Math.random().toString(36).substring(7);
    const type = captureMode === 'video' ? 'video' : 'audio';
    const extension = type === 'video' ? 'webm' : 'webm';
    const fileName = `recorded_${Date.now()}.${extension}`;
    
    setCaptureMode(null);
    const file = new File([blob], fileName, { type: blob.type });
    setPendingMedia(prev => [...prev, { id, file, progress: 0, type: type as any }]);

    try {
      const { url, type: uploadedType } = await uploadFile(blob, user.uid, fileName, (p) => {
        setPendingMedia(prev => prev.map(m => m.id === id ? { ...m, progress: p } : m));
      });
      setMedia(prev => [...prev, { url, type: uploadedType as any, name: fileName }]);
      setPendingMedia(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error("Capture upload error:", err);
      const errorMsg = err.code === 'storage/retry-limit-exceeded'
        ? "Recording timeout."
        : "Failed to upload recording.";
      setErrorMsg(errorMsg);
      setPendingMedia(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDelete = async () => {
    if (!entry || !onDelete) return;
    setIsDeleting(true);
    try {
      // Also delete files from storage
      if (entry.media && entry.media.length > 0) {
        await Promise.all(entry.media.map(m => {
          if (m.type !== 'link') return deleteFileFromUrl(m.url);
          return Promise.resolve();
        }));
      }
      await onDelete(entry.id);
      
      setShowDeleteConfirm(false);
      setSuccessModal({ message: "Memory Deleted", type: 'delete' });
      
      setTimeout(() => {
        setSuccessModal(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Failed to delete memory.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (pendingMedia.length > 0) {
      setErrorMsg("Please wait for all media to finish uploading before saving your memory.");
      return;
    }
    if (!content || content.trim() === "") {
      setErrorMsg("A memory requires some words to be preserved. Please write something.");
      return;
    }
    
    setIsSaving(true);
    setErrorMsg(null);
    try {
      // Final merge of tags
      const inputTags = tagInput
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(t => t !== "" && !tags.includes(t));
      
      const finalTags = [...new Set([...tags, ...inputTags])];
      
      const entryDate = manualDate ? new Date(manualDate) : new Date();
      const finalManualDate = isNaN(entryDate.getTime()) ? new Date().toISOString() : entryDate.toISOString();

      const data: any = {
        content,
        title: title || (content.slice(0, 40) + (content.length > 40 ? '...' : '')),
        emotion: emotion.name,
        emoji: emotion.emoji,
        manualDate: finalManualDate,
        media: media.map(m => ({ url: m.url, type: m.type, name: m.name })),
        isFavorite,
        tags: finalTags,
        fontFamily
      };

      if (location) {
        data.location = {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          name: location.name
        };
      }
      
      console.log("Saving memory:", data);
      const id = await onSave(data, memoryIdRef.current || undefined);
      console.log("Saved ID:", id);
      
      setSuccessModal({ 
        message: isAdding ? "Memory saved to eternity ✨" : "Memory updated successfully", 
        type: isAdding ? 'add' : 'edit' 
      });
      
      setTimeout(() => {
        setSuccessModal(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Save failure:", err);
      setErrorMsg("Failed to save memory. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLink = () => {
    const url = prompt("Enter the URL to archive:");
    if (url) {
      let cleanUrl = url;
      if (!url.startsWith('http')) cleanUrl = 'https://' + url;
      setMedia(prev => [...prev, { url: cleanUrl, type: 'link', name: cleanUrl.replace(/^https?:\/\//, '').split('/')[0] }]);
    }
  };

  const currentFont = FONTS.find(f => f.id === fontFamily) || FONTS[0];

  const allAvailableTags = useMemo(() => {
    const unique = new Set<string>();
    entries.forEach(e => {
      (e.tags || []).forEach(t => unique.add(t));
    });
    return Array.from(unique).sort();
  }, [entries]);

  const suggestedTags = useMemo(() => {
    if (!tagInput.trim()) return [];
    const search = tagInput.toLowerCase().replace(/^#/, '');
    return allAvailableTags.filter(t => 
      t.toLowerCase().includes(search) && !tags.includes(t)
    ).slice(0, 5);
  }, [tagInput, allAvailableTags, tags]);

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const toggleTag = (tag: string) => {
    const clean = tag.toLowerCase();
    if (tags.includes(clean)) {
      setTags(tags.filter(t => t !== clean));
    } else {
      setTags([...tags, clean]);
    }
  };

  const handleDiscard = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg)] overflow-hidden font-sans">
      {/* Background Atmosphere Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden transition-all duration-1000">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1.1, 1],
            opacity: [0.05, 0.1, 0.08, 0.05]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 blur-[120px]"
          style={{ backgroundColor: emotion.color }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.03] pointer-events-none" />
      </div>

      {/* 1. Top Bar */}
      <AnimatePresence>
        {!isFocusMode && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="flex items-center justify-between px-6 md:px-12 py-5 sticky top-0 z-[110] bg-[var(--bg)]/40 backdrop-blur-xl border-b border-[var(--border)]"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={handleDiscard} 
                className="group flex items-center gap-2 text-text-secondary hover:text-black transition-all"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-black/5 transition-all">
                  <X className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Discard</span>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: themeStyles.accent }}>
                  {format(new Date(manualDate), 'MMMM d, yyyy')}
                </span>
              </div>
              <span className="text-[8px] font-medium uppercase tracking-widest text-text-secondary opacity-30 mt-1">
                Written by {user.displayName || 'You'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  "w-10 h-10 rounded-full transition-all flex items-center justify-center",
                  isFavorite ? "text-yellow-500 bg-yellow-50" : "text-text-secondary hover:bg-black/5"
                )}
              >
                <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
              </button>

              {mode === 'view' ? (
                <button 
                  onClick={() => setMode('edit')}
                  className="px-6 h-10 bg-black text-white rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                  <Type className="w-3.5 h-3.5" />
                  Edit Entry
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  disabled={(!content.trim() && media.length === 0) || isSaving}
                  className="px-6 h-10 text-white rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                  style={{ backgroundColor: themeStyles.accent, boxShadow: themeStyles.shadow }}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Preserve'}
                </button>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className={cn(
          "max-w-[860px] mx-auto px-6 py-6 transition-all duration-1000 ease-in-out",
          isFocusMode ? "py-32" : "pb-48"
        )}>
          
          {/* 1. Date & Location (Top) */}
          {!isFocusMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--surface)] shadow-sm border border-[var(--border)] p-5 rounded-3xl flex items-center gap-4 group hover:border-[var(--accent)]/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[var(--subtext)]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5 opacity-30" />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Date & Time</span>
                  <input 
                    type="datetime-local"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    readOnly={mode === 'view'}
                    className="bg-transparent border-none p-0 text-xs font-bold uppercase tracking-widest focus:ring-0 cursor-pointer w-full text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="bg-[var(--surface)] shadow-sm border border-[var(--border)] p-5 rounded-3xl flex items-center gap-4 group hover:border-[var(--accent)]/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[var(--subtext)]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 opacity-30" />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Location</span>
                  {location ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest truncate text-[var(--text)]">{location.name}</span>
                        {mode !== 'view' && (
                          <button onClick={() => setLocation(undefined)} className="p-1 hover:bg-black/5 rounded-full transition-colors ml-2">
                            <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          </button>
                        )}
                      </div>
                      
                      {/* Map Preview */}
                      <div className="h-32 w-full rounded-2xl overflow-hidden border border-[var(--border)] relative group/map">
                        <img 
                          src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${location.lng},${location.lat}&z=14&l=map&size=450,250&pt=${location.lng},${location.lat},pm2rdl`}
                          alt="Location Map"
                          className="w-full h-full object-cover grayscale opacity-60 group-hover/map:grayscale-0 group-hover/map:opacity-100 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`, '_blank')}
                          className="absolute bottom-2 right-2 p-2 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-black/5 opacity-0 group-hover/map:opacity-100 transition-all scale-90 group-hover/map:scale-100"
                          title="View on Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-black" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowLocationSearch(true)}
                      disabled={mode === 'view'}
                      className="text-left text-xs font-bold uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity text-[var(--subtext)]"
                    >
                      Add location...
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Mood Section (Resonance) */}
          {!isFocusMode && mode !== 'view' && (
            <div className="bg-[var(--surface)] shadow-sm border border-[var(--border)] p-4 rounded-3xl mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20 text-[var(--subtext)]">Resonance</span>
                  <span className="text-[10px] font-bold opacity-60 text-[var(--subtext)]">
                    Currently: <span style={{ color: themeStyles.accent }}>{emotion.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {emotion.name !== 'Thoughtful' && (
                    <button 
                      onClick={() => setEmotion(EMOTIONS.find(e => e.name === 'Thoughtful') || EMOTIONS[0])}
                      className="text-[9px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity flex items-center gap-1 text-[var(--subtext)]"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Clear
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleAISuggestMood}
                  disabled={aiMoodLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--subtext)]/5 hover:bg-[var(--surface)] transition-all group border border-transparent hover:border-[var(--border)]"
                >
                  <Wand2 className={cn("w-3.5 h-3.5", aiMoodLoading && "animate-spin")} style={{ color: themeStyles.accent }} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-[var(--subtext)]">AI ✨ Suggest</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {EMOTIONS.slice(0, 10).map((em) => {
                  const isActive = emotion.name === em.name;
                  return (
                    <button
                      key={em.name}
                      onClick={() => setEmotion(em)}
                      onDoubleClick={() => setEmotion(EMOTIONS.find(e => e.name === 'Thoughtful') || EMOTIONS[0])}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-[12px] whitespace-nowrap transition-all border group relative",
                        isActive 
                          ? "shadow-lg scale-105 z-10 text-white border-transparent" 
                          : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--subtext)]/5 hover:-translate-y-0.5 active:scale-95"
                      )}
                      style={isActive ? { 
                        backgroundColor: (em as any).color,
                        boxShadow: `0 8px 20px -6px ${(em as any).color}90`
                      } : {}}
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">{em.emoji}</span>
                      <span className={cn(
                        "text-[12px] font-bold uppercase tracking-tight",
                        isActive ? "text-white" : "text-[var(--text)] opacity-60"
                      )}>
                        {em.name}
                      </span>
                    </button>
                  );
                })}
                <button 
                  onClick={() => setShowEmotionPicker(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-[12px] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--subtext)]/5 transition-all shadow-sm hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4 opacity-40 text-[var(--subtext)]" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Main Writing Area (The Entry) */}
          <div className={cn(
            "transition-all duration-700",
            !isFocusMode && "bg-[var(--surface)] shadow-xl border border-[var(--border)] rounded-[32px] overflow-hidden mb-6"
          )}>
            <div className={cn("p-8 md:p-10", isFocusMode && "p-0")}>
              {!isFocusMode && (
                <div className="mb-8 flex items-center gap-4">
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    readOnly={mode === 'view'}
                    placeholder="Title the vibration..."
                    className="flex-1 bg-transparent border-none p-0 text-2xl md:text-3xl font-serif font-black tracking-tight focus:ring-0 placeholder:text-black/[0.08] text-[var(--text)]"
                  />
                  {mode !== 'view' && (
                      <button 
                        onClick={handleAIAutoTitle}
                        disabled={aiLoading || !content.trim()}
                        className="p-2.5 rounded-xl hover:bg-black/5 transition-colors group"
                        title="AI Auto-Title"
                      >
                        <Sparkles className={cn("w-4 h-4", aiLoading ? "animate-pulse" : "opacity-30 group-hover:opacity-100")} style={!aiLoading ? { color: themeStyles.accent } : {}} />
                      </button>
                    )}
                  </div>
                )}
  
                <textarea 
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  autoFocus={isAdding}
                  readOnly={mode === 'view'}
                  placeholder="The world is quiet, tell me your story..."
                  className={cn(
                    "w-full min-h-[360px] bg-transparent border-none p-0 text-base md:text-lg leading-relaxed focus:ring-0 placeholder:opacity-20 resize-none transition-all duration-700 text-[var(--text)]",
                    currentFont.class,
                    isFocusMode && "text-center md:text-4xl leading-[2] py-20 px-10 md:px-20",
                  )}
                />
              </div>
              
              {!isFocusMode && (
                <div className="px-10 py-3.5 bg-black/[0.01] border-t border-[var(--border)] flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] opacity-30 text-[var(--subtext)]">
                  <span>Encrypted Memory Box</span>
                  <span>{content.trim().split(/\s+/).filter(Boolean).length} Words Preserved</span>
                </div>
              )}
          </div>

          {/* 4. Archive Tags */}
          {!isFocusMode && (
            <div className="bg-[var(--surface)] shadow-sm border border-[var(--border)] p-6 rounded-[32px] mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-4 h-4 opacity-20 text-[var(--subtext)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--subtext)]">Archival Tags</span>
              </div>
              
              <div className="space-y-6">
                {mode !== 'view' && (
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TAGS.map(t => {
                      const isSelected = tags.includes(t.toLowerCase());
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTag(t)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            isSelected 
                              ? "text-white shadow-sm" 
                              : "bg-[var(--subtext)]/5 text-[var(--subtext)] border-[var(--border)] hover:bg-[var(--surface)]"
                          )}
                          style={isSelected ? { backgroundColor: themeStyles.accent, borderColor: themeStyles.accent } : {}}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span 
                      key={t}
                      className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group transition-all text-[var(--text)]"
                    >
                      <span className="opacity-20">#</span>
                      {t}
                      {mode !== 'view' && (
                        <button onClick={() => setTags(tags.filter(tag => tag !== t))} className="w-4 h-4 rounded-full hover:bg-black/5 flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {mode !== 'view' && (
                    <div className="relative">
                      <input 
                        type="text" 
                        value={tagInput}
                        onFocus={() => setShowTagSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag(tagInput)}
                        placeholder="+ Add Tag"
                        className="bg-[var(--subtext)]/5 border border-dashed border-[var(--border)] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-0 focus:border-[var(--accent)] transition-all w-32 placeholder:opacity-20 text-[var(--text)]"
                      />
                      <AnimatePresence>
                        {showTagSuggestions && suggestedTags.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute bottom-full left-0 mb-3 w-48 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden z-[150] p-1.5"
                          >
                            {suggestedTags.map(tag => (
                              <button 
                                key={tag}
                                onClick={() => addTag(tag)}
                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-[var(--text)] hover:bg-[var(--subtext)]/5 rounded-xl transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Media Grid (Visible but smaller) */}
          {!isFocusMode && (media.length > 0 || pendingMedia.length > 0) && (
            <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {media.map((item, idx) => (
                <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group border border-black/5 shadow-sm bg-white">
                  {item.type === 'image' && item.url && <img src={item.url} className="w-full h-full object-cover" />}
                  {item.type === 'video' && item.url && <video src={item.url} className="w-full h-full object-cover" muted />}
                  {item.type === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <Mic className="w-6 h-6 opacity-20" style={{ color: themeStyles.accent }} />
                    </div>
                  )}
                  {(item.type === 'link' || item.type === 'file') && (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/[0.02] transition-colors"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <div className="text-2xl mb-1">{item.type === 'link' ? "🔗" : getFileIcon(item.name)}</div>
                      <span className="text-[9px] font-bold uppercase tracking-tight opacity-40 line-clamp-1">{item.name || 'Memory Asset'}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setFullscreenMedia(item)} className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4" />
                    </button>
                    {mode !== 'view' && (
                      <button onClick={() => setMedia(prev => prev.filter((_, i) => i !== idx))} className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {pendingMedia.map((item) => (
                <div key={item.id} className="relative aspect-video rounded-2xl overflow-hidden bg-black/[0.03] border border-dashed border-black/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin opacity-20" style={{ color: themeStyles.accent }} />
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* 6. Bottom Toolbar */}
      <AnimatePresence>
        {!isFocusMode && mode !== 'view' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] w-[820px] max-w-[95vw]"
          >
            <div className="bg-white/95 backdrop-blur-2xl border border-black/10 p-2 rounded-[32px] shadow-2xl flex items-center justify-between overflow-x-auto no-scrollbar">
              
              {/* Multimedia Group */}
              <div className="flex items-center gap-1 p-1 bg-black/[0.02] rounded-2xl shrink-0">
                <ToolbarButton icon={ImageIcon} label="Media" onClick={() => fileInputRef.current?.click()} themeColor={themeStyles.accent} />
                <ToolbarButton icon={Video} label="Video" onClick={() => setCaptureMode('video')} themeColor={themeStyles.accent} />
                <ToolbarButton icon={Mic} label="Voice" onClick={() => setCaptureMode('audio')} themeColor={themeStyles.accent} />
                <ToolbarButton icon={Paperclip} label="File" onClick={() => fileInputRef.current?.click()} themeColor={themeStyles.accent} />
                <ToolbarButton icon={ExternalLink} label="Link" onClick={() => setShowLinkModal(true)} themeColor={themeStyles.accent} />
              </div>

              <div className="w-px h-6 bg-black/10 mx-1 shrink-0" />

              {/* Tools Group */}
              <div className="flex items-center gap-1 p-1 bg-black/[0.02] rounded-2xl shrink-0">
                <ToolbarButton icon={Type} label="Typography" onClick={() => setShowFontPicker(true)} themeColor={themeStyles.accent} />
                <ToolbarButton 
                  icon={Sparkles} 
                  label="Summarize" 
                  onClick={handleSummarize} 
                  isLoading={summarizing} 
                  themeColor={themeStyles.accent}
                />
              </div>

              <div className="w-px h-6 bg-black/10 mx-1 shrink-0" />

              {/* Focus Group */}
              <div className="flex items-center gap-1 shrink-0 px-2">
                <ToolbarButton 
                  icon={Maximize2} 
                  label="Focus Mode" 
                  variant="accent"
                  onClick={() => setIsFocusMode(true)} 
                  themeColor={themeStyles.accent}
                />
                
                {mode === 'edit' && entry && (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-10 px-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Sanctuary Control */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]"
          >
            <button 
              onClick={() => setIsFocusMode(false)}
              className="px-10 py-5 bg-black hover:bg-zinc-800 text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 shadow-2xl ring-4 ring-white/10"
            >
              <Minimize2 className="w-5 h-5" />
              Exit Focus Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Media Viewer */}
      <AnimatePresence>
        {fullscreenMedia && (
          <div 
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-12"
            onClick={() => setFullscreenMedia(null)}
          >
            <button 
              onClick={() => setFullscreenMedia(null)}
              className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              <X className="w-8 h-8" />
            </button>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl max-h-full flex items-center justify-center overflow-hidden rounded-3xl"
              onClick={e => e.stopPropagation()}
            >
              {fullscreenMedia.type === 'image' && fullscreenMedia.url && (
                <img src={fullscreenMedia.url} className="max-w-full max-h-full object-contain" />
              )}
              {fullscreenMedia.type === 'video' && fullscreenMedia.url && (
                <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-full" />
              )}
              {fullscreenMedia.type === 'audio' && fullscreenMedia.url && (
                <div className="bg-white/10 p-12 rounded-[60px] w-full max-w-xl flex flex-col items-center gap-8">
                  <Mic className="w-20 h-20 text-white/20" />
                  <audio src={fullscreenMedia.url} controls className="w-full" />
                </div>
              )}
              {(fullscreenMedia.type === 'link' || fullscreenMedia.type === 'file') && (
                <div className="bg-white/10 p-12 rounded-[60px] w-full max-w-xl flex flex-col items-center gap-8 text-center">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                    {fullscreenMedia.type === 'link' ? <ExternalLink className="w-10 h-10 text-white" /> : <Paperclip className="w-10 h-10 text-white" />}
                  </div>
                  <h3 className="text-2xl font-serif text-white truncate max-w-full">{fullscreenMedia.name || 'External Memory'}</h3>
                  <button 
                    onClick={() => window.open(fullscreenMedia.url, '_blank')}
                    className="px-10 py-5 bg-white text-black rounded-full font-black text-[12px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Resources
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Capture & Search Overlays */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6" onClick={() => setShowLinkModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl border border-white"
            >
              <div className="flex flex-col items-center gap-6 mb-8 text-center">
                <div className="w-16 h-16 bg-black/[0.03] rounded-3xl flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 opacity-40" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-black tracking-tight mb-2">Add External Resource</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-40">Paste a URL to link it with this memory.</p>
                </div>
              </div>
              <input 
                type="url"
                autoFocus
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-black/[0.03] border-none p-5 rounded-2xl text-sm font-bold tracking-tight focus:ring-0 mb-6"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (linkInput) {
                      let cleanUrl = linkInput;
                      if (!linkInput.startsWith('http')) cleanUrl = 'https://' + linkInput;
                      setMedia(prev => [...prev, { url: cleanUrl, type: 'link', name: cleanUrl.replace(/^https?:\/\//, '').split('/')[0] }]);
                      setLinkInput('');
                      setShowLinkModal(false);
                    }
                  }}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  Archive Link
                </button>
                <button 
                  onClick={() => setShowLinkModal(false)}
                  className="px-8 py-4 bg-black/[0.03] text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEmotionPicker && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/10 backdrop-blur-2xl" onClick={() => setShowEmotionPicker(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              onClick={e => e.stopPropagation()}
              className="bg-white/95 border border-white/40 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.1)] rounded-[52px] p-8 md:p-14 max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar relative"
            >
              <button 
                onClick={() => setShowEmotionPicker(false)}
                className="absolute top-10 right-10 p-2.5 hover:bg-black/5 rounded-full transition-all text-text-secondary opacity-30 hover:opacity-100"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center mb-12 text-center">
                <h3 className="text-3xl font-serif font-black tracking-tight mb-3">Choose Resonance</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: themeStyles.accent }}>Define the Atmosphere of your memory</p>
              </div>

              <div className="space-y-14">
                {[
                  { title: "High Vibrations", items: EMOTIONS.filter(e => ['Joyful', 'Grateful', 'Inspired', 'Excited', 'Lovesick', 'Brave', 'Wanderlust'].includes(e.name)) },
                  { title: "Inner Balance", items: EMOTIONS.filter(e => ['Peaceful', 'Thoughtful', 'Productive', 'Nostalgic'].includes(e.name)) },
                  { title: "Deep Reflection", items: EMOTIONS.filter(e => ['Melancholy', 'Sad', 'Anxious', 'Angry', 'Tired'].includes(e.name)) }
                ].map((group) => (
                  <div key={group.title} className="space-y-7">
                    <div className="flex items-center gap-5">
                      <div className="h-px flex-1 bg-black/[0.04]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-text-secondary opacity-30">{group.title}</span>
                      <div className="h-px flex-1 bg-black/[0.04]" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {group.items.map(em => (
                        <button 
                          key={em.name}
                          onClick={() => { setEmotion(em); setShowEmotionPicker(false); }}
                          className={cn(
                            "group p-7 rounded-[36px] transition-all flex flex-col items-center gap-4 border-2 relative overflow-hidden",
                            emotion.name === em.name 
                              ? "bg-white shadow-2xl scale-105 z-10" 
                              : "bg-white/60 border-transparent hover:bg-white hover:scale-[1.05] hover:shadow-xl"
                          )}
                          style={emotion.name === em.name ? { borderColor: themeStyles.accent, boxShadow: themeStyles.shadow } : {}}
                        >
                          <div className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]" style={{ backgroundColor: em.color }} />
                          <span className="text-4xl transition-transform group-hover:scale-110 duration-500 relative z-10 drop-shadow-sm">{em.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center truncate w-full relative z-10 opacity-60 group-hover:opacity-100">{em.name}</span>
                          
                          {emotion.name === em.name && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-4 right-4 w-5 h-5 text-white rounded-full flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: themeStyles.accent }}
                            >
                              <Check className="w-3 h-3 stroke-[4]" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showFontPicker && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/10 backdrop-blur-2xl" onClick={() => setShowFontPicker(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              onClick={e => e.stopPropagation()}
              className="bg-white/95 border border-white/40 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.1)] rounded-[52px] p-8 md:p-14 max-w-3xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar relative"
            >
              <button 
                onClick={() => setShowFontPicker(false)}
                className="absolute top-10 right-10 p-2.5 hover:bg-black/5 rounded-full transition-all text-text-secondary opacity-30 hover:opacity-100"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center mb-12 text-center">
                <h3 className="text-3xl font-serif font-black tracking-tight mb-3">Select Archetype</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: themeStyles.accent }}>Choose your narrative voice</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {FONTS.map(font => (
                    <button 
                      key={font.id}
                      onClick={() => { setFontFamily(font.id); setShowFontPicker(false); }}
                      className={cn(
                        "p-8 rounded-[36px] transition-all flex flex-col items-center gap-5 border-2 relative group",
                        fontFamily === font.id 
                          ? "bg-white shadow-2xl scale-105 z-10" 
                          : "bg-white/60 border-transparent hover:bg-white hover:scale-[1.05] hover:shadow-xl"
                      )}
                      style={fontFamily === font.id ? { borderColor: themeStyles.accent, boxShadow: themeStyles.shadow } : {}}
                    >
                    <div className="w-14 h-14 rounded-[20px] bg-black/[0.03] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                      {font.icon}
                    </div>
                    
                    <div className="flex flex-col items-center gap-3">
                      <span className={cn("text-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-500", font.class)}>Aa Bb</span>
                      <span className={cn("text-[11px] font-black uppercase tracking-[0.25em] text-text-primary", font.class)}>{font.name}</span>
                    </div>
                    
                      {fontFamily === font.id && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-5 right-5 w-6 h-6 text-white rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: themeStyles.accent }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[4]" />
                        </motion.div>
                      )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {captureMode && (
          <MediaCapture 
            type={captureMode} 
            onCapture={handleCapture} 
            onCancel={() => setCaptureMode(null)} 
          />
        )}

        {showLocationSearch && (
          <LocationSearch 
            onSelect={(loc) => { setLocation(loc); setShowLocationSearch(false); }} 
            onCancel={() => setShowLocationSearch(false)} 
          />
        )}

        {errorMsg && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-4 rounded-3xl shadow-2xl z-[200] font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
          >
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {successModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/20 backdrop-blur-3xl"
            onClick={() => setSuccessModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/80 backdrop-blur-2xl border-2 border-white shadow-[0_64px_128px_-32px_rgba(0,0,0,0.15)] rounded-[60px] p-16 max-w-sm w-full flex flex-col items-center gap-10 relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={cn(
                    "w-28 h-28 rounded-[40px] flex items-center justify-center shadow-2xl",
                    successModal.type === 'delete' ? "bg-red-500 text-white shadow-red-500/20" : "text-white"
                  )}
                  style={successModal.type !== 'delete' ? { backgroundColor: themeStyles.accent, boxShadow: themeStyles.shadow } : {}}
                >
                  {successModal.type === 'delete' ? <Trash2 className="w-12 h-12" /> : <Check className="w-12 h-12 stroke-[3]" />}
                </motion.div>
                
                {successModal.type !== 'delete' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [1, 1.4, 1.2] }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-6 h-6" style={{ color: themeStyles.accent }} />
                  </motion.div>
                )}
              </div>

              <div className="text-center space-y-3">
                <h2 className="text-3xl font-serif font-black tracking-tight text-text-primary">
                  {successModal.message}
                </h2>
                <div className="flex flex-col items-center gap-1.5">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.3em] opacity-60",
                    successModal.type === 'delete' ? "text-red-500" : ""
                  )}
                  style={successModal.type !== 'delete' ? { color: themeStyles.accent } : {}}
                  >
                    {successModal.type === 'delete' ? "Memory Erased" : "Archive Secured"}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] opacity-20">Synced to Eternity</p>
                </div>
              </div>

              <button 
                onClick={() => setSuccessModal(null)}
                className="px-8 py-3 bg-black/5 hover:bg-black/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-text-secondary transition-all"
              >
                Close Now
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Deletion Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white border-2 border-white shadow-2xl rounded-[60px] p-12 max-w-sm w-full space-y-10"
            >
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center shadow-xl shadow-red-500/10">
                  <AlertTriangle className="w-12 h-12" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif font-black tracking-tight mb-2">Delete Memory?</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-40">This vibration will be erased from eternity forever.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash className="w-5 h-5" />}
                  Confirm Erase
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-4 bg-black/[0.03] text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black/5 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        accept="*" 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}

function ActionTab({ icon: Icon, label, onClick, active, disabled, themeColor }: { icon: React.ElementType, label: string, onClick: () => void, active?: boolean, disabled?: boolean, themeColor?: string }) {
  return (
    <button 
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 px-4 py-3 rounded-[28px] transition-all group",
        !disabled && "hover:bg-black/[0.03]",
        active ? "" : "text-text-secondary",
        disabled && "opacity-20 cursor-default"
      )}
      style={active && themeColor ? { color: themeColor, backgroundColor: `${themeColor}05` } : {}}
    >
      <div className={cn(
        "w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300",
        !disabled && "group-hover:scale-110",
        active ? "text-white shadow-lg" : "bg-black/[0.03]",
        !disabled && !active && "group-hover:bg-black/[0.05]"
      )}
      style={active && themeColor ? { backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}40` } : {}}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className={cn(
        "text-[7px] font-black uppercase tracking-[0.2em]",
        active ? "opacity-100" : (disabled ? "opacity-30" : "opacity-30 group-hover:opacity-60")
      )}>{label}</span>
    </button>
  );
}

function EntryCard({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-xl border border-black/5 p-8 rounded-[40px] mb-8 last:mb-0 relative overflow-hidden group"
    >
      {(title || subtitle) && (
        <div className="flex flex-col mb-8">
          {title && <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">{title}</span>}
          {subtitle && <span className="text-[8px] font-medium uppercase tracking-widest opacity-20 mt-1">{subtitle}</span>}
        </div>
      )}
      {children}
    </motion.div>
  );
}

function MultimediaButton({ icon: Icon, label, onClick, themeColor }: { icon: any, label: string, onClick: () => void, themeColor?: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-black/[0.02] border border-black/[0.05] hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all group"
    >
      <div className="w-10 h-10 rounded-2xl bg-black/[0.03] flex items-center justify-center transition-all group-hover:scale-110">
        <Icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: themeColor }} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100">{label}</span>
    </button>
  );
}

function ToolbarButton({ icon: Icon, label, onClick, isLoading, variant = 'ghost', themeColor }: { icon: any, label: string, onClick: () => void, isLoading?: boolean, variant?: 'ghost' | 'accent', themeColor?: string }) {
  return (
    <button 
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all group pointer-events-auto",
        variant === 'accent' ? "" : "hover:bg-black/5"
      )}
      style={variant === 'accent' && themeColor ? { backgroundColor: `${themeColor}10` } : {}}
    >
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
        variant === 'accent' ? "" : "bg-black/[0.03] text-text-secondary group-hover:scale-110",
        isLoading && "animate-pulse"
      )}
      style={variant === 'accent' && themeColor ? { backgroundColor: `${themeColor}20`, color: themeColor } : {}}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity",
        variant === 'accent' && "opacity-60"
      )}
      style={variant === 'accent' && themeColor ? { color: themeColor } : {}}
      >{label}</span>
    </button>
  );
}
