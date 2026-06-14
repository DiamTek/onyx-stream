import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Player from './pages/Player';
import Discover from './pages/Discover';
import Settings from './pages/Settings';
import Layout from './pages/Layout';
import MovieDetails from './pages/MovieDetails';
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
        <Route 
          path="/player/:filename" 
          element={isAuthenticated ? <Player /> : <Navigate to="/login" />} 
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
    </Router>
  );
}

export default App;