import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, CheckCircle, ArrowLeft, Film } from 'lucide-react';
import { applyThemeFromImage, resetTheme } from '../utils/color';

export default function MovieDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;
  
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (movie?.poster_url) {
      applyThemeFromImage(movie.poster_url);
    }
    return () => {
      resetTheme();
    };
  }, [movie]);

  if (!movie) {
    return (
      <div style={{ padding: '2rem', color: 'white' }}>
        <h2>Movie not found</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', marginTop: '1rem', background: 'var(--btn-bg)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  const requestMovie = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/movies/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tmdb_id: movie.id, title: movie.title })
      });
      if (response.ok) {
        setRequested(true);
      }
    } catch (err) {
      console.error('Request failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        minHeight: '100%',
        color: 'white'
      }}
    >
      <style>{`
        .movie-details-content {
          gap: 4rem;
        }
        .movie-poster {
          width: 300px;
        }
        .request-btn {
          width: auto;
          justify-content: center;
        }
        .details-column {
          gap: 2rem;
        }
        .movie-title-block {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        @media (max-width: 768px) {
          .movie-details-content {
            gap: 2.5rem !important;
            flex-direction: column !important;
          }
          .details-column {
            gap: 1.5rem !important;
          }
          .movie-title-block {
            text-align: center;
            align-items: center;
          }
          .movie-poster {
            width: 100% !important;
            max-width: 400px;
            margin: 0 auto;
          }
          .request-btn {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
          borderRadius: '50%', width: '48px', height: '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
          transition: 'all 0.2s',
          marginBottom: '2rem'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <ArrowLeft size={24} />
      </button>

      {/* Content */}
      <div className="movie-details-content" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Poster */}
        <div className="movie-poster" style={{
          flexShrink: 0,
          aspectRatio: '2/3',
          backgroundImage: movie.poster_url ? `url(${movie.poster_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'var(--glass-bg)',
          borderRadius: '16px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid var(--glass-border)'
        }}>
          {!movie.poster_url && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={64} opacity={0.3} />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="details-column" style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="movie-title-block">
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 'bold', lineHeight: '1.1', textShadow: '0 4px 12px rgba(0,0,0,0.5)', marginBottom: '0.5rem' }}>
              {movie.title}
            </h1>
          </div>

          <div style={{ 
            fontSize: '1.15rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.85)', 
            maxWidth: '800px', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            background: 'rgba(15,15,20,0.7)', padding: '2rem', borderRadius: '16px',
            border: '1px solid var(--glass-border)'
          }}>
            {movie.plot || "No description available."}
          </div>

          <div style={{ marginTop: '1rem' }}>
            {requested ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#10b981' }}>
                <CheckCircle size={24} />
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Request Sent</span>
              </div>
            ) : (
              <button 
                className="request-btn"
                onClick={requestMovie}
                disabled={loading}
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: 'white',
                  background: 'var(--primary-color)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 8px 16px var(--primary-alpha-35)',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px var(--primary-alpha-40)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 16px var(--primary-alpha-35)';
                  }
                }}
              >
                <Download size={20} />
                {loading ? 'Requesting...' : 'Request Movie'}
              </button>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}