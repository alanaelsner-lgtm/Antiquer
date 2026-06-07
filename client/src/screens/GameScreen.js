import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../config';
import useNotification from '../useNotification';
import bunnyVestImg from '../assets/items/bunnyvest.jpeg';
import bunnyNoVestImg from '../assets/items/Bunnynovest.PNG';

// ── Item emoji map ──────────────────────────────────────────────────
const ITEM_EMOJI = {
  teapot: '🫖', shiny_vase: '🏺', fancy_lamp: '🪔', big_mirror: '🪞',
  toy_car: '🚗', tin_robot: '🤖', doll: '🪆', old_book: '📚',
  cracked_mug: '🫗', torn_hat: '🎩', rusty_key: '🗝️', gold_watch: '⌚',
  bunny_vest: '🐰', bunny_no_vest: '🐰',
};

// ── Real item images (overrides emoji when available) ───────────────
const ITEM_IMAGES = {
  bunny_vest: bunnyVestImg,
  bunny_no_vest: bunnyNoVestImg,
};


// ── Vendor stall definitions ────────────────────────────────────────
const VENDORS = [
  { id: 'v1', name: "Betty's Table",  emoji: '👒', greeting: ["Welcome!", "Take a look around."] },
  { id: 'v2', name: "Old Joe's Tent", emoji: '🎩', greeting: ["Hey there!", "Good stuff today!"] },
  { id: 'v3', name: "Suzy's Finds",   emoji: '👜', greeting: ["Hi friend!", "See anything you like?"] },
  { id: 'v4', name: "The Junk Pile",  emoji: '🪣', greeting: ["Step right up!", "You never know what you'll find!"] },
];

// ── Tutorial steps ──────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  { emoji: '🏪', text: 'Welcome to Davisville Flea Market!\nYou start with $100.\nBuy items cheap and sell them for more!' },
  { emoji: '🛒', text: 'Go to the MARKET tab.\nTap a vendor stall to see their items.\nTap an item to learn more and buy it!' },
  { emoji: '🧮', text: 'To buy, answer a math question!\nSubtract the price from your money.\nWrong answer? Just try again!' },
  { emoji: '🏬', text: 'Go to the SHOP tab to sell!\nNana, Mommy, and Jan pay good prices.\nDaddy only takes junk for free.' },
  { emoji: '🧩', text: 'Customers sometimes bring puzzles!\nSolve them to earn bonus money.\nGood luck!' },
];

// ── Item image component ────────────────────────────────────────────
function ItemImage({ id, size = 56, style = {} }) {
  const img = ITEM_IMAGES[id];
  if (img) {
    return (
      <img
        src={img}
        alt={id}
        style={{
          width: size, height: size,
          objectFit: 'contain',
          borderRadius: 10,
          ...style,
        }}
      />
    );
  }
  return (
    <span style={{ fontSize: size * 0.75, lineHeight: 1, ...style }}>
      {ITEM_EMOJI[id] || '📦'}
    </span>
  );
}

// ── Dialogue box component ──────────────────────────────────────────
// Shows up to 3 sentences at once. Paginates in chunks of 3 if longer.
function DialogueBox({ lines, onDone, chunkSize = 3 }) {
  const safeLines = Array.isArray(lines) ? lines : [String(lines)];
  const chunks = [];
  for (let i = 0; i < safeLines.length; i += chunkSize) {
    chunks.push(safeLines.slice(i, i + chunkSize));
  }
  const [chunkIndex, setChunkIndex] = useState(0);
  const isLast = chunkIndex >= chunks.length - 1;

  function advance() {
    if (isLast) { onDone(); return; }
    setChunkIndex(i => i + 1);
  }

  return (
    <div onClick={advance} style={{
      background: '#fffbf0', border: '3px solid #c8a96e',
      borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
      position: 'relative', margin: '12px 0', userSelect: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {chunks[chunkIndex].map((line, i) => (
        <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#3d2b1f', fontFamily: 'Georgia, serif', margin: i > 0 ? '6px 0 0' : 0 }}>
          {line}
        </p>
      ))}
      <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 10, color: '#c8a96e' }}>
        {isLast ? '✓ Done' : '▶ more'}
      </span>
    </div>
  );
}

