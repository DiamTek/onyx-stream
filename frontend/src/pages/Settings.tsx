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
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: 'inherit', marginTop: '5px' }}>Settings</h1>
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