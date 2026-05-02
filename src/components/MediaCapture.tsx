import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Video, Square, Play, Trash2, Camera, Check, RefreshCw, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface MediaCaptureProps {
  type: 'audio' | 'video';
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

export function MediaCapture({ type, onCapture, onCancel }: MediaCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (type === 'video' && !recordedBlob) {
      startCameraPreview();
    }
    return () => {
      stopStreams();
    };
  }, [type, recordedBlob]);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startCameraPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const startRecording = async () => {
    try {
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video'
        });
        streamRef.current = stream;
        if (type === 'video' && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }

      chunksRef.current = [];
      
      // Determine best supported mime type
      let mimeType = '';
      if (type === 'video') {
        const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
        mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      } else {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/aac'];
        mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMime = mediaRecorder.mimeType || (type === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(chunksRef.current, { type: finalMime });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        stopStreams();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording start error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDone = () => {
    if (recordedBlob) {
      onCapture(recordedBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    if (type === 'video') {
      startCameraPreview();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
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
            <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
              {type === 'audio' ? <Mic className="w-5 h-5 text-[var(--accent)]" /> : <Video className="w-5 h-5 text-[var(--accent)]" />}
              {type === 'audio' ? 'Voice Memory' : 'Video Memory'}
            </h3>
            <button onClick={onCancel} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors">
              <X className="w-5 h-5 text-[var(--subtext)]" />
            </button>
          </div>

          <div className="aspect-video bg-[var(--bg)]/5 rounded-[32px] overflow-hidden relative flex items-center justify-center border-2 border-[var(--border)]/50">
            {type === 'video' ? (
              <>
                {!recordedBlob ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <video 
                    src={previewUrl!} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <motion.div 
                  animate={isRecording ? {
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 0 0px rgba(0,0,0, 0)',
                      '0 0 0 20px rgba(var(--accent), 0.1)',
                      '0 0 0 0px rgba(0,0,0, 0)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn(
                    "w-24 h-24 rounded-[40px] flex items-center justify-center transition-all duration-500",
                    isRecording ? "bg-[var(--accent)] text-white" : "bg-[var(--accent)]/10 text-[var(--accent)]"
                  )}
                >
                  <Mic className={cn("w-12 h-12", isRecording ? "animate-pulse" : "")} />
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                  {previewUrl && !isRecording && <audio src={previewUrl} controls className="px-4 opacity-60 hover:opacity-100 transition-opacity" />}
                  {!isRecording && !recordedBlob && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--subtext)] opacity-40">Ready to archive your voice</p>}
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Recording {formatTime(recordingTime)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            {!recordedBlob ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors",
                  isRecording ? "bg-red-500 text-white" : "bg-[var(--accent)] text-white"
                )}
              >
                {isRecording ? <Square className="w-8 h-8 fill-current" /> : (type === 'audio' ? <Mic className="w-8 h-8" /> : <Camera className="w-8 h-8" />)}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetRecording}
                  className="w-14 h-14 bg-[var(--bg)] text-[var(--subtext)] rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                  title="Retake"
                >
                  <RefreshCw className="w-6 h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDone}
                  className="w-20 h-20 bg-[var(--accent)] text-white rounded-full flex items-center justify-center shadow-xl shadow-[var(--accent)]/30"
                  title="Use this recording"
                >
                  <Check className="w-10 h-10" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { resetRecording(); onCancel(); }}
                  className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                  title="Discard"
                >
                  <Trash2 className="w-6 h-6" />
                </motion.button>
              </>
            )}
          </div>
          
          <p className="text-center text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--subtext)] opacity-40">
            {isRecording ? 'Capturing the present...' : (recordedBlob ? 'Moment preserved' : 'Press to start recording')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
