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
import { useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { Film, Compass, Settings, LogOut, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ setAuth }: { setAuth: (val: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();

  const [showFooter, setShowFooter] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowFooter(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
  };

  const navItems = [
    { name: 'My Library', path: '/library', icon: Film },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient Background Flares */}
      <div style={{ position: 'absolute', top: '10vh', left: '10vw', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none', transform: 'translateZ(0)' }} />
      <div style={{ position: 'absolute', top: '60vh', right: '10vw', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none', transform: 'translateZ(0)' }} />

      {/* Floating Pill Sidebar */}
      <motion.aside 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="liquid-panel sidebar-panel"
        style={{
          width: '290px',
          margin: '1.5rem',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          zIndex: 10,
          border: '1px solid var(--glass-border)',
          boxShadow: '0 24px 48px -12px var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)'
        }}
      >
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '4rem', cursor: 'pointer', padding: '0 0.5rem' }} onClick={() => navigate('/')}>
          <Disc size={32} color="var(--primary-color)" style={{ flexShrink: 0 }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: 'inherit', whiteSpace: 'nowrap', color: '#fff', transform: 'translateY(2px)' }}>Onyx Stream</h1>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button

                key={item.name}
                onClick={() => navigate(item.path)}
                className={`sidebar-nav-item ${isActive ? 'active-liquid-glass' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem', borderRadius: '16px', border: 'none',
                  background: 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'left', fontWeight: isActive ? '600' : '400',
                  transition: 'var(--transition)'
                }}
              >
                <Icon size={20} className="sidebar-nav-icon" />
                <span style={{ transform: 'translateY(1.5px)' }}>{item.name}</span>
              </button>
            );
          })}

          <button 
            onClick={handleLogout}
            className="sidebar-nav-item logout-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem', borderRadius: '16px', border: 'none',
              background: 'var(--btn-bg)',
              color: 'var(--error-color)',
              cursor: 'pointer', textAlign: 'left',
              marginTop: 'auto',
              transition: 'var(--transition)'
            }}
          >
            <LogOut size={20} className="sidebar-nav-icon" />
            <span style={{ transform: 'translateY(1.5px)' }}>Sign Out</span>
          </button>
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', overflowX: 'hidden', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="main-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        {showFooter && (
          <footer style={{
            padding: '2rem', textAlign: 'center',
            color: 'var(--text-secondary)', fontSize: '0.85rem',
            animation: 'fadeIn 0.5s ease forwards'
          }}>
            © 2026 DiamTek / Alexéy Shishkin
          </footer>
        )}
      </main>
    </div>
  );
}