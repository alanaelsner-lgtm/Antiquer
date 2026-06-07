import { useState } from 'react';
import { API_URL } from '../config';

export default function LobbyScreen({ player, onEnterGame }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [code, setCode] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function createRoom() {
    setLoading(true);
    setError('');
    const res = await fetch(`${API_URL}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setRoomInfo(data.room);
    setMode('created');
    setLoading(false);
  }

  async function joinRoom() {
    setLoading(true);
    setError('');
    const res = await fetch(`${API_URL}/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, code }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    onEnterGame(data.room.code);
    setLoading(false);
  }

  const CHARACTER_EMOJI = { quinn: '🧒', zoe: '👧' };

  return (
    <div className="screen" style={{ background: 'linear-gradient(180deg, #87ceeb 0%, #b0e0a0 60%, #5a9e4f 100%)' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>{CHARACTER_EMOJI[player.character] || '🧒'}</span>
          <h3 style={{ marginTop: 8 }}>{player.username}</h3>
          <p className="subtitle" style={{ color: '#ffd700' }}>💰 ${player.money}</p>
        </div>

        {!mode && (
          <>
            <h2>🏪 Davisville Lobby</h2>
            <p className="subtitle">Play with a friend using a room code!</p>
            <button className="btn btn-primary" onClick={createRoom} disabled={loading}>
              {loading ? 'Creating...' : '🏠 Create a Room'}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              🔑 Join a Room
            </button>
          </>
        )}

        {mode === 'created' && roomInfo && (
          <>
            <h2>🏠 Your Room</h2>
            <p className="subtitle">Share this code with your friend!</p>
            <div className="room-code-display">
              <div className="room-code">{roomInfo.code}</div>
              <div className="room-code-label">Tell your friend this code</div>
            </div>
            <button className="btn btn-green" onClick={() => onEnterGame(roomInfo.code)}>
              ▶ Start Playing (Solo)
            </button>
            <button className="btn btn-secondary" onClick={() => setMode(null)}>
              ← Back
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <h2>🔑 Join a Room</h2>
            <p className="subtitle">Ask your friend for their room code!</p>
            <div className="input-group">
              <label>Room Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. AB3X"
                maxLength={4}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary" onClick={joinRoom} disabled={loading || code.length < 4}>
              {loading ? 'Joining...' : '→ Join Game'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setMode(null); setError(''); }}>
              ← Back
            </button>
          </>
        )}

        {error && mode !== 'join' && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
