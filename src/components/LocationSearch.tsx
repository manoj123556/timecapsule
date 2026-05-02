import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Navigation, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { EntryLocation } from '../lib/constants';

interface LocationSearchProps {
  onSelect: (location: EntryLocation) => void;
  onCancel: () => void;
}

export function LocationSearch({ onSelect, onCancel }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const searchLocations = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const cacheKey = q.toLowerCase().trim();
    const cached = sessionStorage.getItem(`loc_cache_${cacheKey}`);
    if (cached) {
      setResults(JSON.parse(cached));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1`);
      const data = await response.json();
      setResults(data);
      sessionStorage.setItem(`loc_cache_${cacheKey}`, JSON.stringify(data));
    } catch (err) {
      console.error("Location search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() ? (
            <span key={i} className="text-[var(--accent)] font-black">{part}</span>
          ) : part
        )}
      </>
    );
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length > 2) {
      searchTimeout.current = setTimeout(() => searchLocations(query), 500);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = await response.json();
        onSelect({
          lat: latitude,
          lng: longitude,
          address: data.display_name,
          name: data.address.road || data.address.neighbourhood || data.address.city || "Current Location"
        });
      } catch (err) {
        onSelect({
          lat: latitude,
          lng: longitude,
          address: "Coordinates Captured",
          name: "Current Location"
        });
      } finally {
        setLocating(false);
      }
    }, () => {
      setLocating(false);
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--surface)] rounded-[40px] shadow-2xl overflow-hidden border border-[var(--border)]"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[var(--text)] uppercase tracking-tight flex items-center gap-3">
              <MapPin className="w-6 h-6 text-[var(--accent)]" />
              Pin Location
            </h3>
            <button onClick={onCancel} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors">
              <X className="w-5 h-5 text-[var(--subtext)]" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--subtext)] opacity-40" />
              <input 
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, place, or address..."
                className="w-full bg-[var(--bg)] border-none h-16 pl-14 pr-6 rounded-3xl text-sm focus:ring-2 focus:ring-[var(--accent)]/20 transition-all font-medium text-[var(--text)]"
              />
              {loading && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-[var(--accent)]" />}
            </div>

            <button 
              onClick={handleGetCurrentLocation}
              disabled={locating}
              className="w-full flex items-center gap-4 p-5 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 text-[var(--accent)] rounded-3xl transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                <>
                  <Navigation className="w-5 h-5" />
                  Use Precise GPS Location
                </>
              )}
            </button>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              <AnimatePresence mode="popLayout">
                {results.map((res) => (
                  <motion.button
                    key={res.place_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onSelect({
                      lat: parseFloat(res.lat),
                      lng: parseFloat(res.lon),
                      address: res.display_name,
                      name: res.name || res.address.road || res.address.city || "Search Result"
                    })}
                    className="w-full flex items-start gap-4 p-5 hover:bg-[var(--bg)] rounded-[24px] text-left transition-all border border-transparent hover:border-[var(--border)] group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/5 flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)] transition-colors">
                      <MapPin className="w-5 h-5 text-[var(--accent)] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-[12px] font-black uppercase tracking-widest text-[var(--text)] transition-colors mb-0.5">
                        {highlightMatch(res.name || res.display_name.split(',')[0], query)}
                      </h4>
                      <p className="text-[10px] font-medium text-[var(--subtext)] opacity-40 line-clamp-2 leading-relaxed">
                        {highlightMatch(res.display_name, query)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
              
              {query.length > 2 && !loading && results.length === 0 && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-black/[0.03] rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-[var(--subtext)] opacity-20" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">No locations found</p>
                    <p className="text-[9px] font-bold text-[var(--subtext)] opacity-20 mt-1 italic">Try a different name or set a manual label below.</p>
                  </div>
                  
                  <button 
                    onClick={() => onSelect({ lat: 0, lng: 0, name: query, address: "Manual Entry" })}
                    className="px-6 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text)] hover:bg-[var(--bg)] transition-all"
                  >
                    Use "{query}" as Label
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
