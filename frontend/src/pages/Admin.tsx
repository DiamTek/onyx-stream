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
import { createPortal } from 'react-dom';
import { Shield, Trash2, Check, Clock, Upload, X, Film, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieRequest {
  id: number;
  title: string;
  requestedBy: string;
  date: string;
}

export default function Admin() {
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Wizard State
  const [uploadingRequest, setUploadingRequest] = useState<MovieRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingProgress, setUploadingProgress] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [introEnd, setIntroEnd] = useState('');
  const [outroStart, setOutroStart] = useState('');
  const [dismissingRequest, setDismissingRequest] = useState<MovieRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startUpload = (req: MovieRequest) => {
    setUploadingRequest(req);
    setSelectedFile(null);
    setIntroEnd('');
    setOutroStart('');
    setUploadingProgress(false);
    setUploadSuccess(false);
  };

  const closeUpload = () => {
    setUploadingRequest(null);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (uploadingRequest || dismissingRequest) {
      document.body.classList.add('search-open');
    } else {
      document.body.classList.remove('search-open');
    }
    return () => document.body.classList.remove('search-open');
  }, [uploadingRequest, dismissingRequest]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const confirmUpload = async () => {
    if (!selectedFile || !uploadingRequest) return;
    setUploadingProgress(true);

    const token = localStorage.getItem('token');
    const ext = selectedFile.name.includes('.') ? selectedFile.name.substring(selectedFile.name.lastIndexOf('.')) : '.mp4';
    const computedFilename = `${uploadingRequest.title}${ext}`;

    const formData = new FormData();
    formData.append('filename', computedFilename);
    formData.append('requestId', uploadingRequest.id.toString());
    if (introEnd) formData.append('introEnd', introEnd);
    if (outroStart) formData.append('outroStart', outroStart);
    formData.append('movie', selectedFile);

    try {
      const res = await fetch('http://localhost:4000/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          closeUpload();
          fetchRequests(); // Refresh list to remove fulfilled request
        }, 2000);
      } else {
        alert('Upload failed.');
        setUploadingProgress(false);
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Upload error.');
      setUploadingProgress(false);
    }
  };

  const deleteRequest = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, []);
  useEffect(() => {
    if (uploadingRequest) {
      document.body.classList.add('search-open');
    } else {
      document.body.classList.remove('search-open');
    }
    return () => document.body.classList.remove('search-open');
  }, [uploadingRequest]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
        <Shield size={28} color="var(--primary-color)" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>Admin Dashboard</h1>
      </header>

      <div className="liquid-panel" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
          <Clock size={20} color="var(--text-secondary)" />
          <span style={{ marginTop: '3px' }}>Pending Movie Requests</span>
          <span style={{ marginLeft: 'auto', background: 'var(--primary-alpha-40)', color: 'var(--primary-color)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', transform: 'translateY(-1.5px)' }}>
            <span style={{ display: 'inline-block', transform: 'translate(1px, 2px)' }}>{requests.length}</span>
          </span>
        </h2>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Check size={48} color="var(--success-color)" style={{ opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>You're all caught up! No pending requests.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
              {requests.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    background: 'var(--white-2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--white-5)';
                    e.currentTarget.style.borderColor = 'var(--white-10)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--white-2)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--white)' }}>{req.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Requested by <span style={{ color: 'var(--white)' }}>{req.requestedBy}</span> on {new Date(req.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => startUpload(req)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1rem', borderRadius: '12px',
                        background: 'var(--primary-alpha-10)',
                        color: 'var(--primary-color)', border: '1px solid var(--primary-alpha-20)',
                        fontWeight: '600', cursor: 'pointer', transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-color)';
                        e.currentTarget.style.color = 'var(--white)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--primary-alpha-10)';
                        e.currentTarget.style.color = 'var(--primary-color)';
                      }}
                    >
                      <Upload size={18} />
                      <span style={{ transform: 'translateY(1px)' }}>Upload Movie</span>
                    </button>
                    <button
                      onClick={() => setDismissingRequest(req)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1rem', borderRadius: '12px',
                        background: 'var(--error-alpha-10)',
                        color: 'var(--error-color)', border: '1px solid var(--error-alpha-20)',
                        fontWeight: '600', cursor: 'pointer', transition: 'var(--transition)'
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
                      <Trash2 size={18} />
                      <span style={{ transform: 'translateY(1px)' }}>Dismiss</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Wizard Modal */}
      {createPortal(
        <AnimatePresence>
          {uploadingRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="liquid-panel"
                style={{
                  width: '100%', maxWidth: '500px', padding: '2rem',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center',
                  willChange: 'transform, opacity',
                  backgroundColor: 'var(--black-65)'
                }}
              >
                <button
                  onClick={closeUpload}
                  className="liquid-button"
                  style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                    borderRadius: '50%', width: '40px', height: '40px', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--white)', width: '100%' }}>
                  <Upload size={24} color="var(--primary-color)" />
                  <span style={{ marginTop: '3px' }}>Upload Movie</span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Fulfilling request for:</p>
                  <div style={{ padding: '1rem', background: 'var(--white-5)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: '100%' }}>
                    <Film size={20} color="var(--primary-color)" />
                    <span style={{ fontWeight: '600', color: 'var(--white)', fontSize: '1.1rem', marginTop: '3px' }}>{uploadingRequest.title}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Select Video File</label>
                  <input
                    type="file"
                    accept="video/mp4,video/x-mkv,video/webm"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--primary-alpha-40)',
                      borderRadius: '16px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                      background: 'var(--primary-alpha-5)',
                      transition: 'var(--transition)',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-alpha-10)';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary-alpha-5)';
                      e.currentTarget.style.borderColor = 'var(--primary-alpha-40)';
                    }}
                  >
                    {selectedFile ? (
                      <>
                        <Check size={32} color="var(--success-color)" />
                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', marginTop: '3px' }}>{selectedFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} color="var(--primary-color)" />
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '3px' }}>Click to browse or drag file here</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>MP4, MKV, or WEBM</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Intro End (Seconds)</label>
                    <input
                      type="number"
                      className="liquid-input"
                      placeholder="e.g. 120"
                      value={introEnd}
                      onChange={(e) => setIntroEnd(e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Outro Start (Seconds)</label>
                    <input
                      type="number"
                      className="liquid-input"
                      placeholder="e.g. 3600"
                      value={outroStart}
                      onChange={(e) => setOutroStart(e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                  </div>
                </div>

                <button
                  onClick={confirmUpload}
                  disabled={!selectedFile || uploadingProgress || uploadSuccess}
                  className={`liquid-button ${!uploadSuccess ? 'active-liquid-glass' : ''}`}
                  style={{
                    width: '100%',
                    opacity: selectedFile ? 1 : 0.5,
                    pointerEvents: (!selectedFile || uploadingProgress || uploadSuccess) ? 'none' : 'auto',
                    ...(uploadSuccess ? { background: 'var(--success-alpha-20)', borderColor: 'var(--success-alpha-25)' } : {})
                  }}
                >
                  {uploadSuccess ? (
                    <><Check size={20} /> <span style={{ marginTop: '2px' }}>Upload Complete!</span></>
                  ) : uploadingProgress ? (
                    <span style={{ marginTop: '2px' }}>Uploading...</span>
                  ) : (
                    <><Save size={20} /> <span style={{ marginTop: '2px' }}>Upload Movie</span></>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Dismiss Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {dismissingRequest && (
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
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="liquid-panel"
                style={{
                  padding: '2.5rem',
                  width: '100%',
                  maxWidth: '480px',
                  color: 'white',
                  willChange: 'transform',
                  backgroundColor: 'var(--black-65)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                }}
              >
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%' }}>
                  <Trash2 size={24} color="var(--error-color)" />
                  <span style={{ marginTop: '4px' }}>Dismiss Request</span>
                </h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                  Are you sure you want to permanently dismiss the request for <strong style={{ color: 'white' }}>{dismissingRequest.title}</strong>? This action cannot be undone.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                  <button
                    onClick={() => setDismissingRequest(null)}
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
                    onClick={() => {
                      deleteRequest(dismissingRequest.id);
                      setDismissingRequest(null);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem', background: 'var(--error-alpha-10)', border: '1px solid var(--error-alpha-20)',
                      color: 'var(--error-color)', flex: 1, borderRadius: '12px', cursor: 'pointer', fontWeight: '600', transition: 'var(--transition)'
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
                    <span style={{ display: 'inline-block', marginTop: '2px' }}>Confirm Dismissal</span>
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