export const Cache = {
  // Video Progress
  saveVideoProgress: (filename: string, time: number) => {
    try {
      localStorage.setItem(`progress_${filename}`, time.toString());
    } catch (e) {
      console.warn('Failed to save video progress to cache', e);
    }
  },

  getVideoProgress: (filename: string): number | null => {
    try {
      const saved = localStorage.getItem(`progress_${filename}`);
      return saved ? parseFloat(saved) : null;
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
  saveSettings: (settings: { jumpStep?: number, volume?: number, isMuted?: boolean }) => {
    try {
      const existing = Cache.getSettings();
      localStorage.setItem('player_settings', JSON.stringify({ ...existing, ...settings }));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  },

  getSettings: (): { jumpStep: number, volume: number, isMuted: boolean } => {
    try {
      const saved = localStorage.getItem('player_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read settings', e);
    }
    return { jumpStep: 5, volume: 1, isMuted: false };
  }
};
