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

import { useState, useRef, useEffect } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login({ setAuth }: { setAuth: (val: boolean) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofill can happen slightly after mount
    const timer = setTimeout(() => {
      if (inputRef.current && inputRef.current.value) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('token', token);
        setAuth(true);
      } else {
        setError('Invalid master password.');
      }
    } catch {
      setError('Cannot connect to server.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '0 1.5rem', boxSizing: 'border-box' }}
    >
      <div className="liquid-panel" style={{ padding: 'clamp(1.5rem, 5vw, 3rem)', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', boxSizing: 'border-box' }} >
        <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '50%', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 1px 0 var(--glass-highlight)' }}>
          <Lock size={36} color="var(--primary-color)" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Onyx Stream</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enter the master password to access your library.</p>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>
          <input
            ref={inputRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={(e) => {
              const target = e.currentTarget;
              setTimeout(() => {
                const len = target.value.length;
                target.setSelectionRange(len, len);
              }, 50);
            }}
            className="liquid-input"
          />
          {error && <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className="liquid-button">
            <LogIn size={20} />
            Connect
          </button>
        </form>
      </div>
    </motion.div>
  );
}