import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, X, Unlock, Fingerprint, Grid } from 'lucide-react';
import { cn } from '../lib/utils';

interface PinLockProps {
  onUnlock?: () => void;
  isSetting?: boolean;
  onSet?: (value: string, type?: 'pin' | 'password' | 'biometric' | 'pattern') => void;
  onCancel?: () => void;
  lockConfig?: { type: 'pin' | 'password' | 'biometric' | 'pattern', value: string | null };
  biometricActive?: boolean;
}

export function PinLock({ onUnlock, isSetting, onSet, onCancel, lockConfig, biometricActive }: PinLockProps) {
  const [mode, setMode] = useState<'pin' | 'password' | 'biometric' | 'pattern'>(lockConfig?.type || 'pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [step, setStep] = useState(1);
  const [firstValue, setFirstValue] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  // Pattern state
  const [patternPoints, setPatternPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Check if biometric is available
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setBiometricAvailable(available));
    }
  }, []);

  // Try biometric on mount if active
  useEffect(() => {
    if (!isSetting && biometricActive && lockConfig?.type === 'biometric') {
      setMode('biometric');
      handleBiometricUnlock();
    }
  }, [isSetting, biometricActive, lockConfig?.type]);

  const handleBiometricUnlock = async () => {
    try {
      if (window.PublicKeyCredential) {
         // In a real app we'd verify a challenge. Locally, we just trigger the system prompt as a "mock" check.
         const challenge = new Uint8Array(32);
         window.crypto.getRandomValues(challenge);
         
         await navigator.credentials.get({ 
           publicKey: {
             challenge: challenge,
             timeout: 60000,
             userVerification: "required"
           }
         });
         onUnlock?.();
      } else {
        // Fallback for environments without WebAuthn
        onUnlock?.();
      }
    } catch (err) {
      console.error("Biometric failed", err);
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  const handleKeypadClick = (val: string) => {
    if (pin.length < (mode === 'pin' ? 4 : 20)) {
      const newValue = pin + val;
      setPin(newValue);
      
      if (mode === 'pin' && newValue.length === 4) {
        processSubmission(newValue);
      }
    }
  };

  const processSubmission = (submittedValue: string) => {
    if (isSetting) {
      if (step === 1) {
        setFirstValue(submittedValue);
        setStep(2);
        setPin('');
        setPatternPoints([]);
      } else {
        if (submittedValue === firstValue) {
          onSet?.(submittedValue, mode);
        } else {
          setError(true);
          if ('vibrate' in navigator) navigator.vibrate(200);
          setTimeout(() => {
            setError(false);
            setPin('');
            setStep(1);
            setFirstValue('');
            setPatternPoints([]);
          }, 1000);
        }
      }
    } else {
      if (submittedValue === lockConfig?.value) {
        onUnlock?.();
      } else {
        setError(true);
        if ('vibrate' in navigator) navigator.vibrate(200);
        setTimeout(() => {
          setError(false);
          setPin('');
          setPatternPoints([]);
        }, 1000);
      }
    }
  };

  // Pattern Helpers
  const getPointIndex = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return -1;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Grid is 3x3, width 240px
    const col = Math.floor(x / (rect.width / 3));
    const row = Math.floor(y / (rect.height / 3));
    
    if (col >= 0 && col < 3 && row >= 0 && row < 3) {
      const index = row * 3 + col;
      // Precise check: check distance to center of cell
      const cellCenter = { x: (col + 0.5) * (rect.width / 3), y: (row + 0.5) * (rect.height / 3) };
      const dist = Math.sqrt(Math.pow(x - cellCenter.x, 2) + Math.pow(y - cellCenter.y, 2));
      if (dist < 30) return index;
    }
    return -1;
  };

  const handlePatternStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const idx = getPointIndex(e);
    if (idx !== -1) setPatternPoints([idx]);
  };

  const handlePatternMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const idx = getPointIndex(e);
    if (idx !== -1 && !patternPoints.includes(idx)) {
      setPatternPoints([...patternPoints, idx]);
    }
  };

  const handlePatternEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (patternPoints.length >= 3) {
      processSubmission(patternPoints.join(','));
    } else if (patternPoints.length > 0) {
      setPatternPoints([]);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[var(--bg)] flex flex-col items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center space-y-8">
        <header className="space-y-4">
          <div className="flex justify-center">
            <motion.div 
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-300",
                error ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : "bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/20"
              )}
            >
              {error ? <X className="w-8 h-8" /> : (isSetting ? <ShieldCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />)}
            </motion.div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-black tracking-tight text-[var(--text)]">
              {isSetting 
                ? (step === 1 ? `Set ${mode.toUpperCase()} Lock` : `Confirm ${mode.toUpperCase()}`)
                : 'Locked Archive'}
            </h2>
            <p className="text-[var(--subtext)] text-xs uppercase tracking-widest font-bold opacity-60">
              {isSetting 
                ? 'Create a secure signature for your memories'
                : 'Authentication required to reveal the past'}
            </p>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[360px]">
          {mode === 'biometric' && !isSetting && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-8 py-8"
            >
              <button 
                onClick={handleBiometricUnlock}
                className="w-32 h-32 bg-[var(--accent)]/5 rounded-full flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all shadow-inner relative group"
              >
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20 animate-ping opacity-20" />
                <Fingerprint className="w-16 h-16" />
              </button>
              <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.4em] animate-pulse">Waiting for signature...</p>
            </motion.div>
          )}

          {mode === 'pattern' && (
            <div className="relative p-6 bg-[var(--accent)]/5 rounded-[48px] border border-[var(--accent)]/10 shadow-inner">
               <svg 
                  ref={svgRef}
                  width="240" 
                  height="240" 
                  className="touch-none select-none"
                  onMouseDown={handlePatternStart}
                  onMouseMove={handlePatternMove}
                  onMouseUp={handlePatternEnd}
                  onTouchStart={handlePatternStart}
                  onTouchMove={handlePatternMove}
                  onTouchEnd={handlePatternEnd}
               >
                  {/* Grid of Dots */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                    const cx = (i % 3 + 0.5) * 80;
                    const cy = (Math.floor(i / 3) + 0.5) * 80;
                    const isSelected = patternPoints.includes(i);
                    return (
                      <g key={i}>
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={isSelected ? 14 : 4} 
                          className={cn(
                            "transition-all duration-300",
                            isSelected ? "fill-[var(--accent)]" : "fill-[var(--subtext)]/20"
                          )} 
                        />
                        {isSelected && (
                          <circle cx={cx} cy={cy} r={28} className="fill-[var(--accent)]/10 animate-pulse" />
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Drawing Line */}
                  {patternPoints.length > 1 && (
                    <polyline 
                       points={patternPoints.map(i => `${(i % 3 + 0.5) * 80},${(Math.floor(i / 3) + 0.5) * 80}`).join(' ')}
                       className="stroke-[var(--accent)] fill-none stroke-[8] stroke-round opacity-60"
                    />
                  )}
               </svg>
            </div>
          )}

          {mode === 'pin' && (
            <div className="space-y-12">
              <div className="flex justify-center gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div 
                    key={i}
                    animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 border-[var(--border)] transition-all duration-300",
                      pin.length > i ? "bg-[var(--accent)] border-[var(--accent)] scale-125 shadow-lg shadow-[var(--accent)]/40" : "scale-100"
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((num, i) => {
                  if (num === '') return <div key={i} />;
                  if (num === 'back') return (
                    <button 
                      key={i}
                      onClick={handleBackspace}
                      className="w-16 h-16 rounded-full flex items-center justify-center text-[var(--subtext)] hover:text-red-500 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  );
                  return (
                    <button 
                      key={i}
                      onClick={() => handleKeypadClick(num.toString())}
                      className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] text-2xl font-black text-[var(--text)] hover:bg-[var(--accent)] hover:text-white active:scale-90 transition-all shadow-sm"
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'password' && (
            <div className="w-full max-w-sm space-y-6">
              <div className="relative group">
                <input 
                  type="password"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && processSubmission(pin)}
                  className="w-full px-8 py-6 bg-[var(--surface)] border-2 border-[var(--border)] rounded-[32px] text-center text-xl font-bold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-all shadow-inner"
                  placeholder="Secret Phrase"
                />
              </div>
              <button 
                onClick={() => processSubmission(pin)}
                disabled={pin.length < 1}
                className="w-full py-5 bg-[var(--accent)] text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
              >
                Reveal Archive
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8 pb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <LockButton mode="pin" activeMode={mode} onClick={() => {setMode('pin'); setPin('');}} label="PIN" icon={<Grid className="w-3.5 h-3.5" />} />
            <LockButton mode="password" activeMode={mode} onClick={() => {setMode('password'); setPin('');}} label="Vault" icon={<Lock className="w-3.5 h-3.5" />} />
            <LockButton mode="pattern" activeMode={mode} onClick={() => {setMode('pattern'); setPatternPoints([]);}} label="Signature" icon={<Unlock className="w-3.5 h-3.5" />} />
            {!isSetting && biometricActive && (
              <LockButton mode="biometric" activeMode={mode} onClick={() => {setMode('biometric'); handleBiometricUnlock();}} label="Bio" icon={<Fingerprint className="w-3.5 h-3.5" />} />
            )}
          </div>
          
          {onCancel && (
            <button 
              onClick={onCancel}
              className="text-[var(--subtext)] hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LockButton({ mode, activeMode, onClick, label, icon }: { mode: string, activeMode: string, onClick: () => void, label: string, icon: React.ReactNode }) {
  const isActive = mode === activeMode;
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
        isActive 
          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20" 
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--subtext)] hover:bg-[var(--bg)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
