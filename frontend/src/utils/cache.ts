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

export const Cache = {
  // Video Progress
  saveVideoProgress: (filename: string, time: number, duration: number) => {
    try {
      localStorage.setItem(`progress_${filename}`, JSON.stringify({ time, duration }));
      window.dispatchEvent(new CustomEvent('videoProgressUpdated', { detail: { filename, time, duration } }));
    } catch (e) {
      console.warn('Failed to save video progress to cache', e);
    }
  },

  getVideoProgress: (filename: string): { time: number, duration: number } | null => {
    try {
      const saved = localStorage.getItem(`progress_${filename}`);
      if (!saved) return null;
      if (!saved.startsWith('{')) {
        return { time: parseFloat(saved), duration: 0 };
      }
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read video progress from cache', e);
      return null;
    }
  },

  // Video Ended State
  markVideoEnded: (filename: string) => {
    try {
      localStorage.setItem(`ended_${filename}`, 'true');
    } catch (e) {
      console.warn('Failed to save video ended state to cache', e);
    }
  },

  isVideoEnded: (filename: string): boolean => {
    try {
      return localStorage.getItem(`ended_${filename}`) === 'true';
    } catch (e) {
      console.warn('Failed to read video ended state from cache', e);
      return false;
    }
  },

  clearVideoEnded: (filename: string) => {
    try {
      localStorage.removeItem(`ended_${filename}`);
    } catch (e) {
      console.warn('Failed to clear video ended state from cache', e);
    }
  },

  // Global Settings
  saveSettings: (settings: { jumpStep?: number, volume?: number, isMuted?: boolean, playbackSpeed?: number }) => {
    try {
      const existing = Cache.getSettings();
      localStorage.setItem('player_settings', JSON.stringify({ ...existing, ...settings }));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  },

  getSettings: (): { jumpStep: number, volume: number, isMuted: boolean, playbackSpeed: number } => {
    try {
      const saved = localStorage.getItem('player_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Default playbackSpeed to 1 if not present in legacy cache
        if (parsed.playbackSpeed === undefined) parsed.playbackSpeed = 1;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to read settings', e);
    }
    return { jumpStep: 5, volume: 1, isMuted: false, playbackSpeed: 1 };
  }
};
