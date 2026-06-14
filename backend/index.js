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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'admin123';
const MOVIES_DIR = path.join(__dirname, '..', 'movies');

app.use(cors());
app.use(express.json());

// Ensure movies directory exists
if (!fs.existsSync(MOVIES_DIR)) {
  fs.mkdirSync(MOVIES_DIR, { recursive: true });
}

const SKIP_TIMES_FILE = path.join(__dirname, 'skip_times.json');
if (!fs.existsSync(SKIP_TIMES_FILE)) {
  fs.writeFileSync(SKIP_TIMES_FILE, JSON.stringify({
    "__TEMPLATE__YOUR_MOVIE_FILENAME_HERE.mp4": { "introEnd": 85, "outroStart": 3600 }
  }, null, 2));
}

const getSkipTimes = () => {
  try {
    const data = fs.readFileSync(SKIP_TIMES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read skip_times file', err);
    return {};
  }
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

// 1. Login Route
app.post('/api/login', (req, res) => {
  const { password } = req.body;

  if (password === MASTER_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// 2. List Movies Route
const axios = require('axios');

// Intro/Outro Specific API Route
app.get('/api/intro/:filename', authenticateToken, (req, res) => {
  const skipTimes = getSkipTimes();
  const data = skipTimes[req.params.filename];
  if (data) {
    res.json({
      introStart: data.introStart !== undefined ? data.introStart : null,
      introEnd: data.introEnd !== undefined ? data.introEnd : null,
      outroStart: data.outroStart !== undefined ? data.outroStart : null,
      outroEnd: data.outroEnd !== undefined ? data.outroEnd : null
    });
  } else {
    res.json({ introStart: null, introEnd: null, outroStart: null, outroEnd: null });
  }
});

// Simple Memory Cache for TMDB data
const tmdbCache = {};

app.get('/api/movies', authenticateToken, async (req, res) => {
  fs.readdir(MOVIES_DIR, async (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan directory' });
    }

    const videoFiles = files.filter(f => /\.(mp4|mkv|webm)$/i.test(f));
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    const enrichedMovies = await Promise.all(videoFiles.map(async (f) => {
      // Basic parse: remove extension, replace dots/underscores with spaces
      let rawTitle = f.replace(/\.(mp4|mkv|webm)$/i, '').replace(/[\._]/g, ' ');
      // Try to extract year (e.g., "Inception 2010" -> "Inception", "2010")
      const yearMatch = rawTitle.match(/(.*)\s+(\d{4})/);
      let queryTitle = rawTitle;
      let queryYear = null;
      if (yearMatch) {
        queryTitle = yearMatch[1].trim();
        queryYear = yearMatch[2];
      }

      const skipTimes = getSkipTimes();
      const skipData = skipTimes[f] || null;

      const movieObj = {
        filename: f,
        title: rawTitle,
        poster_url: null,
        backdrop_url: null,
        plot: 'No description available.',
        genres: ['Uncategorized'],
        introStart: skipData && skipData.introStart !== undefined ? skipData.introStart : null,
        introEnd: skipData && skipData.introEnd !== undefined ? skipData.introEnd : null,
        outroStart: skipData && skipData.outroStart !== undefined ? skipData.outroStart : null,
        outroEnd: skipData && skipData.outroEnd !== undefined ? skipData.outroEnd : null
      };

      if (!TMDB_API_KEY) return movieObj;

      const cacheKey = queryTitle.toLowerCase();
      if (tmdbCache[cacheKey]) {
        return { ...movieObj, ...tmdbCache[cacheKey] };
      }

      try {
        let tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryTitle)}`;
        if (queryYear) tmdbUrl += `&primary_release_year=${queryYear}`;

        const tmdbRes = await axios.get(tmdbUrl);
        if (tmdbRes.data.results && tmdbRes.data.results.length > 0) {
          const match = tmdbRes.data.results[0];

          const tmdbGenres = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
            18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller',
            10752: 'War', 37: 'Western'
          };

          const genres = match.genre_ids ? match.genre_ids.map(id => tmdbGenres[id]).filter(Boolean) : [];

          const enriched = {
            title: match.title || rawTitle,
            poster_url: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
            backdrop_url: match.backdrop_path ? `https://image.tmdb.org/t/p/w1280${match.backdrop_path}` : null,
            plot: match.overview || movieObj.plot,
            genres: genres.length > 0 ? genres : ['Uncategorized']
          };
          tmdbCache[cacheKey] = enriched;
          return { ...movieObj, ...enriched };
        }
      } catch (err) {
        console.error('TMDB Fetch Error:', err.message);
      }
      return movieObj;
    }));

    res.json(enrichedMovies);
  });
});

// 3. Stream Video Route
app.get('/api/stream/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(MOVIES_DIR, filename);

  // Validate path traversal
  if (!filePath.startsWith(MOVIES_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle Range request
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Handle whole file request
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// 3. Discover Movies Route (TMDB Trending)
app.get('/api/discover', authenticateToken, async (req, res) => {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    return res.status(400).json({ error: 'TMDB API Key not configured' });
  }

  try {
    const tmdbRes = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`);
    const results = tmdbRes.data.results.map(match => ({
      id: match.id,
      title: match.title,
      poster_url: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
      plot: match.overview
    }));
    res.json(results);
  } catch (err) {
    console.error('TMDB Discover Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch discover data' });
  }
});

// 4. Request Movie Route
app.post('/api/request', authenticateToken, (req, res) => {
  const { id, title } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'Missing id or title' });

  const requestFile = path.join(__dirname, 'requests.json');
  let requests = [];
  if (fs.existsSync(requestFile)) {
    requests = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
  }

  if (!requests.find(r => r.id === id)) {
    requests.push({ id, title, requestedBy: req.user.username || 'admin', date: new Date().toISOString() });
    fs.writeFileSync(requestFile, JSON.stringify(requests, null, 2));
  }

  res.json({ success: true });
});

// 5. Search TMDB Route
app.get('/api/search', authenticateToken, async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    return res.status(400).json({ error: 'TMDB API Key not configured' });
  }

  try {
    const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);

    // Filter out people, map the rest
    let results = tmdbRes.data.results
      .filter(match => match.media_type !== 'person')
      .map(match => ({
        id: match.id,
        title: match.title || match.name, // 'name' is used for TV shows
        poster_url: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
        backdrop_url: match.backdrop_path ? `https://image.tmdb.org/t/p/w1280${match.backdrop_path}` : null,
        plot: match.overview,
        media_type: match.media_type
      }));

    // Custom exact-match sorter
    const lowerQuery = query.toLowerCase();
    results.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();

      const aExact = aTitle === lowerQuery;
      const bExact = bTitle === lowerQuery;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0; // maintain TMDB's relevance sorting for the rest
    });

    res.json(results);
  } catch (err) {
    console.error('TMDB Search Error:', err.message);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
