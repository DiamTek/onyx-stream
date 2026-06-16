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

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Trash2, Database, Info } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'storage'>('general');
  const [showInfo, setShowInfo] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearStatus, setClearStatus] = useState<'idle' | 'clearing' | 'cleared' | 'failed'>('idle');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <SettingsIcon size={32} color="var(--primary-color)" />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: 'inherit', marginTop: '5px' }}>Settings</h1>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'general' ? 'var(--primary-alpha-20)' : 'var(--glass-bg)',
            border: `1px solid ${activeTab === 'general' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
            color: activeTab === 'general' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <SettingsIcon size={18} />
          <span style={{ position: 'relative', top: '1.5px' }}>General</span>
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'storage' ? 'var(--primary-alpha-20)' : 'var(--glass-bg)',
            border: `1px solid ${activeTab === 'storage' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
            color: activeTab === 'storage' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Database size={18} />
          <span style={{ position: 'relative', top: '1.5px' }}>Storage</span>
        </button>
      </div>

      <div className="liquid-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ textAlign: 'center' }}
            >
              <SettingsIcon size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Configuration Panel</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                This section is currently under construction. Future updates will include custom TMDB API keys, subtitle preferences, and library folder management.
              </p>
            </motion.div>
          )}

          {activeTab === 'storage' && (
            <motion.div
              key="storage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Database size={24} color="var(--primary-color)" />
                <span style={{ position: 'relative', top: '2px' }}>Storage Management</span>
              </h2>

              <div style={{ background: 'var(--bg-dark-alpha-70)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div className="settings-storage-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}><span style={{ position: 'relative', top: '1.5px' }}>TMDB Metadata Cache</span></h3>
                    <div
                      style={{ position: 'relative', cursor: 'pointer', display: 'flex' }}
                      onMouseEnter={() => setShowInfo(true)}
                      onMouseLeave={() => setShowInfo(false)}
                    >
                      <Info size={18} color="var(--text-secondary)" />
                      <AnimatePresence>
                        {showInfo && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="settings-info-tooltip"
                          >
                            The app permanently caches TMDB data (posters, banners, descriptions) to reduce API calls. If the data gets corrupted or you want to force a fresh fetch, you can clear the cache here.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowClearModal(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--error-alpha-10)',
                      border: '1px solid var(--error-alpha-20)',
                      color: 'var(--error-color)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'var(--transition)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '175px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--error-color)';
                      e.currentTarget.style.color = 'var(--white)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--error-alpha-10)';
                      e.currentTarget.style.color = 'var(--error-color)';
                    }}
                  >
                    <Trash2 size={18} style={{ flexShrink: 0 }} />
                    <span style={{ position: 'relative', top: '1px' }}>Clear Cache</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clear Cache Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {showClearModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'var(--black-70)',
                zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '1.5rem',
                paddingTop: '8vh',
                transform: 'translateZ(0)',
                overflowY: 'auto',
                overscrollBehavior: 'contain'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget && clearStatus === 'idle') setShowClearModal(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  borderRadius: '24px',
                  padding: '2.5rem',
                  width: '100%',
                  maxWidth: '480px',
                  color: 'white',
                  willChange: 'transform',
                  backgroundColor: 'var(--black-65)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                }}
              >
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%' }}>
                  <Trash2 size={24} color="var(--error-color)" />
                  <span style={{ marginTop: '4px' }}>Clear Cache</span>
                </h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                  Are you sure you want to permanently clear the <strong style={{ color: 'white' }}>TMDB Metadata Cache</strong>? This action cannot be undone.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                  <button
                    onClick={() => {
                      if (clearStatus === 'idle') setShowClearModal(false);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem', background: 'var(--white-5)', border: '1px solid var(--glass-border)',
                      color: 'white', flex: 1, borderRadius: '12px', cursor: 'pointer', fontWeight: '600', transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--white-10)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--white-5)'}
                  >
                    <span style={{ display: 'inline-block', marginTop: '2px' }}>Cancel</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (clearStatus !== 'idle') return;
                      setClearStatus('clearing');
                      try {
                        const res = await fetch('http://localhost:4000/api/admin/clear-cache', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        if (res.ok) {
                          setClearStatus('cleared');
                          setTimeout(() => {
                            setShowClearModal(false);
                            setClearStatus('idle');
                          }, 1500);
                        } else throw new Error();
                      } catch {
                        setClearStatus('failed');
                        setTimeout(() => setClearStatus('idle'), 1500);
                      }
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: clearStatus === 'cleared' ? 'var(--success-alpha-15)' : 'var(--error-alpha-10)',
                      border: `1px solid ${clearStatus === 'cleared' ? 'var(--success-color)' : 'var(--error-alpha-20)'}`,
                      color: clearStatus === 'cleared' ? 'var(--success-color)' : 'var(--error-color)',
                      flex: 1, borderRadius: '12px', cursor: clearStatus === 'idle' ? 'pointer' : 'default', fontWeight: '600', transition: 'var(--transition)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (clearStatus === 'idle') {
                        e.currentTarget.style.background = 'var(--error-color)';
                        e.currentTarget.style.color = 'var(--white)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (clearStatus === 'idle') {
                        e.currentTarget.style.background = 'var(--error-alpha-10)';
                        e.currentTarget.style.color = 'var(--error-color)';
                      }
                    }}
                  >
                    <span style={{ display: 'inline-block', marginTop: '2px' }}>
                      {clearStatus === 'idle' ? 'Confirm Clear' : clearStatus === 'clearing' ? 'Clearing...' : clearStatus === 'cleared' ? 'Cache Cleared!' : 'Failed'}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}