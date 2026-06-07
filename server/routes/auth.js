const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

// Sign up — create a new account
router.post('/signup', async (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username and PIN are required' });
  }

  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'That username is already taken. Try another one!' });
  }

  const { data, error } = await supabase
    .from('players')
    .insert([{ username, pin }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ player: data });
});

// Log in
router.post('/login', async (req, res) => {
  const { username, pin } = req.body;

  const { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .eq('pin', pin)
    .single();

  if (error || !player) {
    return res.status(401).json({ error: 'Wrong username or PIN. Try again!' });
  }

  res.json({ player });
});

// Save player progress
router.post('/save', async (req, res) => {
  const { playerId, money, inventory, learned_values, character } = req.body;

  const { data, error } = await supabase
    .from('players')
    .update({ money, inventory, learned_values, character })
    .eq('id', playerId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ player: data });
});

module.exports = router;
