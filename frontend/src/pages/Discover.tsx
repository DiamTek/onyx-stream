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
import { Compass, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Movie {
  id: number;
  title: string;
  poster_url: string | null;
  plot: string;
}



export default function Discover() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchDiscover = async () => {
    try {
      const token = localStorage.getItem('token');
      const resDiscover = await fetch('http://localhost:4000/api/discover', { headers: { 'Authorization': `Bearer ${token}` } });

      if (resDiscover.ok) {
        const data = await resDiscover.json();
        setMovies(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDiscover();
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
        <Compass size={28} color="var(--primary-color)" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>Discover & Request</h1>
      </header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem' }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '12px' }} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem' }}>
            {movies.map((m) => (
              <div
                key={m.id}
                className="liquid-panel"
                style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  backgroundImage: m.poster_url ? `url(${m.poster_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: 'var(--glass-bg)',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  navigate(`/movie/${m.id}`, { state: { movie: m } });
                }}
                onMouseEnter={(e) => {
                  if (window.matchMedia('(hover: none)').matches) return;
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 30px 60px -15px var(--black-60), 0 0 20px var(--primary-alpha-25), inset 0 0 0 1px var(--primary-alpha-30)';
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
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.title}</h3>
                  </div>
                )}

                <div
                  className="hover-overlay"
                  style={{
                    position: 'absolute', inset: '-1px', background: 'var(--black-85)',
                    borderRadius: 'inherit',
                    opacity: 0, transition: 'opacity 0.3s ease', display: 'flex', flexDirection: 'column',
                    padding: '1.5rem', justifyContent: 'flex-end'
                  }}
                >
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--black-80)', padding: '0.75rem 1.25rem', borderRadius: '30px', border: '1px solid var(--white-15)' }}>
                      <span style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem', letterSpacing: '0.05em' }}>View Details</span>
                      <ArrowUpRight size={18} color="white" />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--white)', textShadow: '0 2px 8px var(--black-80)' }}>{m.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--white-85)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 4px var(--black-80)', lineHeight: '1.4' }}>
                    {m.plot}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}