import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings, Subtitles, ChevronRight, ChevronLeft, Check, FastForward, Rewind, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cache } from '../utils/cache';

export default function Player() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem('token') || '');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialEnded = filename ? Cache.isVideoEnded(filename) : false;
  const initialSettings = Cache.getSettings();
  
  const [hasStarted, setHasStarted] = useState(initialEnded);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(initialEnded);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(initialSettings.volume);
  const [isMuted, setIsMuted] = useState(initialSettings.isMuted);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'skip_duration'>('main');
  const [jumpStep, setJumpStep] = useState(initialSettings.jumpStep);
  const [playFlash, setPlayFlash] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const isScrubbingRef = useRef(false);
  const showSettingsRef = useRef(showSettings);
  const isEndedRef = useRef(isEnded);

  useEffect(() => {
    isEndedRef.current = isEnded;
    if (isEnded && hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  }, [isEnded]);

  const [skipIndicator, setSkipIndicator] = useState<{ amount: number, side: 'left' | 'right', id: number } | null>(null);
  const skipTimeoutRef = useRef<number | null>(null);
  const [volIndicator, setVolIndicator] = useState<{ volume: number, id: number } | null>(null);
  const volTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [navigate, token]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = initialSettings.volume;
      videoRef.current.muted = initialSettings.isMuted;
    }
  }, [initialSettings]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!showSettingsRef.current && !isEndedRef.current) {
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => {
    showSettingsRef.current = showSettings;
    if (showSettings) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowControls(true);
    } else {
      resetHideTimer();
      setTimeout(() => setSettingsView('main'), 300);
    }
  }, [showSettings]);

  const handleVideoClick = () => {
    if (showSettings) {
      setShowSettings(false);
      return;
    }
    togglePlay();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isEnded || videoRef.current.ended) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsEnded(false);
        setIsPlaying(true);
        resetHideTimer();
        if (filename) Cache.clearVideoEnded(filename);
        return;
      }

      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlayFlash(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setPlayFlash(false), 400);
      }
      else videoRef.current.pause();
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbingRef.current) {
      const current = videoRef.current.currentTime;
      setProgress(current);
      // Save progress to cache
      if (filename && current > 0) {
        Cache.saveVideoProgress(filename, current);
      }
      if (isEnded && current < duration - 1) {
         setIsEnded(false);
         if (filename) Cache.clearVideoEnded(filename);
      }
      if (!isEnded && duration > 0 && current >= duration - 0.5) {
         setIsEnded(true);
         setIsPlaying(false);
         setShowControls(true);
         if (filename) Cache.markVideoEnded(filename);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = initialSettings.volume;
      videoRef.current.muted = initialSettings.isMuted;
      
      // Restore watch progress
      if (filename) {
        if (Cache.isVideoEnded(filename)) {
          setIsEnded(true);
          setHasStarted(true); // Bypass the giant initial play button
          setShowControls(true);
          videoRef.current.currentTime = videoRef.current.duration;
          setProgress(videoRef.current.duration);
          return;
        }

        const saved = Cache.getVideoProgress(filename);
        if (saved !== null) {
          if (saved > 0 && saved < videoRef.current.duration - 10) {
            videoRef.current.currentTime = saved;
            setProgress(saved);
          }
        }
      }
    }
  };

  const updateScrubVisuals = (clientX: number, rect: DOMRect) => {
    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    if (duration) {
      setProgress(percent * duration);
    }
  };

  const updateVideoTime = (clientX: number, rect: DOMRect) => {
    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    if (videoRef.current && duration) {
      videoRef.current.currentTime = percent * duration;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isScrubbingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    
    updateScrubVisuals(e.clientX, rect);
    updateVideoTime(e.clientX, rect);

    let lastVideoUpdateTime = performance.now();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (isScrubbingRef.current) {
        updateScrubVisuals(moveEvent.clientX, rect);
        
        // Throttle actual video seeking to 15fps (~66ms) to prevent freezing
        const now = performance.now();
        if (now - lastVideoUpdateTime > 66) {
          updateVideoTime(moveEvent.clientX, rect);
          lastVideoUpdateTime = now;
        }
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      isScrubbingRef.current = false;
      updateVideoTime(upEvent.clientX, rect); // final sync
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const updateVolumeScrub = (clientX: number, rect: DOMRect) => {
    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setVolume(percent);
    if (videoRef.current) {
      videoRef.current.volume = percent;
      if (percent > 0) setIsMuted(false);
    }
    Cache.saveSettings({ volume: percent, isMuted: percent === 0 });
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    updateVolumeScrub(e.clientX, rect);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateVolumeScrub(moveEvent.clientX, rect);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      Cache.saveSettings({ isMuted: !isMuted });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'k') {
        e.preventDefault();
        togglePlay();
        resetHideTimer();
      } else if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 'm') {
        e.preventDefault();
        toggleMute();
        resetHideTimer();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newVol = e.shiftKey ? 1 : Math.min(volume + 0.05, 1);
        setVolume(newVol);
        if (newVol > 0) setIsMuted(false);
        if (videoRef.current) videoRef.current.volume = newVol;
        Cache.saveSettings({ volume: newVol, isMuted: newVol === 0 });
        resetHideTimer();
        setVolIndicator({ volume: newVol, id: Date.now() });
        if (volTimeoutRef.current) clearTimeout(volTimeoutRef.current);
        volTimeoutRef.current = setTimeout(() => setVolIndicator(null), 1500);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newVol = e.shiftKey ? 0 : Math.max(volume - 0.05, 0);
        setVolume(newVol);
        if (newVol === 0) setIsMuted(true);
        if (videoRef.current) videoRef.current.volume = newVol;
        Cache.saveSettings({ volume: newVol, isMuted: newVol === 0 });
        resetHideTimer();
        setVolIndicator({ volume: newVol, id: Date.now() });
        if (volTimeoutRef.current) clearTimeout(volTimeoutRef.current);
        volTimeoutRef.current = setTimeout(() => setVolIndicator(null), 1500);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - jumpStep, 0);
          setProgress(videoRef.current.currentTime);
        }
        resetHideTimer();
        setSkipIndicator(prev => {
          const amt = prev?.side === 'left' ? prev.amount + jumpStep : jumpStep;
          if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
          skipTimeoutRef.current = setTimeout(() => setSkipIndicator(null), 1500);
          return { amount: amt, side: 'left', id: Date.now() };
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current && duration) {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + jumpStep, duration);
          setProgress(videoRef.current.currentTime);
        }
        resetHideTimer();
        setSkipIndicator(prev => {
          const amt = prev?.side === 'right' ? prev.amount + jumpStep : jumpStep;
          if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
          skipTimeoutRef.current = setTimeout(() => setSkipIndicator(null), 1500);
          return { amount: amt, side: 'right', id: Date.now() };
        });
      } else if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const percent = parseInt(e.key) / 10;
        if (videoRef.current && duration) {
          videoRef.current.currentTime = duration * percent;
          setProgress(duration * percent);
        }
        resetHideTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, volume, jumpStep, isMuted]);

  if (!filename || !token) return null;

  const videoUrl = `http://localhost:4000/api/stream/${encodeURIComponent(filename)}?token=${token}`;

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      style={{ height: '100vh', width: '100%', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
    >
      <video 
        ref={videoRef}
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => { 
          setIsEnded(true); 
          setIsPlaying(false); 
          setShowControls(true); 
          if (filename) Cache.markVideoEnded(filename);
        }}
        style={{ width: '100%', height: '100%', outline: 'none', objectFit: 'contain' }}
        src={videoUrl}
      />

      <AnimatePresence>
        {skipIndicator && (
          <motion.div
            key={`skip-${skipIndicator.side}`}
            initial={{ opacity: 0, x: skipIndicator.side === 'left' ? -20 : 20, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: skipIndicator.side === 'left' ? -20 : 20, y: '-50%', transition: { duration: 0.5 } }}
            transition={{ duration: 0.2 }}
            className="liquid-panel"
            style={{
              position: 'absolute', top: '50%',
              [skipIndicator.side]: '10%',
              width: '120px', height: '120px', borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 100, border: '1px solid var(--glass-border)'
            }}
          >
            {skipIndicator.side === 'left' ? <Rewind size={32} /> : <FastForward size={32} />}
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', transform: 'translateY(3px)' }}>
              {skipIndicator.side === 'left' ? '-' : '+'}{skipIndicator.amount}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {volIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', transition: { duration: 0.5 } }}
            transition={{ duration: 0.2 }}
            className="liquid-panel"
            style={{
              position: 'absolute', top: '15%', left: '50%',
              width: '120px', height: '120px', borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 100, border: '1px solid var(--glass-border)'
            }}
          >
            {volIndicator.volume === 0 ? <VolumeX size={32} /> : <Volume2 size={32} />}
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', transform: 'translateY(3px)' }}>
              {Math.round(volIndicator.volume * 100)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasStarted && (isEnded || (!isPlaying && showControls)) && (
          <motion.div
            key="static-play"
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 1.2, x: '-50%', y: '-50%', transition: { duration: 0.2 } }}
            transition={{ duration: 0.2 }}
            className="liquid-panel"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '100px', height: '100px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 40, border: '1px solid var(--glass-border)'
            }}
          >
            {isEnded ? <RotateCcw size={40} color="white" strokeWidth={2.5} /> : <Play size={40} fill="white" style={{ marginLeft: '3px' }} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasStarted && playFlash && (
          <motion.div
            key="flash-play"
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1.1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 1.3, x: '-50%', y: '-50%', transition: { duration: 0.2 } }}
            transition={{ duration: 0.2 }}
            className="liquid-panel"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '100px', height: '100px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 40, border: '1px solid var(--glass-border)'
            }}
          >
            <Pause size={40} fill="white" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setHasStarted(true);
              setIsPlaying(true);
              if (videoRef.current) videoRef.current.play();
            }}
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="liquid-button active-liquid-glass" 
              style={{
                width: '120px', height: '120px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
              }}
            >
              <Play size={48} fill="currentColor" style={{ marginLeft: '8px' }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '1.5rem', position: 'absolute', top: 0, left: 0, zIndex: 10 }}
          >
            <button onClick={() => navigate('/library')} className="liquid-button" style={{ padding: '0.75rem 1.5rem' }}>
              <ArrowLeft size={20} />
              <span style={{ transform: 'translateY(1.5px)' }}>Back</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 40, x: "-50%" }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              width: '90%',
              maxWidth: '800px',
              zIndex: 10
            }}
          >
            <div className="liquid-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: '24px', background: 'rgba(15, 15, 20, 0.9)' }}>
              
              {/* Play/Pause */}
              <button 
                onClick={togglePlay} 
                style={{ 
                  background: 'var(--text-primary)', color: '#000', border: 'none', 
                  width: '36px', height: '36px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'transform 0.2s ease', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(255,255,255,0.2)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isEnded ? <RotateCcw size={18} color="#000" strokeWidth={2.5} /> : isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: '2px' }} />}
              </button>
              
              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div 
                  className="custom-slider-container"
                  onPointerDown={handleVolumePointerDown}
                  style={{ width: '60px', height: '24px' }}
                >
                  <div className="custom-slider-track" />
                  <div className="custom-slider-fill" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                  <div className="custom-slider-thumb" style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 7px)` }} />
                </div>
              </div>

              {/* Scrubber */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatTime(progress)}</span>
                
                {/* Custom Track */}
                <div 
                  className="custom-slider-container"
                  onPointerDown={handlePointerDown}
                  style={{ flex: 1, height: '24px' }}
                >
                  <div className="custom-slider-track" />
                  
                  <div className="custom-slider-fill" style={{ 
                    width: `${duration ? (progress / duration) * 100 : 0}%`,
                    // eslint-disable-next-line react-hooks/refs
                    transition: isScrubbingRef.current ? 'height 0.2s ease' : 'width 0.25s linear, height 0.2s ease'
                  }} />
                  
                  <div className="custom-slider-thumb" style={{ 
                    left: `calc(${duration ? (progress / duration) * 100 : 0}% - 7px)`,
                    // eslint-disable-next-line react-hooks/refs
                    transition: isScrubbingRef.current ? 'transform 0.2s ease' : 'left 0.25s linear, transform 0.2s ease',
                    willChange: 'left, transform'
                  }} />
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatTime(duration)}</span>
              </div>

              {/* Settings & Fullscreen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'not-allowed', opacity: 0.3, display: 'flex', alignItems: 'center' }} title="Subtitles (Unavailable)">
                  <Subtitles size={18} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: showSettings ? 'var(--primary-color)' : 'var(--text-primary)', cursor: 'pointer', opacity: showSettings ? 1 : 0.8, display: 'flex', alignItems: 'center', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = showSettings ? '1' : '0.8'}>
                    <Settings size={18} />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ layout: { type: "spring", bounce: 0, duration: 0.3 }, opacity: { duration: 0.2 } }}
                        style={{
                          position: 'absolute', bottom: 'calc(100% + 1.5rem)', right: -10,
                          background: 'rgba(20, 20, 25, 0.9)', backdropFilter: 'blur(12px)',
                          border: '1px solid var(--glass-border)', borderRadius: '12px',
                          padding: '0.5rem', minWidth: '180px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                          overflow: 'hidden'
                        }}
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          {settingsView === 'main' ? (
                            <motion.div
                              key="main"
                              initial={{ x: '-100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ display: 'flex', flexDirection: 'column', width: 'max-content' }}
                            >
                              <button
                                onClick={() => setSettingsView('skip_duration')}
                                style={{
                                  background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem',
                                  transition: 'background-color 0.2s ease', minWidth: '200px', whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <span style={{ transform: 'translateY(1px)' }}>Skip Duration</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                  <span style={{ transform: 'translateY(1px)' }}>{jumpStep}s</span>
                                  <ChevronRight size={14} />
                                </div>
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="skip"
                              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: 'max-content' }}
                            >
                              <button
                                onClick={() => setSettingsView('main')}
                                style={{
                                  background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.25rem',
                                  transition: 'color 0.2s ease', whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <ChevronLeft size={14} />
                                <span style={{ transform: 'translateY(1px)' }}>Skip Duration</span>
                              </button>
                              
                              <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }} />
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {[5, 10, 15, 30].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => { setJumpStep(val); Cache.saveSettings({ jumpStep: val }); setSettingsView('main'); setShowSettings(false); }}
                                    style={{
                                      background: jumpStep === val ? 'var(--primary-color)' : 'transparent',
                                      color: jumpStep === val ? '#fff' : 'var(--text-primary)',
                                      border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { if (jumpStep !== val) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    onMouseLeave={(e) => { if (jumpStep !== val) e.currentTarget.style.background = 'transparent' }}
                                  >
                                    <span style={{ transform: 'translateY(1px)' }}>{val} seconds</span>
                                    {jumpStep === val && <Check size={14} />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <Maximize size={18} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}