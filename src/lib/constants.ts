export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'link' | 'file';
  name?: string;
}

export interface EntryLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface Entry {
  id: string;
  title?: string;
  content: string;
  emotion?: string;
  emoji?: string;
  media?: MediaItem[];
  location?: EntryLocation;
  userId: string;
  isFavorite?: boolean;
  tags?: string[];
  manualDate?: string;
  fontFamily?: string;
  createdAt: any;
  updatedAt: any;
}

export const FONTS = [
  { id: 'sans', name: 'Standard', class: 'font-sans', icon: '🧊' },
  { id: 'serif', name: 'Classic', class: 'font-serif', icon: '📜' },
  { id: 'mono', name: 'Technical', class: 'font-technical', icon: '💻' },
  { id: 'writing', name: 'Poetic', class: 'font-writing', icon: '✒️' },
  { id: 'royal', name: 'Formal', class: 'font-royal', icon: '👑' },
  { id: 'typewriter', name: 'Draft', class: 'font-typewriter', icon: '⌨️' },
  { id: 'modern', name: 'Modern', class: 'font-modern', icon: '🏔️' },
  { id: 'elegant', name: 'Elegant', class: 'font-elegant', icon: '🎻' },
  { id: 'playful', name: 'Playful', class: 'font-playful', icon: '🎈' },
  { id: 'bold', name: 'Headline', class: 'font-bold', icon: '📢' },
  { id: 'clean-mono', name: 'Clean Mono', class: 'font-clean-mono', icon: '📝' },
  { id: 'handwritten', name: 'Note', class: 'font-handwritten', icon: '✍️' }
];

export const EMOTIONS = [
  { name: 'Joyful', emoji: '😊', color: '#22c55e', bg: '#f0fdf4' },
  { name: 'Grateful', emoji: '🙏', color: '#10b981', bg: '#ecfdf5' },
  { name: 'Inspired', emoji: '✨', color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Excited', emoji: '🤩', color: '#f59e0b', bg: '#fffbeb' },
  { name: 'Peaceful', emoji: '🌿', color: '#10b981', bg: '#f0fdf4' },
  { name: 'Thoughtful', emoji: '🤔', color: '#6366f1', bg: '#eef2ff' },
  { name: 'Melancholy', emoji: '☁️', color: '#64748b', bg: '#f8fafc' },
  { name: 'Sad', emoji: '😢', color: '#3b82f6', bg: '#eff6ff' },
  { name: 'Anxious', emoji: '😟', color: '#f97316', bg: '#fff7ed' },
  { name: 'Angry', emoji: '😠', color: '#ef4444', bg: '#fef2f2' },
  { name: 'Lovesick', emoji: '💖', color: '#ec4899', bg: '#fdf2f8' },
  { name: 'Nostalgic', emoji: '📻', color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Productive', emoji: '⚡', color: '#f59e0b', bg: '#fffbeb' },
  { name: 'Tired', emoji: '😴', color: '#94a3b8', bg: '#f1f5f9' },
  { name: 'Brave', emoji: '🦁', color: '#f97316', bg: '#fff7ed' },
  { name: 'Wanderlust', emoji: '✈️', color: '#0ea5e9', bg: '#f0f9ff' }
];

export const COLORS = ['#D48C6A', '#5A5A40', '#A69D8F', '#CDC6BD', '#E8E2D9', '#2C2C28'];

export const THEMES = {
  default: {
    name: 'TimeCapsule',
    emoji: '🕒',
    bg: "#f3f4f6",
    surface: "#ffffff",
    text: "#111827",
    subtext: "#4b5563",
    accent: "#000000",
    border: "#d1d5db"
  },
  classic: {
    name: 'Modernist',
    emoji: '🏢',
    bg: "#f8f6f2",
    surface: "#ffffff",
    text: "#1f2937",
    subtext: "#6b7280",
    accent: "#4f46e5",
    border: "#e5e7eb"
  },
  paper: {
    name: 'Archive',
    emoji: '🗞️',
    bg: "#fdfaf6",
    surface: "#ffffff",
    text: "#3e3e3e",
    subtext: "#8b8b8b",
    accent: "#a47551",
    border: "#e5e1da"
  },
  dawn: {
    name: 'Morning',
    emoji: '🌅',
    bg: "#fff1e6",
    surface: "#ffffff",
    text: "#5b2c2c",
    subtext: "#a16207",
    accent: "#ff7a59",
    border: "#fde2d0"
  },
  ocean: {
    name: 'Deep Sea',
    emoji: '🌊',
    bg: "#e0f7fa",
    surface: "#ffffff",
    text: "#0f172a",
    subtext: "#0284c7",
    accent: "#06b6d4",
    border: "#b2ebf2"
  },
  forest: {
    name: 'Ancient Redwoods',
    emoji: '🌲',
    bg: "#e8f5e9",
    surface: "#ffffff",
    text: "#1b4332",
    subtext: "#40916c",
    accent: "#2d6a4f",
    border: "#c8e6c9"
  },
  lavender: {
    name: 'Aura',
    emoji: '🔮',
    bg: "#f3e8ff",
    surface: "#ffffff",
    text: "#4c1d95",
    subtext: "#7c3aed",
    accent: "#a78bfa",
    border: "#e9d5ff"
  },
  cyber: {
    name: 'Terminal',
    emoji: '📟',
    bg: "#0f172a",
    surface: "#111827",
    text: "#22c55e",
    subtext: "#4ade80",
    accent: "#22c55e",
    border: "#1f2937"
  },
  sand: {
    name: 'Desert',
    emoji: '🏜️',
    bg: "#f4e9dc",
    surface: "#ffffff",
    text: "#5a4634",
    subtext: "#a68a64",
    accent: "#c2a878",
    border: "#e3d5c1"
  }
};
