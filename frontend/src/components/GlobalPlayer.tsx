/*
 * Onyx Stream
 * Copyright (C) 2026 DiamTek / Alexéy Shishkin
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal, flushSync } from 'react-dom';
import { ArrowLeft, Play, Pause, Volume2, Volume1, VolumeX, Maximize, PictureInPicture2, Settings, Subtitles, ChevronRight, ChevronLeft, Check, FastForward, Rewind, RotateCcw, PictureInPicture } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cache } from '../utils/cache';

export default function GlobalPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlayerRoute = location.pathname.startsWith('/player/');
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [docPipWindow, setDocPipWindow] = useState<Window | null>(null);
  
  useEffect(() => {
    if (isPlayerRoute) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveFilename(decodeURIComponent(location.pathname.split('/')[2]));
    }
  }, [location, isPlayerRoute]);

  const [token] = useState(localStorage.getItem('token') || '');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialEnded = activeFilename ? Cache.isVideoEnded(activeFilename) : false;
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
  const [isPiP, setIsPiP] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'skip_duration' | 'playback_speed'>('main');
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(initialSettings.playbackSpeed || 1);

  const [introStart, setIntroStart] = useState<number | null>(null);
  const [introEnd, setIntroEnd] = useState<number | null>(null);
  const [outroStart, setOutroStart] = useState<number | null>(null);
  const [outroEnd, setOutroEnd] = useState<number | null>(null);

  useEffect(() => {
    if (activeFilename && token) {
      fetch(`http://localhost:4000/api/intro/${encodeURIComponent(activeFilename)}?token=${token}`)
        .then(res => res.json())
        .then(data => {
          setIntroStart(data.introStart !== undefined ? data.introStart : null);
          setIntroEnd(data.introEnd !== undefined ? data.introEnd : null);
          setOutroStart(data.outroStart !== undefined ? data.outroStart : null);
          setOutroEnd(data.outroEnd !== undefined ? data.outroEnd : null);
        })
        .catch(err => console.error("Failed to fetch intro data", err));
    }
  }, [activeFilename, token]);

  useEffect(() => {
    if (!isPlayerRoute && !docPipWindow && !isPiP && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlayerRoute, docPipWindow, isPiP]);

  const [jumpStep, setJumpStep] = useState(initialSettings.jumpStep);
  const [playFlash, setPlayFlash] = useState<'play' | 'pause' | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const isScrubbingRef = useRef(false);
  const showSettingsRef = useRef(showSettings);
  const isEndedRef = useRef(isEnded);
  const hasStartedRef = useRef(hasStarted);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

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
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [initialSettings.volume, initialSettings.isMuted, playbackSpeed, activeFilename]);

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
        if (activeFilename) Cache.clearVideoEnded(activeFilename);
        return;
      }

      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlayFlash('play');
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = window.setTimeout(() => setPlayFlash(null), 400);
      }
      else {
        videoRef.current.pause();
        setPlayFlash('pause');
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = window.setTimeout(() => setPlayFlash(null), 400);
      }
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbingRef.current) {
      const current = videoRef.current.currentTime;
      setProgress(current);
      // Save progress to cache
      if (activeFilename && current > 0 && duration > 0) {
        Cache.saveVideoProgress(activeFilename, current, duration);
      }
      if (isEnded && current < duration - 1) {
         setIsEnded(false);
         if (activeFilename) Cache.clearVideoEnded(activeFilename);
      }
      if (!isEnded && duration > 0 && current >= duration - 0.5) {
         setIsEnded(true);
         setIsPlaying(false);
         setShowControls(true);
         if (activeFilename) Cache.markVideoEnded(activeFilename);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = initialSettings.volume;
      videoRef.current.muted = initialSettings.isMuted;
      
      // Restore watch progress
      if (activeFilename) {
        if (Cache.isVideoEnded(activeFilename)) {
          setIsEnded(true);
          setHasStarted(true); // Bypass the giant initial play button
          setShowControls(true);
          videoRef.current.currentTime = videoRef.current.duration;
          setProgress(videoRef.current.duration);
          return;
        }

        const saved = Cache.getVideoProgress(activeFilename);
        if (saved !== null) {
          if (saved.time > 0 && saved.time < videoRef.current.duration - 10) {
            videoRef.current.currentTime = saved.time;
            setProgress(saved.time);
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
      if (docPipWindow) {
        docPipWindow.removeEventListener('pointermove', handlePointerMove);
        docPipWindow.removeEventListener('pointerup', handlePointerUp);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    if (docPipWindow) {
      docPipWindow.addEventListener('pointermove', handlePointerMove);
      docPipWindow.addEventListener('pointerup', handlePointerUp);
    }
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
      if (docPipWindow) {
        docPipWindow.removeEventListener('pointermove', handlePointerMove);
        docPipWindow.removeEventListener('pointerup', handlePointerUp);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    if (docPipWindow) {
      docPipWindow.addEventListener('pointermove', handlePointerMove);
      docPipWindow.addEventListener('pointerup', handlePointerUp);
    }
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

  const togglePiP = async () => {
    try {
      if ('documentPictureInPicture' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docPiP = (window as any).documentPictureInPicture;
        if (docPiP.window) {
          docPiP.window.close();
          return;
        }

        const currentTime = videoRef.current?.currentTime || 0;

        const pipWin = await docPiP.requestWindow({
          width: 800,
          height: 450,
        });

        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            const cssRules = Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWin.document.head.appendChild(style);
          } catch {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media.mediaText;
            link.href = styleSheet.href;
            pipWin.document.head.appendChild(link);
          }
        });

        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.padding = '0';
        pipWin.document.body.style.background = '#000';
        pipWin.document.body.style.overflow = 'hidden';

        const container = document.createElement('div');
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.id = 'pip-root';
        pipWin.document.body.appendChild(container);

        pipWin.addEventListener('pagehide', () => {
          const currentTime = videoRef.current?.currentTime || 0;

          flushSync(() => {
            setDocPipWindow(null);
            if (!window.location.pathname.startsWith('/player/') && activeFilename) {
              navigate(`/player/${encodeURIComponent(activeFilename)}`);
            }
          });

          if (videoRef.current) {
            videoRef.current.currentTime = currentTime;
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });

        flushSync(() => {
          setDocPipWindow(pipWin);
        });

        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          if (videoRef.current) videoRef.current.disablePictureInPicture = true;
        } else if (videoRef.current && document.pictureInPictureEnabled) {
          videoRef.current.disablePictureInPicture = false;
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.warn("PiP failed", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'escape') {
        if (!hasStartedRef.current) {
          e.preventDefault();
          navigate('/library');
        }
      } else if (key === ' ' || key === 'k') {
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
    if (docPipWindow) {
      docPipWindow.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (docPipWindow) {
        docPipWindow.removeEventListener('keydown', handleKeyDown);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, volume, jumpStep, isMuted, docPipWindow]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.pictureInPictureElement === video) {
      setIsPiP(true);
    }

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => {
      setIsPiP(false);
      if (video) video.disablePictureInPicture = true;
      if (!location.pathname.startsWith('/player/') && activeFilename) {
        navigate(`/player/${encodeURIComponent(activeFilename)}`);
      }
    };

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [location.pathname, activeFilename, navigate]);

  if (!activeFilename || !token) return null;

  const videoUrl = `http://localhost:4000/api/stream/${encodeURIComponent(activeFilename)}?token=${token}`;

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const content = (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: (isPlayerRoute || !!docPipWindow) ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      style={{ 
        height: '100vh', width: '100%', 
        background: '#000', display: 'flex', flexDirection: 'column', 
        position: 'fixed', top: 0, left: 0, overflow: 'hidden', zIndex: 9999,
        pointerEvents: (isPlayerRoute || !!docPipWindow) ? 'auto' : 'none'
      }}
    >
      <video 
        ref={videoRef}
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { 
          setIsEnded(true); 
          setIsPlaying(false); 
          setShowControls(true); 
          if (activeFilename) Cache.markVideoEnded(activeFilename);
        }}
        onContextMenu={(e) => e.preventDefault()}
        disablePictureInPicture={true}
        style={{ width: '100%', height: '100%', outline: 'none', objectFit: 'contain' }}
        src={videoUrl}
      />

      {(isPlayerRoute || !!docPipWindow) && (
        <>
          <AnimatePresence>
            {isPiP && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}
              >
                <PictureInPicture size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Playing in Picture-in-Picture</h2>
                
                <button 
                  className="liquid-button active-liquid-glass"
                  style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
                  onClick={async () => {
                    if (document.pictureInPictureElement) {
                      await document.exitPictureInPicture();
                    }
                  }}
                >
                  <Maximize size={20} />
                  <span style={{ transform: 'translateY(1.5px)' }}>Restore Player</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
              width: docPipWindow ? '60px' : '90px', height: docPipWindow ? '60px' : '90px', borderRadius: '50%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 100, border: '1px solid var(--glass-border)'
            }}
          >
            {skipIndicator.side === 'left' ? <Rewind size={docPipWindow ? 20 : 28} /> : <FastForward size={docPipWindow ? 20 : 28} />}
            <span style={{ fontSize: docPipWindow ? '1rem' : '1.2rem', fontWeight: 'bold', transform: 'translateY(1px)' }}>
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
              position: 'absolute', top: docPipWindow ? 'calc(50% - 70px)' : 'calc(50% - 110px)', left: '50%',
              padding: docPipWindow ? '0.5rem 1rem' : '0.75rem 1.5rem', borderRadius: '40px',
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 100, border: '1px solid var(--glass-border)',
              minWidth: docPipWindow ? '120px' : '160px'
            }}
          >
            {volIndicator.volume === 0 ? <VolumeX size={docPipWindow ? 20 : 28} /> : (volIndicator.volume < 0.5 ? <Volume1 size={docPipWindow ? 20 : 28} /> : <Volume2 size={docPipWindow ? 20 : 28} />)}
            <span style={{ fontSize: docPipWindow ? '1rem' : '1.25rem', fontWeight: 'bold', transform: 'translateY(1px)' }}>
              {Math.round(volIndicator.volume * 100)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPiP && hasStarted && (isEnded || (!isPlaying && showControls)) && (
          <motion.div
            key="static-play"
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 1.2, x: '-50%', y: '-50%', transition: { duration: 0.2 } }}
            transition={{ duration: 0.2 }}
            className="liquid-panel"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: docPipWindow ? '60px' : '100px', height: docPipWindow ? '60px' : '100px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 40, border: '1px solid var(--glass-border)'
            }}
          >
            {isEnded ? <RotateCcw size={docPipWindow ? 24 : 40} color="white" strokeWidth={2.5} /> : <Play size={docPipWindow ? 24 : 40} fill="white" style={{ marginLeft: '3px' }} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isPiP && hasStarted && playFlash && (
          <motion.div
            key={playFlash}
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1.1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 1.3, x: '-50%', y: '-50%', transition: { duration: 0.2 } }}
            transition={{ duration: 0.2 }}
            className="liquid-panel"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: docPipWindow ? '60px' : '100px', height: docPipWindow ? '60px' : '100px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', background: 'rgba(15, 15, 20, 0.9)', color: 'white',
              zIndex: 40, border: '1px solid var(--glass-border)'
            }}
          >
            {playFlash === 'play' ? <Play size={docPipWindow ? 24 : 40} fill="white" style={{ marginLeft: '3px' }} /> : <Pause size={docPipWindow ? 24 : 40} fill="white" />}
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
        {(!hasStarted || showControls) && !docPipWindow && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '1.5rem', position: 'absolute', top: 0, left: 0, zIndex: 60 }}
          >
            <button onClick={() => navigate('/library')} className="liquid-button" style={{ padding: '0.75rem 1.5rem' }}>
              <ArrowLeft size={20} />
              <span style={{ transform: 'translateY(1.5px)' }}>{docPipWindow ? 'Browse Library' : (isPiP ? 'Back to Dashboard' : 'Back')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {introEnd !== null && hasStarted && !isEnded && progress >= (introStart !== null ? introStart : 0) && progress <= introEnd && (
          <motion.div
            initial={{ opacity: 0, x: 40, y: 0 }}
            animate={{ 
              opacity: showSettings ? 0 : 1, 
              x: showSettings ? 200 : 0,
              y: showControls ? 0 : (docPipWindow ? 40 : 64)
            }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ 
              opacity: { duration: 0.2 },
              x: { type: 'spring', stiffness: 200, damping: 20 },
              y: { duration: 0.3 }
            }}
            style={{ position: 'absolute', bottom: docPipWindow ? '3.5rem' : '7rem', right: docPipWindow ? '1.5rem' : '3rem', zIndex: 30 }}
          >
            <button 
              className="liquid-button active-liquid-glass"
              style={{ padding: docPipWindow ? '0.5rem 1rem' : '0.75rem 1.5rem', border: '1px solid var(--primary-alpha-60)' }}
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current && duration > introEnd) {
                  videoRef.current.currentTime = introEnd;
                  setProgress(introEnd);
                  setPlayFlash('play');
                  if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                  flashTimerRef.current = window.setTimeout(() => setPlayFlash(null), 400);
                }
              }}
            >
              <span style={{ fontWeight: 'bold', transform: 'translateY(1px)', fontSize: docPipWindow ? '0.85rem' : undefined }}>Skip Intro</span>
              <FastForward size={docPipWindow ? 16 : 18} style={{ marginLeft: '4px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {outroStart !== null && hasStarted && !isEnded && progress >= outroStart && progress <= (outroEnd !== null ? outroEnd : duration) && (
          <motion.div
            initial={{ opacity: 0, x: 40, y: 0 }}
            animate={{ 
              opacity: showSettings ? 0 : 1, 
              x: showSettings ? 200 : 0,
              y: showControls ? 0 : (docPipWindow ? 40 : 64)
            }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ 
              opacity: { duration: 0.2 },
              x: { type: 'spring', stiffness: 200, damping: 20 },
              y: { duration: 0.3 }
            }}
            style={{ position: 'absolute', bottom: docPipWindow ? '3.5rem' : '7rem', right: docPipWindow ? '1.5rem' : '3rem', zIndex: 30 }}
          >
            <button 
              className="liquid-button active-liquid-glass"
              style={{ padding: docPipWindow ? '0.5rem 1rem' : '0.75rem 1.5rem', border: '1px solid var(--primary-alpha-60)' }}
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  const targetTime = outroEnd !== null ? outroEnd : duration;
                  videoRef.current.currentTime = targetTime;
                  setProgress(targetTime);
                  setPlayFlash('play');
                  if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                  flashTimerRef.current = window.setTimeout(() => setPlayFlash(null), 400);
                }
              }}
            >
              <span style={{ fontWeight: 'bold', transform: 'translateY(1px)', fontSize: docPipWindow ? '0.85rem' : undefined }}>Skip Outro</span>
              <FastForward size={docPipWindow ? 16 : 18} style={{ marginLeft: '4px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {hasStarted && showControls && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 40, x: "-50%" }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: docPipWindow ? 0 : '2rem',
              left: '50%',
              width: docPipWindow ? '100%' : '90%',
              maxWidth: docPipWindow ? 'none' : '800px',
              zIndex: showSettings ? 999999 : 10
            }}
          >
            <div className="liquid-panel" style={{ 
              padding: docPipWindow ? '0.5rem 1rem' : '0.75rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: docPipWindow ? '1rem' : '1.5rem', 
              background: 'rgba(15, 15, 20, 0.9)',
              ...(docPipWindow ? {
                borderRadius: 0,
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none'
              } : {
                borderRadius: '24px'
              })
            }}>
              
              {/* Play/Pause */}
              <button 
                onClick={togglePlay} 
                style={{ 
                  background: 'var(--text-primary)', color: '#000', border: 'none', 
                  width: docPipWindow ? '28px' : '36px', height: docPipWindow ? '28px' : '36px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'transform 0.2s ease', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(255,255,255,0.2)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isEnded ? <RotateCcw size={docPipWindow ? 14 : 18} color="#000" strokeWidth={2.5} /> : isPlaying ? <Pause size={docPipWindow ? 14 : 18} fill="#000" /> : <Play size={docPipWindow ? 14 : 18} fill="#000" style={{ marginLeft: '2px' }} />}
              </button>
              
              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                  {isMuted || volume === 0 ? <VolumeX size={docPipWindow ? 14 : 18} /> : (volume < 0.5 ? <Volume1 size={docPipWindow ? 14 : 18} /> : <Volume2 size={docPipWindow ? 14 : 18} />)}
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
                <span style={{ fontSize: docPipWindow ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatTime(progress)}</span>
                
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

                <span style={{ fontSize: docPipWindow ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatTime(duration)}</span>
              </div>

              {/* Settings & Fullscreen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: docPipWindow ? '0.5rem' : '1rem' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'not-allowed', opacity: 0.3, display: 'flex', alignItems: 'center' }} title="Subtitles (Unavailable)">
                  <Subtitles size={docPipWindow ? 14 : 18} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: showSettings ? 'var(--primary-color)' : 'var(--text-primary)', cursor: 'pointer', opacity: showSettings ? 1 : 0.8, display: 'flex', alignItems: 'center', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = showSettings ? '1' : '0.8'}>
                    <Settings size={docPipWindow ? 14 : 18} />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ layout: { type: "spring", bounce: 0, duration: 0.3 }, opacity: { duration: 0.2 } }}
                        ref={settingsPanelRef}
                        style={{
                          position: 'absolute', bottom: 'calc(100% + 1.5rem)', right: -10,
                          background: 'rgba(20, 20, 25, 0.9)', backdropFilter: 'blur(12px)',
                          border: '1px solid var(--glass-border)', borderRadius: '12px',
                          padding: docPipWindow ? '0.25rem' : '0.5rem', minWidth: docPipWindow ? '140px' : '180px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                          zIndex: 999999
                        }}
                      >
                        <AnimatePresence mode={docPipWindow ? "wait" : "popLayout"} initial={false}>
                          {settingsView === 'main' ? (
                            <motion.div
                              key="main"
                              initial={{ x: '-100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ display: 'flex', flexDirection: 'column', width: 'max-content', gap: '0.25rem' }}
                            >
                                <button
                                  onClick={() => setSettingsView('skip_duration')}
                                  style={{
                                    background: 'transparent', color: 'var(--text-primary)', border: 'none', 
                                    padding: docPipWindow ? '0.35rem 0.5rem' : '0.5rem 0.75rem', borderRadius: '8px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem',
                                    fontSize: docPipWindow ? '0.7rem' : '0.8rem',
                                    transition: 'background-color 0.2s ease', 
                                    minWidth: docPipWindow ? '180px' : '240px', whiteSpace: 'nowrap'
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
                              
                              <button
                                  onClick={() => setSettingsView('playback_speed')}
                                  style={{
                                    background: 'transparent', color: 'var(--text-primary)', border: 'none', 
                                    padding: docPipWindow ? '0.35rem 0.5rem' : '0.5rem 0.75rem', borderRadius: '8px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem',
                                    fontSize: docPipWindow ? '0.7rem' : '0.8rem',
                                    transition: 'background-color 0.2s ease', 
                                    minWidth: docPipWindow ? '180px' : '240px', whiteSpace: 'nowrap'
                                  }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <span style={{ transform: 'translateY(1px)' }}>Playback Speed</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                  <span style={{ transform: 'translateY(1px)' }}>{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                                  <ChevronRight size={14} />
                                </div>
                              </button>
                            </motion.div>
                          ) : settingsView === 'skip_duration' ? (
                            <motion.div
                              key="skip"
                              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: 'max-content' }}
                            >
                              <button
                                onClick={() => setSettingsView('main')}
                                style={{
                                  background: 'transparent', color: 'var(--text-secondary)', border: 'none', 
                                  padding: docPipWindow ? '0.35rem 0.5rem' : '0.5rem 0.75rem', borderRadius: '8px',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                  fontSize: docPipWindow ? '0.7rem' : '0.8rem', marginBottom: '0.25rem',
                                  transition: 'color 0.2s ease', whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <ChevronLeft size={14} />
                                <span style={{ transform: 'translateY(1px)' }}>Skip Duration</span>
                              </button>
                              
                              <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }} />
                              
                              <div className="settings-options-grid">
                                {[5, 10, 15, 30].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => { setJumpStep(val); Cache.saveSettings({ jumpStep: val }); setSettingsView('main'); setShowSettings(false); }}
                                    style={{
                                      background: jumpStep === val ? 'var(--primary-color)' : 'transparent',
                                      color: jumpStep === val ? '#fff' : 'var(--text-primary)',
                                      border: 'none', padding: docPipWindow ? '0.35rem 0.5rem' : '0.5rem 0.75rem', borderRadius: '8px',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                      fontSize: docPipWindow ? '0.7rem' : '0.8rem',
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
                          ) : (
                            <motion.div
                              key="speed"
                              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: 'max-content' }}
                            >
                              <button
                                onClick={() => setSettingsView('main')}
                                style={{
                                  background: 'transparent', color: 'var(--text-secondary)', border: 'none', 
                                  padding: docPipWindow ? '0.35rem 0.5rem' : '0.5rem 0.75rem', borderRadius: '8px',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                  fontSize: docPipWindow ? '0.7rem' : '0.8rem', marginBottom: '0.25rem',
                                  transition: 'color 0.2s ease', whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <ChevronLeft size={14} />
                                <span style={{ transform: 'translateY(1px)' }}>Playback Speed</span>
                              </button>
                              
                              <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }} />
                              
                              <div className="settings-options-grid">
                                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => { 
                                      setPlaybackSpeed(val); 
                                      if (videoRef.current) videoRef.current.playbackRate = val;
                                      Cache.saveSettings({ playbackSpeed: val }); 
                                      setSettingsView('main'); 
                                      setShowSettings(false); 
                                    }}
                                    style={{
                                      background: playbackSpeed === val ? 'var(--primary-color)' : 'transparent',
                                      color: playbackSpeed === val ? '#fff' : 'var(--text-primary)',
                                      border: 'none', padding: docPipWindow ? '0.35rem 0.5rem' : '0.5rem 0.75rem', borderRadius: '8px',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                      fontSize: docPipWindow ? '0.7rem' : '0.8rem',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { if (playbackSpeed !== val) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    onMouseLeave={(e) => { if (playbackSpeed !== val) e.currentTarget.style.background = 'transparent' }}
                                  >
                                    <span style={{ transform: 'translateY(1px)' }}>{val === 1 ? 'Normal' : `${val}x`}</span>
                                    {playbackSpeed === val && <Check size={14} />}
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
                <button onClick={togglePiP} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'} title={(docPipWindow || isPiP) ? "Restore Player" : "Picture in Picture"}>
                  {(docPipWindow || isPiP) ? <PictureInPicture2 size={docPipWindow ? 14 : 18} /> : <PictureInPicture size={docPipWindow ? 14 : 18} />}
                </button>
                <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'} title="Fullscreen">
                  <Maximize size={docPipWindow ? 14 : 18} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </motion.div>
  );

  if (docPipWindow) {
    return (
      <>
        {createPortal(content, docPipWindow.document.getElementById('pip-root')!)}
        {isPlayerRoute && (
          <div 
            onClick={(e) => {
              // don't toggle if they clicked a button
              if ((e.target as HTMLElement).closest('button')) return;
              togglePlay();
            }}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg-dark)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <div style={{ padding: '1.5rem', position: 'absolute', top: 0, left: 0 }}>
              <button onClick={() => navigate('/library')} className="liquid-button" style={{ padding: '0.75rem 1.5rem' }}>
                <ArrowLeft size={20} />
                <span style={{ transform: 'translateY(1.5px)' }}>Back to Dashboard</span>
              </button>
            </div>
            {isPlaying ? <PictureInPicture size={64} style={{ opacity: 0.5, marginBottom: '1rem', color: 'var(--text-secondary)' }} /> : <Pause size={64} style={{ opacity: 0.5, marginBottom: '1rem', color: 'var(--text-secondary)' }} />}
            <h2 style={{ marginBottom: '2rem', color: 'var(--text-secondary)', transition: 'color 0.3s ease' }}>{isPlaying ? "Playing in Custom Picture-in-Picture" : "Paused in Custom Picture-in-Picture"}</h2>
            <button 
              className="liquid-button active-liquid-glass"
              style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => (window as any).documentPictureInPicture.window?.close()}
            >
              <Maximize size={20} />
              <span style={{ transform: 'translateY(1.5px)' }}>Restore Player</span>
            </button>
          </div>
        )}
      </>
    );
  }

  return content;
}