// ── MathChallenge component ─────────────────────────────────────────
function MathChallenge({ prompt, coins, onSubmit, onCancel }) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="math-box">
      <div className="math-coins">{coins}</div>
      <div className="math-prompt">{prompt}</div>
      <input
        ref={inputRef}
        className="math-input"
        type="number"
        inputMode="numeric"
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="?"
        onKeyDown={e => e.key === 'Enter' && onSubmit(answer)}
      />
      <button className="btn btn-primary btn-small" onClick={() => onSubmit(answer)}>
        ✓ Check Answer
      </button>
      <button className="btn btn-secondary btn-small" style={{ marginLeft: 8 }} onClick={onCancel}>
        ✗ Cancel
      </button>
    </div>
  );
}

// ── Main GameScreen ─────────────────────────────────────────────────
export default function GameScreen({ player: initialPlayer, roomCode }) {
  const [player, setPlayer] = useState(initialPlayer);
  const [tab, setTab] = useState('market');
  const [vendorStocks, setVendorStocks] = useState({});
  const [sellPrice, setSellPrice] = useState('');
  const [activeVendor, setActiveVendor] = useState(null);
  const [vendorDialogueDone, setVendorDialogueDone] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDialogueDone, setItemDialogueDone] = useState(false);
  const [mathChallenge, setMathChallenge] = useState(null);
  const [friendInfo, setFriendInfo] = useState(null);
  const [friendOnline, setFriendOnline] = useState(false);
  const [tradeOffer, setTradeOffer] = useState(null);
  const [tradeItemId, setTradeItemId] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [activePuzzle, setActivePuzzle] = useState(null);
  const [puzzlePhase, setPuzzlePhase] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const { notification, notify } = useNotification();
  const ws = useRef(null);


  // ── WebSocket connection ──────────────────────────────────────────
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join_room', payload: { roomCode, playerId: player.id } }));
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const { type, payload } = msg;

      if (type === 'joined') {
        setVendorStocks(payload.vendorStocks || {});
        setPlayer(p => ({ ...p, ...payload.player }));
      }
      if (type === 'friend_joined') {
        setFriendInfo(payload); setFriendOnline(true);
        notify(`${payload.username} joined the game!`, 'success');
      }
      if (type === 'friend_update') setFriendInfo(prev => ({ ...prev, ...payload }));
      if (type === 'friend_left') { setFriendOnline(false); notify(payload.message, 'info'); }
      if (type === 'buy_success') {
        setPlayer(p => ({ ...p, money: payload.newMoney, inventory: payload.newInventory }));
        setMathChallenge(null); setSelectedItem(null); setItemDialogueDone(false); setActiveVendor(null);
        notify(`You bought the ${payload.itemName}! 🎉`, 'success');
      }
      if (type === 'sell_success') {
        setPlayer(p => ({ ...p, money: payload.newMoney, inventory: payload.newInventory, learned_values: payload.newLearned }));
        setSelectedItem(null); setSellPrice('');
        if (payload.daddy) notify("Daddy came in and took it for free! 👨", 'info', 3000);
        else notify(`Sold for $${payload.salePrice}! 💰`, 'success');
      }
      if (type === 'sell_no_sale') {
        notify(payload.message, 'error');
      }
      if (type === 'wrong_answer') notify(payload.message, 'error');
      if (type === 'error') notify(payload.message, 'error');
      if (type === 'puzzle_offered') { setActivePuzzle(payload.puzzle); setPuzzlePhase('intro'); }
      if (type === 'puzzle_correct') {
        setPlayer(p => ({ ...p, money: payload.newMoney }));
        setMathChallenge(null); setActivePuzzle(null); setPuzzlePhase(null);
        notify(`You solved it! You earned $${payload.reward}! 🌟`, 'success', 4000);
      }
      if (type === 'puzzle_wrong') {
        setPlayer(p => ({ ...p, money: payload.newMoney }));
        setMathChallenge(null);
        notify(payload.message, 'error');
        setPuzzlePhase('market');
      }
      if (type === 'trade_incoming') {
        setTradeOffer(payload); setTab('trade');
        notify(`Your friend wants to sell you something!`, 'info');
      }
      if (type === 'trade_complete') {
        setPlayer(p => ({ ...p, money: payload.newMoney, inventory: payload.newInventory }));
        setTradeOffer(null); setMathChallenge(null);
        notify('Trade done! ✅', 'success');
      }
      if (type === 'trade_declined') notify(payload.message, 'info');
      if (type === 'trade_counter') { notify(`Your friend wants $${payload.price} instead.`, 'info'); setTradePrice(String(payload.price)); }
      if (type === 'trade_cancelled') { setTradeOffer(null); notify(payload.message, 'info'); }
      if (type === 'bid_won') {
        setPlayer(p => ({ ...p, money: payload.newMoney, inventory: payload.newInventory }));
        notify(`You won the bidding war! You paid $${payload.amountPaid}. 🏆`, 'success', 4000);
      }
      if (type === 'bid_lost') notify(payload.message, 'info');
    };

    socket.onclose = () => setFriendOnline(false);
    return () => socket.close();
  }, [roomCode, player.id]); // eslint-disable-line

  const sendWS = useCallback((msg) => {
    if (ws.current?.readyState === 1) ws.current.send(JSON.stringify(msg));
  }, []);

  function enterShop() {
    setTab('shop');
    if (!activePuzzle) sendWS({ type: 'request_puzzle', payload: { playerId: player.id } });
  }

  function startBuy(item) {
    setSelectedItem(item);
    setMathChallenge({
      mode: puzzlePhase === 'market' ? 'puzzle' : 'buy',
      prompt: `You have $${player.money}.\nThe ${item.name} costs $${item.vendorPrice}.\nHow much will you have left?`,
      coins: '💰'.repeat(Math.min(Math.floor(player.money / 10), 10)),
    });
  }

  function submitBuyAnswer(answer) {
    const type = puzzlePhase === 'market' ? 'puzzle_answer' : 'buy_item';
    sendWS({ type, payload: { playerId: player.id, itemId: selectedItem.id, mathAnswer: parseInt(answer) } });
  }


  function sendTradeOffer() {
    if (!tradeItemId || !tradePrice) return;
    if (!friendOnline) { notify('Your friend is not online right now!', 'error'); return; }
    sendWS({ type: 'trade_offer', payload: { fromId: player.id, toId: friendInfo?.id || '', itemId: tradeItemId, price: parseInt(tradePrice) } });
    notify('Trade offer sent!', 'info');
  }

  function respondToTrade(accept, counterPrice) {
    if (accept) {
      setMathChallenge({
        mode: 'trade_buy',
        prompt: `Your friend wants $${tradeOffer.price} for the ${tradeOffer.itemName}.\nYou have $${player.money}.\nHow much will you have left?`,
        coins: '💰'.repeat(Math.min(Math.floor(player.money / 10), 10)),
      });
    } else if (counterPrice != null) {
      sendWS({ type: 'trade_response', payload: { playerId: player.id, accept: false, counterPrice: parseInt(counterPrice) } });
    } else {
      sendWS({ type: 'trade_response', payload: { playerId: player.id, accept: false } });
      setTradeOffer(null);
    }
  }

  function submitTradeAnswer(answer) {
    sendWS({ type: 'trade_response', payload: { playerId: player.id, accept: true, mathAnswer: parseInt(answer) } });
    setMathChallenge(null);
  }

  const PUZZLE_NPC = { nana: '👵 Nana', mommy: '👩 Mommy', jan: '🧑‍🎨 Jan', daddy: '👨 Daddy' };
  const CHARACTER_EMOJI = { quinn: '🧒', zoe: '👧' };

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* HUD */}
      <div className="hud">
        <div className="hud-money">{CHARACTER_EMOJI[player.character] || '🧒'} ${player.money}</div>
        <div className="hud-friend">
          {friendOnline
            ? <span>👫 {friendInfo?.username}: <span>${friendInfo?.money}</span></span>
            : <span style={{ color: '#555' }}>friend offline</span>}
        </div>
      </div>

      {/* Notification */}
      {notification && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      {/* Tutorial */}
      {showTutorial && (
        <div className="tutorial-overlay">
          <div className="tutorial-box">
            <div className="tutorial-step">Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}</div>
            <span className="tutorial-emoji">{TUTORIAL_STEPS[tutorialStep].emoji}</span>
            <div className="tutorial-text">
              {TUTORIAL_STEPS[tutorialStep].text.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
            </div>
            <button className="btn btn-primary" onClick={() => {
              tutorialStep < TUTORIAL_STEPS.length - 1 ? setTutorialStep(t => t + 1) : setShowTutorial(false);
            }}>
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Next →' : "Let's Play! 🎉"}
            </button>
            <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowTutorial(false)}>
              Skip Tutorial
            </button>
          </div>
        </div>
      )}

      {/* Math challenge */}
      {mathChallenge && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🧮 Math Time!</h3>
            <MathChallenge
              prompt={mathChallenge.prompt}
              coins={mathChallenge.coins}
              onSubmit={(ans) => {
                if (mathChallenge.mode === 'buy' || mathChallenge.mode === 'puzzle') submitBuyAnswer(ans);
                else if (mathChallenge.mode === 'trade_buy') submitTradeAnswer(ans);
              }}
              onCancel={() => { setMathChallenge(null); setSelectedItem(null); }}
            />
          </div>
        </div>
      )}

      {/* Puzzle intro */}
      {activePuzzle && puzzlePhase === 'intro' && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🧩 Puzzle Time!</h3>
            <p style={{ fontSize: 13, color: '#7a5c3a', marginBottom: 8, fontWeight: 700 }}>
              {PUZZLE_NPC[activePuzzle.owner]} has a puzzle for you!
            </p>
            <DialogueBox lines={activePuzzle.description} onDone={() => {
              setPuzzlePhase('market');
              setTab('market');
              notify('Go to the market and find the right item!', 'info', 3000);
            }} />
            <button className="btn btn-secondary" onClick={() => { setActivePuzzle(null); setPuzzlePhase(null); }}>
              Skip Puzzle
            </button>
          </div>
        </div>
      )}

      {/* Vendor modal */}
      {activeVendor && !mathChallenge && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{activeVendor.emoji} {activeVendor.name}</h3>

            {!vendorDialogueDone ? (
              <DialogueBox lines={activeVendor.greeting} onDone={() => setVendorDialogueDone(true)} />
            ) : selectedItem && !itemDialogueDone ? (
              <>
                <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))' }}>
                    <ItemImage id={selectedItem.id} size={96} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#3d2b1f', marginTop: 6 }}>{selectedItem.name}</div>
                  <div style={{ fontSize: 14, color: '#e8673a', fontWeight: 800 }}>${selectedItem.vendorPrice}</div>
                </div>
                <DialogueBox
                  lines={selectedItem.description || [`This is the ${selectedItem.name}.`]}
                  onDone={() => setItemDialogueDone(true)}
                />
                <button className="btn btn-secondary" onClick={() => { setSelectedItem(null); setItemDialogueDone(false); }}>
                  ← Back
                </button>
              </>
            ) : selectedItem && itemDialogueDone ? (
              <>
                <div className="item-detail-hero">
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    <ItemImage id={selectedItem.id} size={100} />
                  </div>
                  <div className="item-detail-name">{selectedItem.name}</div>
                  <div className="item-detail-price">${selectedItem.vendorPrice}</div>
                  {player.learned_values?.includes(selectedItem.id) && (
                    <div className="item-value" style={{ marginTop: 4, fontSize: 13 }}>✨ True value: ${selectedItem.trueValue}</div>
                  )}
                  {puzzlePhase === 'market' && activePuzzle?.answerItemId === selectedItem.id && (
                    <div style={{ fontSize: 12, color: '#4aad6b', marginTop: 6, fontWeight: 800 }}>🧩 This might be the answer!</div>
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => {
                  if (puzzlePhase === 'market') setPuzzlePhase('solving');
                  startBuy(selectedItem);
                }}>
                  🛒 Buy for ${selectedItem.vendorPrice}
                </button>
                <button className="btn btn-secondary" onClick={() => { setSelectedItem(null); setItemDialogueDone(false); }}>
                  ← Back
                </button>
              </>
            ) : (
              <>
                <div className="item-list">
                  {(vendorStocks[activeVendor.id] || []).map(item => (
                    <div key={item.id} className="item-card" onClick={() => {
                      setSelectedItem(item); setItemDialogueDone(false);
                    }}>
                      <div className="item-big-emoji"><ItemImage id={item.id} size={52} /></div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-desc">Tap to learn more ▶</div>
                      </div>
                      <div className="item-price">${item.vendorPrice}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary" onClick={() => {
                  setActiveVendor(null); setVendorDialogueDone(false);
                  setSelectedItem(null); setItemDialogueDone(false);
                }}>
                  ← Leave
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Trade offer modal */}
      {tradeOffer && tab === 'trade' && !mathChallenge && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🤝 Trade Offer!</h3>
            <p className="subtitle">
              Your friend wants to sell you the {ITEM_EMOJI[tradeOffer.itemId] || '📦'} {tradeOffer.itemName} for ${tradeOffer.price}.
            </p>
            <button className="btn btn-green" onClick={() => respondToTrade(true)}>✅ Accept</button>
            <button className="btn btn-secondary" onClick={() => {
              const counter = window.prompt('How much do you want to pay instead?');
              if (counter) respondToTrade(false, parseInt(counter));
            }}>💬 Counter Offer</button>
            <button className="btn btn-primary" style={{ background: '#555', borderColor: '#333' }}
              onClick={() => respondToTrade(false)}>❌ No Thanks</button>
          </div>
        </div>
      )}

      {/* MARKET TAB */}
      {tab === 'market' && (
        <div className="market-bg">
          <div className="market-title">
            🌿 Davisville Flea Market 🌿
            {puzzlePhase === 'market' && (
              <div style={{ fontSize: 7, color: '#ffd700', marginTop: 6 }}>🧩 Puzzle active — find the right item!</div>
            )}
          </div>
          <div className="stalls">
            {VENDORS.map(v => (
              <div key={v.id} className="stall" onClick={() => {
                setActiveVendor(v); setVendorDialogueDone(false);
                setSelectedItem(null); setItemDialogueDone(false);
              }}>
                <span className="stall-vendor">{v.emoji}</span>
                <div className="stall-name">{v.name}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 7, color: '#a8d5a2', marginTop: 20 }}>
            Tap a stall to browse!
          </p>
        </div>
      )}

      {/* SHOP TAB */}
      {tab === 'shop' && (
        <div className="shop-bg" style={{ padding: 20, paddingBottom: 80 }}>
          <div className="shop-title">🏬 Your Antique Shop</div>

          {activePuzzle && puzzlePhase === 'intro' && (
            <div style={{ background: '#fffbf0', border: '3px solid #ffd700', borderRadius: 14, padding: 12, margin: '0 0 12px', textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#3d2b1f' }}>🧩 {PUZZLE_NPC[activePuzzle.owner]} has a puzzle for you!</span>
              <button className="btn btn-primary btn-small" style={{ marginTop: 8, display: 'block', margin: '8px auto 0' }} onClick={() => setPuzzlePhase('intro')}>
                See Puzzle
              </button>
            </div>
          )}

          {(!player.inventory || player.inventory.length === 0) ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <span style={{ fontSize: 48 }}>🛍️</span>
              <p style={{ fontSize: 14, color: '#fffbf0', marginTop: 12, fontWeight: 700 }}>Your shop is empty!</p>
              <p style={{ fontSize: 12, color: '#f0d8b8' }}>Go to the Market and buy some items.</p>
            </div>
          ) : !selectedItem ? (
            <>
              <p style={{ fontSize: 13, color: '#f0d8b8', marginBottom: 12, fontWeight: 700 }}>Tap an item to set your price:</p>
              <div className="inventory-grid">
                {player.inventory.map((item, i) => (
                  <div key={i} className="inv-item"
                    onClick={() => { setSelectedItem(item); setSellPrice(''); }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                      <ItemImage id={item.id} size={44} />
                    </div>
                    <div className="inv-item-name">{item.name}</div>
                    {item.paidPrice && (
                      <div style={{ fontSize: 9, color: '#c8a96e', marginTop: 2 }}>paid ${item.paidPrice}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ background: '#fffbf0', border: '3px solid #c8a96e', borderRadius: 16, padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <ItemImage id={selectedItem.id} size={80} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#3d2b1f' }}>{selectedItem.name}</div>
                {selectedItem.paidPrice && (
                  <div style={{ fontSize: 12, color: '#8a7060', marginTop: 4 }}>
                    You paid <strong>${selectedItem.paidPrice}</strong> — sell for more to make a profit!
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Your asking price ($)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={sellPrice}
                  onChange={e => setSellPrice(e.target.value)}
                  placeholder="e.g. 35"
                  min="1"
                />
              </div>

              {sellPrice && selectedItem.paidPrice && parseInt(sellPrice) > selectedItem.paidPrice && (
                <p style={{ fontSize: 12, color: '#4aad6b', fontWeight: 800, marginBottom: 8 }}>
                  📈 Profit: +${parseInt(sellPrice) - selectedItem.paidPrice}
                </p>
              )}
              {sellPrice && selectedItem.paidPrice && parseInt(sellPrice) <= selectedItem.paidPrice && parseInt(sellPrice) > 0 && (
                <p style={{ fontSize: 12, color: '#e8673a', fontWeight: 800, marginBottom: 8 }}>
                  📉 Loss: -${selectedItem.paidPrice - parseInt(sellPrice)}
                </p>
              )}

              <button className="btn btn-green" disabled={!sellPrice || parseInt(sellPrice) < 1}
                onClick={() => sendWS({ type: 'sell_item', payload: { playerId: player.id, itemId: selectedItem.id, askingPrice: parseInt(sellPrice) } })}>
                🏷️ List for Sale
              </button>
              <button className="btn btn-secondary" onClick={() => { setSelectedItem(null); setSellPrice(''); }}>
                ← Back
              </button>

              <p style={{ fontSize: 11, color: '#8a7060', marginTop: 10, textAlign: 'center' }}>
                Customers won't pay too much above what it's really worth!
              </p>
            </div>
          )}
        </div>
      )}

      {/* TRADE TAB */}
      {tab === 'trade' && !tradeOffer && (
        <div className="trade-section">
          <h2>🤝 Trade</h2>
          {!friendOnline ? (
            <p className="subtitle">Your friend is not online right now.<br />Trading works when you are both here!</p>
          ) : (
            <>
              <p className="subtitle">Offer one of your items to your friend!</p>
              <div className="input-group" style={{ marginTop: 16 }}>
                <label>Choose an item to sell</label>
                <select value={tradeItemId} onChange={e => setTradeItemId(e.target.value)}
                  style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14, padding: 12, width: '100%', background: '#fdf8ee', color: '#3d2b1f', border: '3px solid #c8a96e', borderRadius: 10 }}>
                  <option value="">-- Pick an item --</option>
                  {(player.inventory || []).map((item, i) => (
                    <option key={i} value={item.id}>{ITEM_EMOJI[item.id]} {item.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Your asking price ($)</label>
                <input type="number" inputMode="numeric" value={tradePrice}
                  onChange={e => setTradePrice(e.target.value)} placeholder="e.g. 30" />
              </div>
              <button className="btn btn-primary" onClick={sendTradeOffer} disabled={!tradeItemId || !tradePrice}>
                📤 Send Offer
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div className="nav-tabs">
        {[
          { id: 'market', label: '🏪 Market' },
          { id: 'shop',   label: '🏬 Shop',  action: enterShop },
          { id: 'trade',  label: '🤝 Trade' },
        ].map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => t.action ? t.action() : setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
