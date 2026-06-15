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
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Settings from './pages/Settings';
import Layout from './pages/Layout';
import MovieDetails from './pages/MovieDetails';
import GlobalPlayer from './components/GlobalPlayer';
import './index.css';

function AnimatedRoutes({ isAuthenticated, setIsAuthenticated }: { isAuthenticated: boolean, setIsAuthenticated: (val: boolean) => void }) {
  const location = useLocation();
  
  const getLayoutKey = (path: string) => {
    if (path === '/' || path === '/login') return 'auth';
    if (path.startsWith('/player')) return 'player';
    return 'app';
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getLayoutKey(location.pathname)}>
        <Route 
          path="/" 
          element={!isAuthenticated ? <Landing /> : <Navigate to="/library" />} 
        />
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/library" />} 
        />
        {/* Protected Routes inside Layout */}
        <Route element={isAuthenticated ? <Layout setAuth={setIsAuthenticated} /> : <Navigate to="/login" />}>
          <Route path="/library" element={<Dashboard />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
        </Route>
        {/* Dummy route to keep react-router happy, GlobalPlayer renders over it */}
        <Route 
          path="/player/:filename" 
          element={isAuthenticated ? <div /> : <Navigate to="/login" />} 
        />
      </Routes>
    </AnimatePresence>
  );
}

import GlobalSearch from './components/GlobalSearch';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  return (
    <Router>
      <AnimatedRoutes isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      {isAuthenticated && <GlobalSearch />}
      {isAuthenticated && <GlobalPlayer />}
    </Router>
  );
}

export default App;