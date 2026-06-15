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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Play, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cache } from '../utils/cache';

interface Movie {
  filename: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  plot: string;
  genres: string[];
}



export default function Dashboard() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [, setForceRender] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleProgress = () => setForceRender(prev => prev + 1);
    window.addEventListener('videoProgressUpdated', handleProgress);
    return () => window.removeEventListener('videoProgressUpdated', handleProgress);
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/movies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMovies(data);
        const moviesWithBackdrops = data.filter((m: Movie) => m.backdrop_url);
        if (moviesWithBackdrops.length > 0) {
          setHeroMovie(moviesWithBackdrops[Math.floor(Math.random() * moviesWithBackdrops.length)]);
        } else if (data.length > 0) {
          setHeroMovie(data[0]);
        }
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group movies by genre
  const moviesByGenre = movies.reduce((acc, movie) => {
    movie.genres.forEach(g => {
      if (!acc[g]) acc[g] = [];
      acc[g].push(movie);
    });
    return acc;
  }, {} as Record<string, Movie[]>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Film size={28} color="var(--primary-color)" />
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            letterSpacing: 'inherit',
            background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: '5px'
          }}>Ready to Watch</h1>
        </div>
        <button onClick={fetchMovies} className="liquid-button" style={{ padding: '0.75rem 1.5rem' }}>
          <RefreshCw size={20} className={loading ? "spin" : ""} />
          <span style={{ transform: 'translateY(1.5px)' }}>Refresh Library</span>
        </button>
      </header>

      <AnimatePresence mode="wait">
        {loading && movies.length === 0 ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: '100%' }}>
            {/* Skeleton Hero */}
            <div className="skeleton" style={{ width: '100%', height: '50vh', minHeight: '400px', borderRadius: '24px' }} />
            {/* Skeleton Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {[1, 2].map(row => (
                <div key={row}>
                  <div className="skeleton" style={{ width: '150px', height: '24px', borderRadius: '8px', marginBottom: '1.5rem' }} />
                  <div style={{ display: 'flex', gap: '1.5rem', overflow: 'hidden' }}>
                    {[1, 2, 3, 4, 5].map(card => (
                      <div key={card} className="skeleton" style={{ minWidth: '280px', height: '400px', borderRadius: '20px', flexShrink: 0 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : movies.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="liquid-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Film size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>No movies found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Add some .mp4 or .mkv files to the movies folder!</p>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {/* Hero Banner */}
            {heroMovie && (
              <div
                className="hero-panel"
                style={{
                  width: '100%',
                  height: '50vh',
                  minHeight: '400px',
                  borderRadius: '24px',
                  marginBottom: '4rem',
                  position: 'relative',
                  overflow: 'hidden',
                  background: heroMovie.backdrop_url || heroMovie.poster_url
                    ? `url(${heroMovie.backdrop_url || heroMovie.poster_url}) center 20% / cover`
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%), var(--glass-bg)',
                  backgroundColor: 'var(--glass-bg)',
                  boxShadow: '0 24px 48px -12px var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--bg-dark) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }} />
                <div className="hero-panel-content" style={{ position: 'absolute', bottom: '3rem', left: '3rem', maxWidth: '600px', right: '3rem' }}>
                  <h2 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.1', textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>{heroMovie.title}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400, letterSpacing: '0.04em', marginBottom: '2rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {heroMovie.plot}
                  </p>
                  <button
                    onClick={() => navigate(`/player/${encodeURIComponent(heroMovie.filename)}`)}
                    className="liquid-button active-liquid-glass"
                    style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
                  >
                    <Play size={20} fill="currentColor" />
                    <span style={{ transform: 'translateY(1.5px)' }}>Play Now</span>
                  </button>
                </div>

                {/* Progress Bar for Hero */}
                {(() => {
                  const progressData = Cache.getVideoProgress(heroMovie.filename);
                  const isEnded = Cache.isVideoEnded(heroMovie.filename);
                  let percent = 0;
                  if (isEnded) {
                    percent = 100;
                  } else if (progressData && progressData.duration > 0) {
                    percent = (progressData.time / progressData.duration) * 100;
                  }

                  if (percent > 0) {
                    return (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '6px', background: 'rgba(255,255,255,0.1)',
                        zIndex: 10
                      }}>
                        <div style={{
                          height: '100%', width: `${percent}%`,
                          background: 'var(--primary-color)',
                          boxShadow: '0 0 15px var(--primary-color)',
                          borderRadius: '0 3px 3px 0'
                        }} />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Genre Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {Object.entries(moviesByGenre).map(([genre, genreMovies]) => (
                <div key={genre}>
                  <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.25rem',
                    marginBottom: '1.5rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.9
                  }}>
                    <div style={{ width: '4px', height: '1.2em', background: 'var(--primary-color)', marginRight: '1rem', borderRadius: '4px' }} />
                    <span style={{ transform: 'translateY(2px)' }}>{genre}</span>
                  </h3>
                  <div
                    style={genre === 'Uncategorized' ? {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '1.5rem',
                      paddingTop: '1rem',
                      paddingBottom: '2rem'
                    } : {
                      display: 'flex',
                      gap: '1.5rem',
                      overflowX: 'auto',
                      paddingTop: '2rem',
                      paddingBottom: '3rem',
                      paddingLeft: '1.5rem',
                      paddingRight: '1.5rem',
                      marginTop: '-2rem',
                      marginBottom: '-1.5rem',
                      marginLeft: '-1.5rem',
                      marginRight: '-1.5rem',
                      scrollSnapType: 'x proximity',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {genreMovies.map((m) => (
                      <div
                        key={m.filename}
                        className="movie-card"
                        style={{
                          flex: genre === 'Uncategorized' ? 'unset' : '0 0 auto',
                          width: genre === 'Uncategorized' ? '100%' : '200px',
                          scrollSnapAlign: 'start',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative',
                          aspectRatio: '2/3',
                          backgroundImage: m.poster_url ? `url(${m.poster_url})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: 'var(--glass-bg)',
                        }}
                        onClick={() => navigate(`/player/${encodeURIComponent(m.filename)}`)}
                        onMouseEnter={(e) => {
                          if (window.matchMedia('(hover: none)').matches) return;
                          e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
                          e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(0,0,0,0.6), 0 0 20px rgba(139, 92, 246, 0.25), inset 0 0 0 1px rgba(139, 92, 246, 0.3)';
                          e.currentTarget.style.zIndex = '50';
                          const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
                          if (overlay) overlay.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (window.matchMedia('(hover: none)').matches) return;
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 24px 48px -12px var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)';
                          const target = e.currentTarget;
                          setTimeout(() => { target.style.zIndex = '1' }, 400);
                          const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
                          if (overlay) overlay.style.opacity = '0';
                        }}
                      >
                        {!m.poster_url && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', background: 'var(--glass-heavy-overlay)' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{m.title}</h4>
                          </div>
                        )}

                        {/* Progress Bar */}
                        {(() => {
                          const progressData = Cache.getVideoProgress(m.filename);
                          const isEnded = Cache.isVideoEnded(m.filename);
                          let percent = 0;
                          if (isEnded) {
                            percent = 100;
                          } else if (progressData && progressData.duration > 0) {
                            percent = (progressData.time / progressData.duration) * 100;
                          }

                          if (percent > 0) {
                            return (
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                height: '4px', background: 'rgba(255,255,255,0.1)',
                                zIndex: 10
                              }}>
                                <div style={{
                                  height: '100%', width: `${percent}%`,
                                  background: 'var(--primary-color)',
                                  boxShadow: '0 0 10px var(--primary-color)',
                                  borderRadius: '0 2px 2px 0'
                                }} />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div
                          className="hover-overlay"
                          style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                            opacity: 0, transition: 'opacity 0.3s ease', display: 'flex', flexDirection: 'column',
                            padding: '1.25rem', justifyContent: 'flex-end'
                          }}
                        >
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <button style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                              <Play size={24} fill="white" color="white" />
                            </button>
                          </div>

                          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', textShadow: '0 2px 4px var(--glass-shadow)' }}>{m.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}