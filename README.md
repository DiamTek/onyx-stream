# Onyx Stream

Onyx Stream is a sleek, high-performance web interface for managing and streaming personal media libraries. It features a modern, glassmorphic UI built with React, designed to provide a premium viewing experience across desktop and mobile devices.

## ⚠️ Legal Disclaimer & DMCA Notice

**Onyx Stream is strictly a media management and playback interface.** 

- This software **does not** contain, host, distribute, or link to any copyrighted media, movies, television shows, or music.
- This software is designed exclusively for users to organize and stream their own legally obtained, personal media collections (such as home videos, DRM-free media, or public domain content).
- The developers and contributors of this repository do not endorse, encourage, or support piracy or the unauthorized sharing of copyrighted material. 
- Any demo screenshots or promotional materials use placeholder artwork or public domain content (e.g., *Big Buck Bunny*, *Elephants Dream*).

By using this software, you agree to comply with all applicable copyright laws in your jurisdiction.

## Features

- **Premium Glassmorphic UI:** A stunning, responsive design with smooth micro-animations.
- **Cross-Platform:** Beautifully optimized for both desktop and mobile web browsers.
- **Master Password Protection:** Secure access to your personal library.
- **Fluid Video Playback:** Custom-built video player with custom controls and liquid UI elements.

## Customization

### Skip Intro & Outro Configuration
Onyx Stream features dynamic "Skip Intro" and "Skip Outro" buttons that appear automatically based on metadata timestamps. Because standard metadata APIs (like TMDB) do not provide highly subjective timestamps, you can configure these manually for your personal library.

1. Navigate to the `backend` directory.
2. Open or create the `skip_times.json` file.
3. Add the exact filename of your video and specify the timestamps in seconds:
   ```json
   {
     "My Home Video 2024.mp4": {
       "introEnd": 45,
       "outroStart": 3600
     }
   }
   ```
   **Pro-Tip:** You don't need to specify every field! 
   - If you omit `introStart`, it automatically defaults to `0` (the very beginning of the movie).
   - If you omit `outroEnd`, it automatically defaults to the very end of the video file.

If a video is entirely missing from `skip_times.json`, the respective buttons will gracefully remain hidden.

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/DiamTek/onyx-stream.git
   ```
2. Install dependencies
   ```bash
   cd onyx-stream/frontend
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```

## Contact & Support

For inquiries or support, please contact Alexéy Shishkin at: [salexey09@gmail.com](mailto:salexey09@gmail.com)

## License

Copyright © 2026 DiamTek / Alexéy Shishkin.

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the `LICENSE` file for details.