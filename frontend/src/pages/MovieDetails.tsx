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
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, ArrowLeft, Film, Play } from 'lucide-react';
import { applyThemeFromImage, resetTheme } from '../utils/color';

export default function MovieDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;

  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localFilename, setLocalFilename] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocal = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch local movies
        const resMovies = await fetch('http://localhost:4000/api/movies', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resMovies.ok) {
          const data = await resMovies.json();
          const match = data.find((m: { id: number; filename: string }) => m.id === movie?.id);
          if (match) setLocalFilename(match.filename);
        }

        // Fetch requests to see if already requested
        const resReqs = await fetch('http://localhost:4000/api/requests', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resReqs.ok) {
          const reqs = await resReqs.json();
          const isRequested = reqs.some((r: { id: number }) => r.id === movie?.id);
          if (isRequested) setRequested(true);
        }
      } catch { /* ignore */ }
    };
    if (movie?.id) fetchLocal();
  }, [movie?.id]);

  useEffect(() => {
    if (movie?.poster_url) {
      applyThemeFromImage(movie.poster_url);
    }
    return () => {
      resetTheme();
    };
  }, [movie]);

  if (!movie) {
    return (
      <div style={{ padding: '2rem', color: 'white' }}>
        <h2>Movie not found</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', marginTop: '1rem', background: 'var(--btn-bg)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  const requestMovie = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: movie.id, title: movie.title })
      });
      if (response.ok) {
        setRequested(true);
      }
    } catch (err) {
      console.error('Request failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '100%',
        color: 'white'
      }}
    >
      <style>{`
        .movie-details-content {
          gap: 4rem;
        }
        .movie-poster {
          width: 300px;
        }
        .request-btn {
          width: auto;
          justify-content: center;
        }
        .details-column {
          gap: 2rem;
        }
        .movie-title-block {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        @media (max-width: 768px) {
          .movie-details-content {
            gap: 2.5rem !important;
            flex-direction: column !important;
          }
          .details-column {
            gap: 1.5rem !important;
          }
          .movie-title-block {
            text-align: center;
            align-items: center;
          }
          .movie-poster {
            width: 100% !important;
            max-width: 400px;
            margin: 0 auto;
          }
          .request-btn {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'relative', zIndex: 10,
          background: 'var(--white-5)', border: '1px solid var(--glass-border)',
          borderRadius: '50%', width: '48px', height: '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
          transition: 'all 0.2s',
          marginBottom: '2rem'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--white-10)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--white-5)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <ArrowLeft size={24} />
      </button>

      {/* Content */}
      <div className="movie-details-content" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Poster */}
        <div className="movie-poster" style={{
          flexShrink: 0,
          aspectRatio: '2/3',
          backgroundImage: movie.poster_url ? `url(${movie.poster_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'var(--glass-bg)',
          borderRadius: '16px',
          boxShadow: '0 30px 60px var(--black-60), inset 0 1px 0 var(--white-10)',
          border: '1px solid var(--glass-border)'
        }}>
          {!movie.poster_url && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={64} opacity={0.3} />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="details-column" style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="movie-title-block">
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 'bold', lineHeight: '1.1', textShadow: '0 4px 12px var(--black-50)', marginBottom: '0.5rem' }}>
              {movie.title}
            </h1>
          </div>

          <div style={{
            fontSize: '1.15rem', lineHeight: '1.8', color: 'var(--white-85)',
            maxWidth: '800px', textShadow: '0 1px 2px var(--black-50)',
            background: 'var(--bg-dark-alpha-70)', padding: '2rem', borderRadius: '16px',
            border: '1px solid var(--glass-border)'
          }}>
            {movie.plot || "No description available."}
          </div>

          <div style={{ marginTop: '1rem', minHeight: '56px', display: 'flex', alignItems: 'center' }}>
            <AnimatePresence mode="wait">
              {localFilename ? (
                <motion.button
                  key="watch"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="request-btn active-liquid-glass"
                  onClick={() => navigate(`/player/${encodeURIComponent(localFilename)}`)}
                  style={{
                    padding: '1rem 2.5rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 8px 16px var(--primary-alpha-35)',
                    transition: 'box-shadow 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px var(--primary-alpha-40)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 16px var(--primary-alpha-35)';
                  }}
                >
                  <Play size={20} fill="white" />
                  Watch Now
                </motion.button>
              ) : requested ? (
                <motion.div
                  key="requested"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="request-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2.5rem',
                    background: 'var(--success-alpha-15)',
                    border: '1px solid var(--success-alpha-30)',
                    borderRadius: '12px',
                    color: 'var(--success-color)',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: 'none'
                  }}
                >
                  <CheckCircle size={20} />
                  <span style={{ marginTop: '3px' }}>Request Sent</span>
                </motion.div>
              ) : (
                <motion.button
                  key="request"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="request-btn"
                  onClick={requestMovie}
                  disabled={loading}
                  style={{
                    padding: '1rem 2.5rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: 'white',
                    background: 'var(--primary-color)',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 8px 16px var(--primary-alpha-35)',
                    transition: 'box-shadow 0.2s, transform 0.2s, opacity 0.2s',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px var(--primary-alpha-40)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 16px var(--primary-alpha-35)';
                    }
                  }}
                >
                  <Download size={20} />
                  {loading ? 'Requesting...' : 'Request Movie'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </motion.div>
  );
}