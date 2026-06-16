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
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, RefreshCw, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Movie {
  id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  plot: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Scroll optimization
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const handleScrollOptimization = () => {
    if (scrollContainerRef.current) {
      // Prevent scroll-hover paint storms
      scrollContainerRef.current.style.pointerEvents = 'none';
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.style.pointerEvents = 'auto';
      }, 150);
    }
  };

  // Toggle overlay on Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const [localMovies, setLocalMovies] = useState<Record<number, string>>({});

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const fetchLocal = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:4000/api/movies', { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            const map: Record<number, string> = {};
            data.forEach((m: { id: number; filename: string }) => { if (m.id) map[m.id] = m.filename; });
            setLocalMovies(map);
          }
        } catch { /* ignore */ }
      };
      fetchLocal();

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = '';
          inputRef.current.focus();
        }
      }, 100);

      document.body.classList.add('search-open'); // Toggle scrollbar visibility via CSS
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setQuery('');
      document.body.classList.remove('search-open');
    }

    return () => {
      document.body.classList.remove('search-open');
    };
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    const trimmedQuery = q.trim();
    if (!trimmedQuery) {
      setResults([]);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      return;
    }

    setLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce
  };

  const handleSelectMovie = (movie: Movie) => {
    setIsOpen(false);
    // Defer navigation until fade-out completes
    setTimeout(() => {
      if (localMovies[movie.id]) {
        navigate(`/player/${encodeURIComponent(localMovies[movie.id])}`);
      } else {
        navigate(`/movie/${movie.id}`, { state: { movie } });
      }
    }, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '10vh',
            willChange: 'opacity',
            transform: 'translateZ(0)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            backgroundColor: 'var(--black-70)'
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="liquid-button"
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <X size={24} />
          </button>

          {/* Search Panel */}
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            className="liquid-panel"
            style={{
              width: '90%',
              maxWidth: '800px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              padding: '1.5rem',
              backgroundColor: 'var(--black-65)' // Dark tint for contrast
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              background: 'var(--white-5)',
              borderRadius: '16px',
              border: '1px solid var(--white-10)'
            }}>
              <Search size={28} color="var(--primary-color)" />
              <input
                ref={inputRef}
                type="text"
                defaultValue=""
                onChange={handleSearchChange}
                placeholder="Search TMDB for any movie..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  lineHeight: '1',
                  padding: '1rem',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transform: 'translateY(3px)'
                }}
              />
              {loading && (
                <div style={{ padding: '0.5rem' }}>
                  <RefreshCw className="spin" size={24} color="var(--primary-color)" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {(results.length > 0 || (query.trim() && !loading)) && (
              <div
                ref={scrollContainerRef}
                onScroll={handleScrollOptimization}
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                  {results.map((movie, index) => (
                    <div
                      key={movie.id}
                      onClick={() => handleSelectMovie(movie)}
                      className="search-result-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        background: movie.backdrop_url
                          ? `linear-gradient(to right, var(--black-80) 0%, var(--black-40) 100%), url("${movie.backdrop_url}") center / cover`
                          : 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        padding: '1rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        animation: `fadeIn 0.3s ease forwards`,
                        animationDelay: `${index * 0.05}s`,
                        opacity: 0 // Start hidden for the fade-in animation
                      }}
                    >
                      {/* Poster */}
                      <div style={{
                        width: '60px',
                        aspectRatio: '2/3',
                        background: 'var(--glass-highlight)',
                        borderRadius: '8px',
                        backgroundImage: movie.poster_url ? `url(${movie.poster_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {!movie.poster_url && <Film size={20} opacity={0.5} color="white" />}
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{movie.title}</h3>
                          {localMovies[movie.id] && (
                            <span style={{
                              background: 'var(--primary-color)', color: 'white',
                              fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem',
                              borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.25rem',
                              boxShadow: '0 2px 8px var(--primary-alpha-40)'
                            }}>
                              <Play size={12} fill="white" /> Watch Now
                            </span>
                          )}
                        </div>
                        <p style={{
                          fontSize: '0.9rem', color: 'var(--text-secondary)',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {movie.plot}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {!loading && query.trim() && results.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                    No movies found matching "{query}"
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}