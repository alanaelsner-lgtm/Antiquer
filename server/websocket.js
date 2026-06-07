const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const items = require('./data/items.json');
const puzzles = require('./data/puzzles.json');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const rooms = {};
const pendingBids = {};
const activePuzzles = {};
const pendingTrades = {};

// ── Each vendor sells a specific set of items ──────────────────────
const VENDOR_ITEMS = {
  v1: ['teapot', 'shiny_vase', 'bunny_vest', 'fancy_lamp'],
  v2: ['toy_car', 'tin_robot', 'gold_watch', 'big_mirror'],
  v3: ['doll', 'old_book', 'bunny_no_vest', 'cracked_mug'],
  v4: ['torn_hat', 'rusty_key', 'old_book', 'teapot'],
};

function getVendorStocks() {
  const stocks = {};
  for (const [vendorId, itemIds] of Object.entries(VENDOR_ITEMS)) {
    stocks[vendorId] = itemIds.map(id => {
      const item = items.find(i => i.id === id);
      if (!item) return null;
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        vendorPrice: item.vendorPrice,
        // trueValue never sent to client
      };
    }).filter(Boolean);
  }
  return stocks;
}

function broadcast(roomCode, message, excludePlayerId = null) {
  const room = rooms[roomCode];
  if (!room) return;
  for (const [playerId, ws] of Object.entries(room)) {
    if (playerId !== excludePlayerId && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }
}

function sendTo(roomCode, playerId, message) {
  const room = rooms[roomCode];
  if (!room || !room[playerId]) return;
  const ws = room[playerId];
  if (ws.readyState === 1) ws.send(JSON.stringify(message));
}

function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    let currentRoom = null;
    let currentPlayerId = null;

    ws.on('message', async (data) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }

      const { type, payload } = msg;

      // ── JOIN ROOM ──────────────────────────────────────────────
      if (type === 'join_room') {
        const { roomCode, playerId } = payload;
        currentRoom = roomCode;
        currentPlayerId = playerId;

        if (!rooms[roomCode]) rooms[roomCode] = {};
        rooms[roomCode][playerId] = ws;

        const { data: player } = await supabase
          .from('players')
          .select('id, username, character, money, inventory, learned_values')
          .eq('id', playerId)
          .single();

        ws.send(JSON.stringify({
          type: 'joined',
          payload: { player, vendorStocks: getVendorStocks() }
        }));

        broadcast(roomCode, {
          type: 'friend_joined',
          payload: { username: player.username, money: player.money }
        }, playerId);

        const otherIds = Object.keys(rooms[roomCode]).filter(id => id !== playerId);
        if (otherIds.length > 0) {
          const { data: friend } = await supabase
            .from('players')
            .select('username, money')
            .eq('id', otherIds[0])
            .single();
          if (friend) {
            ws.send(JSON.stringify({
              type: 'friend_update',
              payload: { username: friend.username, money: friend.money }
            }));
          }
        }
      }

      // ── BUY ITEM ───────────────────────────────────────────────
      if (type === 'buy_item') {
        const { playerId, itemId, mathAnswer } = payload;

        const item = items.find(i => i.id === itemId);
        if (!item) return ws.send(JSON.stringify({ type: 'error', payload: { message: 'Item not found' } }));

        const { data: player } = await supabase
          .from('players')
          .select('money, inventory, learned_values')
          .eq('id', playerId)
          .single();
        if (!player) return;

        if (player.money < item.vendorPrice) {
          return ws.send(JSON.stringify({ type: 'error', payload: { message: "You don't have enough money!" } }));
        }

        const correctAnswer = player.money - item.vendorPrice;
        if (parseInt(mathAnswer) !== correctAnswer) {
          return ws.send(JSON.stringify({ type: 'wrong_answer', payload: { message: 'Not quite — try again!' } }));
        }

        const newMoney = player.money - item.vendorPrice;
        // Store paidPrice so the shop can show how much the player paid
        const newInventory = [
          ...(player.inventory || []),
          { id: item.id, name: item.name, paidPrice: item.vendorPrice }
        ];

        await supabase.from('players').update({ money: newMoney, inventory: newInventory }).eq('id', playerId);

        ws.send(JSON.stringify({
          type: 'buy_success',
          payload: { itemId: item.id, itemName: item.name, newMoney, newInventory }
        }));

        broadcast(currentRoom, { type: 'friend_update', payload: { money: newMoney } }, playerId);
      }

      // ── SELL ITEM ──────────────────────────────────────────────
      // Player sets their own asking price. No math required.
      // Customers won't pay more than 20% above true value.
      // Junk items (trueValue = 0): Daddy takes them for free.
      if (type === 'sell_item') {
        const { playerId, itemId, askingPrice } = payload;

        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const { data: player } = await supabase
          .from('players')
          .select('money, inventory, learned_values')
          .eq('id', playerId)
          .single();
        if (!player) return;

        const learned = player.learned_values || [];
        const newLearned = learned.includes(itemId) ? learned : [...learned, itemId];

        // Junk: Daddy takes it for $0
        if (item.trueValue === 0) {
          const newInventory = (player.inventory || []).filter(i => i.id !== itemId);
          await supabase.from('players').update({
            inventory: newInventory,
            learned_values: newLearned
          }).eq('id', playerId);

          return ws.send(JSON.stringify({
            type: 'sell_success',
            payload: {
              itemId, salePrice: 0,
              newMoney: player.money, newInventory, newLearned,
              gotReset: false, daddy: true
            }
          }));
        }

        // Real item: customers won't pay more than 20% over true value
        const maxPrice = Math.round(item.trueValue * 1.2);
        if (askingPrice > maxPrice) {
          return ws.send(JSON.stringify({
            type: 'sell_no_sale',
            payload: { message: `Nobody wanted it for $${askingPrice}. Try lowering the price!` }
          }));
        }

        const salePrice = askingPrice;
        const newMoney = player.money + salePrice;
        const newInventory = (player.inventory || []).filter(i => i.id !== itemId);

        await supabase.from('players').update({
          money: newMoney,
          inventory: newInventory,
          learned_values: newLearned
        }).eq('id', playerId);

        ws.send(JSON.stringify({
          type: 'sell_success',
          payload: { itemId, salePrice, newMoney, newInventory, newLearned, gotReset: false }
        }));

        broadcast(currentRoom, { type: 'friend_update', payload: { money: newMoney } }, playerId);
      }

      // ── REQUEST PUZZLE (when player enters shop) ───────────────
      if (type === 'request_puzzle') {
        const { playerId } = payload;
        if (Math.random() < 0.4 && !activePuzzles[playerId]) {
          const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
          activePuzzles[playerId] = puzzle;
          ws.send(JSON.stringify({ type: 'puzzle_offered', payload: { puzzle } }));
        }
      }

      // ── PUZZLE ANSWER ──────────────────────────────────────────
      if (type === 'puzzle_answer') {
        const { playerId, itemId, mathAnswer } = payload;
        const puzzle = activePuzzles[playerId];
        if (!puzzle) return;

        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const { data: player } = await supabase
          .from('players')
          .select('money, inventory')
          .eq('id', playerId)
          .single();
        if (!player) return;

        const correctAnswer = player.money - item.vendorPrice;
        if (parseInt(mathAnswer) !== correctAnswer) {
          return ws.send(JSON.stringify({ type: 'wrong_answer', payload: { message: 'Not quite — try again!' } }));
        }

        const isCorrect = itemId === puzzle.answerItemId;

        if (isCorrect) {
          const reward = item.vendorPrice * puzzle.rewardMultiplier;
          const newMoney = player.money - item.vendorPrice + reward;
          await supabase.from('players').update({ money: newMoney }).eq('id', playerId);
          delete activePuzzles[playerId];
          ws.send(JSON.stringify({
            type: 'puzzle_correct',
            payload: { reward, newMoney, puzzleId: puzzle.id, itemName: item.name }
          }));
          broadcast(currentRoom, { type: 'friend_update', payload: { money: newMoney } }, playerId);
        } else {
          const newMoney = player.money - item.vendorPrice;
          await supabase.from('players').update({ money: newMoney }).eq('id', playerId);
          ws.send(JSON.stringify({
            type: 'puzzle_wrong',
            payload: { newMoney, message: "That wasn't the right one. Daddy took it!" }
          }));
          broadcast(currentRoom, { type: 'friend_update', payload: { money: newMoney } }, playerId);
        }
      }

      // ── TRADE OFFER ────────────────────────────────────────────
      if (type === 'trade_offer') {
        const { fromId, toId, itemId, price } = payload;
        const item = items.find(i => i.id === itemId);
        if (!item) return;
        pendingTrades[currentRoom] = { fromId, toId, itemId, price, itemName: item.name };
        sendTo(currentRoom, toId, {
          type: 'trade_incoming',
          payload: { fromId, itemId, itemName: item.name, price }
        });
      }

      // ── TRADE RESPONSE ─────────────────────────────────────────
      if (type === 'trade_response') {
        const { playerId, accept, counterPrice, mathAnswer } = payload;
        const trade = pendingTrades[currentRoom];
        if (!trade) return;

        if (!accept && counterPrice == null) {
          delete pendingTrades[currentRoom];
          sendTo(currentRoom, trade.fromId, {
            type: 'trade_declined',
            payload: { message: 'Your friend said no thanks.' }
          });
          return;
        }

        if (!accept && counterPrice != null) {
          pendingTrades[currentRoom] = { ...trade, fromId: playerId, toId: trade.fromId, price: counterPrice };
          sendTo(currentRoom, trade.fromId, {
            type: 'trade_counter',
            payload: { price: counterPrice }
          });
          return;
        }

        const finalPrice = trade.price;
        const { data: buyer } = await supabase.from('players').select('money, inventory').eq('id', trade.toId).single();
        const { data: seller } = await supabase.from('players').select('money, inventory').eq('id', trade.fromId).single();
        if (!buyer || !seller) return;

        if (buyer.money < finalPrice) {
          return sendTo(currentRoom, trade.toId, {
            type: 'error',
            payload: { message: "You don't have enough money for this trade!" }
          });
        }

        const sellerInventory = (seller.inventory || []).filter(i => i.id !== trade.itemId);
        const buyerInventory = [...(buyer.inventory || []), { id: trade.itemId, name: trade.itemName, paidPrice: finalPrice }];

        await supabase.from('players').update({ money: seller.money + finalPrice, inventory: sellerInventory }).eq('id', trade.fromId);
        await supabase.from('players').update({ money: buyer.money - finalPrice, inventory: buyerInventory }).eq('id', trade.toId);

        delete pendingTrades[currentRoom];

        sendTo(currentRoom, trade.fromId, {
          type: 'trade_complete',
          payload: { role: 'seller', newMoney: seller.money + finalPrice, newInventory: sellerInventory }
        });
        sendTo(currentRoom, trade.toId, {
          type: 'trade_complete',
          payload: { role: 'buyer', newMoney: buyer.money - finalPrice, newInventory: buyerInventory }
        });

        broadcast(currentRoom, { type: 'friend_update', payload: { money: seller.money + finalPrice } }, trade.fromId);
      }

      // ── BID WAR ────────────────────────────────────────────────
      if (type === 'bid') {
        const { playerId, itemId, amount } = payload;
        if (!pendingBids[currentRoom]) {
          pendingBids[currentRoom] = { itemId, bids: {}, firstBidder: playerId };
        }

        const { data: player } = await supabase.from('players').select('money').eq('id', playerId).single();
        const safeBid = Math.min(amount, player.money);
        pendingBids[currentRoom].bids[playerId] = safeBid;

        const bidCount = Object.keys(pendingBids[currentRoom].bids).length;
        if (bidCount === 2) {
          const [p1, p2] = Object.entries(pendingBids[currentRoom].bids);
          let winnerId, winnerBid, loserId;
          if (p1[1] > p2[1]) { [winnerId, winnerBid, loserId] = [p1[0], p1[1], p2[0]]; }
          else if (p2[1] > p1[1]) { [winnerId, winnerBid, loserId] = [p2[0], p2[1], p1[0]]; }
          else { winnerId = pendingBids[currentRoom].firstBidder; winnerBid = p1[1]; loserId = winnerId === p1[0] ? p2[0] : p1[0]; }

          const item = items.find(i => i.id === itemId);
          const { data: winner } = await supabase.from('players').select('money, inventory').eq('id', winnerId).single();
          const newMoney = winner.money - winnerBid;
          const newInventory = [...(winner.inventory || []), { id: item.id, name: item.name, paidPrice: winnerBid }];
          await supabase.from('players').update({ money: newMoney, inventory: newInventory }).eq('id', winnerId);

          sendTo(currentRoom, winnerId, { type: 'bid_won', payload: { itemId, itemName: item.name, amountPaid: winnerBid, newMoney, newInventory } });
          sendTo(currentRoom, loserId, { type: 'bid_lost', payload: { message: 'Your friend won this one. You kept your money!' } });
          broadcast(currentRoom, { type: 'friend_update', payload: { money: newMoney } }, winnerId);
          delete pendingBids[currentRoom];
        } else {
          pendingBids[currentRoom].timer = setTimeout(async () => {
            const bid = pendingBids[currentRoom];
            if (!bid) return;
            const [winnerId, winnerBid] = Object.entries(bid.bids)[0];
            const item = items.find(i => i.id === itemId);
            const { data: winner } = await supabase.from('players').select('money, inventory').eq('id', winnerId).single();
            const newMoney = winner.money - winnerBid;
            const newInventory = [...(winner.inventory || []), { id: item.id, name: item.name, paidPrice: winnerBid }];
            await supabase.from('players').update({ money: newMoney, inventory: newInventory }).eq('id', winnerId);
            sendTo(currentRoom, winnerId, { type: 'bid_won', payload: { itemId, itemName: item.name, amountPaid: winnerBid, newMoney, newInventory } });
            delete pendingBids[currentRoom];
          }, 10000);
        }
      }
    });

    ws.on('close', () => {
      if (currentRoom && currentPlayerId && rooms[currentRoom]) {
        delete rooms[currentRoom][currentPlayerId];
        if (Object.keys(rooms[currentRoom]).length === 0) {
          delete rooms[currentRoom];
        } else {
          broadcast(currentRoom, {
            type: 'friend_left',
            payload: { message: 'Your friend went offline.' }
          });
        }
        if (pendingTrades[currentRoom]) {
          const trade = pendingTrades[currentRoom];
          if (trade.fromId === currentPlayerId || trade.toId === currentPlayerId) {
            delete pendingTrades[currentRoom];
            broadcast(currentRoom, { type: 'trade_cancelled', payload: { message: 'Trade cancelled — friend disconnected.' } });
          }
        }
      }
    });
  });
}

module.exports = { setupWebSocket };
