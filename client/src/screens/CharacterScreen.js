import { useState } from 'react';
import { API_URL } from '../config';

const CHARACTERS = [
  { id: 'quinn', name: 'Quinn', emoji: '🧒' },
  { id: 'zoe',   name: 'Zoe',   emoji: '👧' },
];

export default function CharacterScreen({ player, onDone }) {
  const [selected, setSelected] = useState(player.character || null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    await fetch(`${API_URL}/auth/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: player.id,
        character: selected,
        money: player.money,
        inventory: player.inventory,
        learned_values: player.learned_values,
      }),
    });
    onDone({ ...player, character: selected });
    setLoading(false);
  }

  return (
    <div className="screen" style={{ background: '#1a1a2e' }}>
      <div className="card">
        <h2>🎭 Pick Your Character</h2>
        <p className="subtitle">Who will you be at the flea market?</p>
        <div className="character-grid">
          {CHARACTERS.map(c => (
            <div
              key={c.id}
              className={`character-card ${selected === c.id ? 'selected' : ''}`}
              onClick={() => setSelected(c.id)}
            >
              <span className="character-emoji">{c.emoji}</span>
              <div className="character-name">{c.name}</div>
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary"
          disabled={!selected || loading}
          onClick={handleConfirm}
        >
          {loading ? 'Saving...' : "Let's Go! →"}
        </button>
      </div>
    </div>
  );
}
