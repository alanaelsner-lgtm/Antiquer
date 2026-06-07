import { useState } from 'react';
import { API_URL } from '../config';
import davisvilleImg from '../assets/items/davisville.PNG';

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('title'); // 'title' | 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onLogin(data.player);
      }
    } catch {
      setError('Could not connect to the server. Try again!');
    }
    setLoading(false);
  }

  if (mode === 'title') {
    return (
      <div className="screen title-screen" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
        <img
          src={davisvilleImg}
          alt="Davisville Flea Market"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minHeight: '100vh', paddingBottom: 48, paddingLeft: 24, paddingRight: 24 }}>
          <div style={{ background: 'rgba(255,251,240,0.92)', border: '3px solid #c8a96e', borderRadius: 20, padding: '24px 28px', width: '100%', maxWidth: 340, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: '#3d2b1f', marginBottom: 4 }}>DAVISVILLE</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#7a5c3a', marginBottom: 20 }}>Flea Market</div>
            <button className="btn btn-primary" onClick={() => setMode('signup')}>
              New Player
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('login')}>
              I Already Play
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen title-screen">
      <div className="card">
        <h2>{mode === 'signup' ? '✨ New Account' : '👋 Welcome Back'}</h2>
        <p className="subtitle">
          {mode === 'signup'
            ? 'Pick a username and a 4-digit PIN.'
            : 'Type your username and PIN to play!'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. coolkid99"
              maxLength={20}
              required
            />
          </div>
          <div className="input-group">
            <label>PIN (4 numbers)</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              maxLength={4}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setMode('title'); setError(''); }}
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}
