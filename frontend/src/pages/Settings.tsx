import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <SettingsIcon size={32} color="var(--primary-color)" />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: 'inherit' }}>Settings</h1>
      </header>

      <div className="liquid-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <SettingsIcon size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Configuration Panel</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          This section is currently under construction. Future updates will include custom TMDB API keys, subtitle preferences, and library folder management.
        </p>
      </div>
    </motion.div>
  );
}