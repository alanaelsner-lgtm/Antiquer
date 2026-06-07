const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Generate a random 4-letter room code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new room
router.post('/create', async (req, res) => {
  const { playerId } = req.body;

  if (!playerId) return res.status(400).json({ error: 'Player ID required' });

  // Make sure the code is unique
  let code;
  let exists = true;
  while (exists) {
    code = generateCode();
    const { data } = await supabase.from('rooms').select('id').eq('code', code).single();
    exists = !!data;
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ code, player1_id: playerId }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ room: data });
});

// Join an existing room
router.post('/join', async (req, res) => {
  const { playerId, code } = req.body;

  if (!playerId || !code) return res.status(400).json({ error: 'Player ID and room code required' });

  const { data: room, error: findError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (findError || !room) {
    return res.status(404).json({ error: 'Room not found. Check the code and try again!' });
  }

  if (room.player2_id && room.player2_id !== playerId) {
    return res.status(400).json({ error: 'This room is already full!' });
  }

  if (room.player1_id === playerId) {
    return res.status(400).json({ error: 'You are already in this room!' });
  }

  const { data, error } = await supabase
    .from('rooms')
    .update({ player2_id: playerId })
    .eq('id', room.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ room: data });
});

// Get room info (including both players' data)
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !room) return res.status(404).json({ error: 'Room not found' });

  // Fetch both players
  const playerIds = [room.player1_id, room.player2_id].filter(Boolean);
  const { data: players } = await supabase
    .from('players')
    .select('id, username, character, money')
    .in('id', playerIds);

  res.json({ room, players });
});

module.exports = router;
