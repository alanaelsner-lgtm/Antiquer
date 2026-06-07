import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGame, type Stall } from "@/lib/game/store";
import { CATALOG, getItem } from "@/lib/game/items";
import { MathModal } from "./MathModal";
import { FleaMarketBackdrop } from "./Scenery";

type Selected = { stallId: string; itemId: string; askingPrice: number } | null;

// Vendor world positions along the street, spaced so 2-3 tables fit on screen at once.
const VENDOR_POSITIONS: Record<string, number> = {
  v1: 18,
  v2: 40,
  v3: 62,
  v4: 84,
};
// World units per screen-width. Higher = fewer tables visible at once.
const WORLD_TO_SCREEN = 1.8;
const STEP = 0.9; // % per frame while a direction is held
const WALK_SPEED = 1.4; // % per frame when auto-walking to a vendor
const BARK_LINES = [
  "Looking for a deal?",
  "Got somethin' special today!",
  "Take a peek, friend!",
  "Fresh finds, just in!",
  "You won't beat this price.",
];

export function MarketScene() {
  const { state, buyItem, isLearned, restockStall } = useGame();
  const [selected, setSelected] = useState<Selected>(null);
  const [openStallId, setOpenStallId] = useState<string | null>(null);
  const [playerX, setPlayerX] = useState(50);
  const heldRef = useRef<null | "left" | "right">(null);
  const walkTargetRef = useRef<{ x: number; stallId: string | null } | null>(null);
  const [showHint, setShowHint] = useState(false);

  // One-time keyboard hint per session
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("antiquer:walkHintSeen")) {
        setShowHint(true);
        sessionStorage.setItem("antiquer:walkHintSeen", "1");
        const t = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Continuous movement: while a direction key/button is held, advance playerX.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const target = walkTargetRef.current;
      if (target) {
        setPlayerX((x) => {
          const dx = target.x - x;
          if (Math.abs(dx) <= WALK_SPEED) {
            const sid = target.stallId;
            walkTargetRef.current = null;
            // open after arriving — only if this was a click-to-open walk
            if (sid) setTimeout(() => setOpenStallId(sid), 80);
            return target.x;
          }
          return x + Math.sign(dx) * WALK_SPEED;
        });
      } else if (heldRef.current === "left") {
        setPlayerX((x) => Math.max(0, x - STEP));
      } else if (heldRef.current === "right") {
        setPlayerX((x) => Math.min(100, x + STEP));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (openStallId || selected) return;
      if (e.key === "ArrowLeft" || e.key === "a") heldRef.current = "left";
      if (e.key === "ArrowRight" || e.key === "d") heldRef.current = "right";
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ArrowRight" || e.key === "d") {
        heldRef.current = null;
        snapToNearestVendor();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [openStallId, selected]);

  // Snap-to-vendor: if released within ~4 units of a vendor, glide to them.
  const snapToNearestVendor = () => {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const s of state.stalls) {
      const wx = VENDOR_POSITIONS[s.id] ?? 50;
      const d = Math.abs(wx - playerX);
      if (d < bestDist) { bestDist = d; best = s.id; }
    }
    if (best && bestDist < 4 && bestDist > 0.4) {
      walkTargetRef.current = { x: VENDOR_POSITIONS[best], stallId: null };
    }
  };

  // Stop walking if a modal opens.
  useEffect(() => {
    if (openStallId || selected) heldRef.current = null;
  }, [openStallId, selected]);

  const activeStall = openStallId ? state.stalls.find((s) => s.id === openStallId) ?? null : null;

  // Closest stall to the player — gets the speech bubble bark.
  const closestStallId = useMemo(() => {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const s of state.stalls) {
      const wx = VENDOR_POSITIONS[s.id] ?? 50;
      const d = Math.abs(wx - playerX);
      if (d < bestDist) {
        bestDist = d;
        best = s.id;
      }
    }
    return bestDist < 12 ? best : null;
  }, [state.stalls, playerX]);

  const handleVendorClick = (stallId: string) => {
    const wx = VENDOR_POSITIONS[stallId] ?? 50;
    if (Math.abs(wx - playerX) < 2) {
      setOpenStallId(stallId);
    } else {
      walkTargetRef.current = { x: wx, stallId };
      heldRef.current = null;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      <FleaMarketBackdrop />

      {/* Header */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-5xl px-4 pt-24 text-center">
        <div className="pointer-events-auto inline-block -rotate-1 rounded-2xl border-[4px] border-black bg-cream px-5 py-2 shadow-[0_6px_0_#000]">
          <p className="font-display text-xl font-extrabold leading-none text-[oklch(0.55_0.22_28)] sm:text-2xl">
            DAVISVILLE FLEA MARKET
          </p>
        </div>

      </div>

      {/* The "street" — illustrated tables with vendors standing behind, multiple visible at once. */}
      <div
        className="absolute inset-x-0 bottom-28 top-32 z-10 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
        }}
      >
        {/* Scrolling ground tiles — reinforces sense of motion */}
        <GroundTiles playerX={playerX} />

        {state.stalls.map((stall) => {
          const wx = VENDOR_POSITIONS[stall.id] ?? 50;
          // 50% screen = where the player stands; world unit = WORLD_TO_SCREEN screen %.
          const screen = 50 + (wx - playerX) * WORLD_TO_SCREEN;
          if (screen < -30 || screen > 130) return null;
          const dist = Math.abs(wx - playerX);
          // Closer = bigger. 1.0 at player, ~0.7 far away.
          const scale = Math.max(0.65, 1.1 - dist * 0.018);
          // Stable bark text per stall
          const barkIdx = stall.id.charCodeAt(stall.id.length - 1) % BARK_LINES.length;
          const isClosest = closestStallId === stall.id;
          return (
            <VendorTable
              key={stall.id}
              stall={stall}
              screenPct={screen}
              scale={scale}
              opacity={isClosest ? 1 : 0.78}
              bark={isClosest ? BARK_LINES[barkIdx] : null}
              onClick={() => handleVendorClick(stall.id)}
            />
          );
        })}

      </div>

      {/* On-screen walk controls */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex items-end justify-between px-4 sm:px-8">
        <WalkBtn
          label="◀ Walk"
          onHold={(v) => {
            heldRef.current = v ? "left" : null;
            if (!v) snapToNearestVendor();
          }}
        />
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-none mb-2 rounded-full border-2 border-black bg-cream/95 px-3 py-1 font-display text-[11px] font-extrabold shadow-[0_3px_0_#000]"
            >
              ← → to walk
            </motion.div>
          )}
        </AnimatePresence>
        <WalkBtn
          label="Walk ▶"
          onHold={(v) => {
            heldRef.current = v ? "right" : null;
            if (!v) snapToNearestVendor();
          }}
        />
      </div>

      {/* Stall items modal */}
      <AnimatePresence>
        {activeStall && (
          <motion.div
            className="fixed inset-0 z-30 flex items-end justify-center bg-[oklch(0.2_0.04_50/0.5)] p-4 sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpenStallId(null)}
          >
            <motion.div
              className="cozy-card w-full max-w-lg overflow-hidden"
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wood-panel flex items-center justify-between px-4 py-2">
                <p className="font-display text-lg font-bold text-cream drop-shadow">
                  {activeStall.vendor}'s Stall
                </p>
                <div className="flex gap-2">
                  {!activeStall.restocked && (
                    <button
                      onClick={() => { restockStall(activeStall.id); toast.success(`${activeStall.vendor} restocked!`); }}
                      className="rounded-full bg-cream/90 px-3 py-1 text-xs font-bold text-foreground hover:bg-cream"
                    >
                      Restock
                    </button>
                  )}
                  <button
                    onClick={() => setOpenStallId(null)}
                    className="rounded-full bg-cream/90 px-3 py-1 text-xs font-bold text-foreground hover:bg-cream"
                  >
                    ← Walk away
                  </button>
                </div>
              </div>
              <div className="bg-card p-4">
                {activeStall.items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sold out! Tap Restock for new finds.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {activeStall.items.map((it) => {
                      const item = getItem(it.id);
                      return (
                        <motion.button
                          key={it.id}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelected({ stallId: activeStall.id, itemId: it.id, askingPrice: it.askingPrice })}
                          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 border-wood-dark p-3 text-center shadow-[0_4px_0_var(--wood-dark)] ${item.color}`}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            width={512}
                            height={512}
                            className="h-24 w-24 object-contain drop-shadow-sm sm:h-28 sm:w-28"
                          />
                          <span className="text-sm font-bold leading-tight text-foreground">{item.name}</span>
                          <span className="rounded-full bg-foreground/90 px-2 py-0.5 text-xs font-bold text-cream">
                            ${it.askingPrice}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <BuyPrompt
            key={selected.itemId + selected.stallId}
            stallId={selected.stallId}
            itemId={selected.itemId}
            askingPrice={selected.askingPrice}
            money={state.money}
            onClose={() => setSelected(null)}
            onConfirmBuy={() => {
              const it = getItem(selected.itemId);
              buyItem(selected.stallId, selected.itemId, selected.askingPrice);
              toast.success(`You got the ${it.name}!`, { description: `Spent $${selected.askingPrice}.` });
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WalkBtn({ label, onHold }: { label: string; onHold: (v: boolean) => void }) {
  return (
    <button
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onHold(true); }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      className="pointer-events-auto rounded-2xl border-[4px] border-black bg-primary px-5 py-4 font-display text-base font-extrabold text-primary-foreground shadow-[0_6px_0_#000] active:translate-y-[3px] active:shadow-[0_3px_0_#000] sm:px-7 sm:py-5 sm:text-lg"
    >
      {label}
    </button>
  );
}

function VendorTable({
  stall, screenPct, scale, opacity, bark, onClick,
}: { stall: Stall; screenPct: number; scale: number; opacity: number; bark: string | null; onClick: () => void }) {
  // One hero item per table — keeps the row calm and readable.
  // Stable across renders so the same item represents the vendor.
  const hero = useMemo(() => pickHero(stall), [stall.id, stall.items.map((i) => i.id).join(",")]);
  // A few clutter items behind/around the hero for an overflowing-table feel.
  const clutter = useMemo(() => pickClutter(stall), [stall.id, stall.items.map((i) => i.id).join(",")]);
  const isEmpty = stall.items.length === 0;

  return (
    <motion.button
      onClick={onClick}
      animate={{ left: `${screenPct}%`, scale, opacity }}
      transition={{ type: "tween", ease: "linear", duration: 0.08 }}
      className="group absolute bottom-0 -translate-x-1/2 cursor-pointer focus:outline-none"
      style={{ width: "min(34vw, 260px)", transformOrigin: "bottom center", zIndex: Math.round(scale * 10) }}
    >
      {/* Vendor name plaque (floats above the whole stall) + bark bubble above the plaque */}
      <div className="relative z-30 mx-auto mb-2 w-fit">
        <AnimatePresence>
          {bark && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 rounded-2xl border-[3px] border-black bg-cream px-4 py-2 text-center font-display text-sm font-bold leading-snug shadow-[0_4px_0_#000] sm:text-base"
              style={{ width: "max-content", maxWidth: "200px" }}
            >
              {bark}
              <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-black bg-cream" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="rounded-full border-[3px] border-black bg-cream px-4 py-1 font-display text-sm font-extrabold shadow-[0_3px_0_#000] transition-transform group-hover:-translate-y-0.5 sm:text-base">
          {stall.vendor}
        </div>
      </div>

      {/* Vendor + table composition.
            1. Vendor character (z-0) — waist-up only (cropped via overflow)
            2. Clutter items    (z-10) — overflowing the table
            3. Table cloth      (z-20) — solid color, hides legs */}
      <div className="relative mx-auto h-56 w-full sm:h-64">
        {/* 1. Vendor character — clipped to waist-up using a mask container */}
        <div className="absolute inset-x-0 bottom-10 z-0 mx-auto h-36 w-full overflow-hidden sm:h-44">
          <img
            src={stall.image}
            alt={stall.vendor}
            loading="lazy"
            width={512}
            height={768}
            className="mx-auto h-56 w-auto object-contain object-top transition-transform group-hover:-translate-y-0.5 sm:h-64"
          />
        </div>

        {/* 2. Clutter — items overflowing the table */}
        {!isEmpty && (
          <div className="absolute inset-x-0 bottom-8 z-10 h-16">
            {clutter.map((c, i) => (
              <img
                key={i}
                src={c.item.image}
                alt=""
                aria-hidden
                loading="lazy"
                width={256}
                height={256}
                className="absolute object-contain drop-shadow"
                style={{
                  left: `${c.left}%`,
                  bottom: `${c.bottom}px`,
                  height: `${c.size}px`,
                  width: `${c.size}px`,
                  transform: `rotate(${c.rot}deg)`,
                  zIndex: 10 + i,
                }}
              />
            ))}
            {hero && (
              <img
                src={hero.image}
                alt=""
                aria-hidden
                loading="lazy"
                width={512}
                height={512}
                className="absolute bottom-4 left-1/2 z-20 h-16 w-16 -translate-x-1/2 object-contain drop-shadow-md sm:h-20 sm:w-20"
              />
            )}
          </div>
        )}
        {isEmpty && (
          <span className="absolute bottom-[68px] left-1/2 z-10 -translate-x-1/2 rounded-full border-2 border-black bg-cream px-2 py-0.5 text-[10px] font-bold uppercase">
            Sold out
          </span>
        )}

        {/* 3. Table cloth — solid, single accent stripe, calm */}
        <div className="absolute inset-x-0 bottom-0 z-20 h-14 rounded-md border-2 border-black bg-[oklch(0.78_0.09_55)] shadow-[0_3px_0_#000]">
        </div>
      </div>
    </motion.button>
  );
}

function pickHero(stall: Stall) {
  // Deterministic per stall: pick the first available item, fall back to a catalog item.
  if (stall.items[0]) return getItem(stall.items[0].id);
  let seed = 0;
  for (let i = 0; i < stall.id.length; i++) seed = (seed * 31 + stall.id.charCodeAt(i)) >>> 0;
  return CATALOG[seed % CATALOG.length];
}

function pickClutter(stall: Stall) {
  // Deterministic pseudo-random clutter layout per stall.
  let seed = 1;
  for (let i = 0; i < stall.id.length; i++) seed = (seed * 131 + stall.id.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const pool = stall.items.length > 0 ? stall.items.map((i) => getItem(i.id)) : CATALOG;
  const count = 6;
  return Array.from({ length: count }, (_, i) => ({
    item: pool[Math.floor(rand() * pool.length)],
    left: 6 + (i * 88) / count + rand() * 6,
    bottom: Math.floor(rand() * 18),
    size: 28 + Math.floor(rand() * 18),
    rot: Math.floor(rand() * 30) - 15,
  }));
}

function GroundTiles({ playerX }: { playerX: number }) {
  // A horizontal strip of repeating "cobblestone" tiles that scrolls with the player.
  const offset = (playerX * WORLD_TO_SCREEN) % 8; // px-ish % offset
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-16 overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, oklch(0.74 0.04 70) 0 32px, oklch(0.68 0.05 60) 32px 34px, oklch(0.74 0.04 70) 34px 64px, oklch(0.7 0.05 55) 64px 66px)",
          backgroundPosition: `${-offset * 8}px 0`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-black/20" />
    </div>
  );
}

function PlayerAvatar() {
  const { state } = useGame();
  if (!state.character) return null;
  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2">
      <img
        src={state.character.image}
        alt={state.character.name}
        width={512}
        height={512}
        className="h-32 w-32 rounded-full border-[4px] border-black object-cover shadow-[0_6px_0_#000] sm:h-40 sm:w-40"
      />
      <p className="mt-1 text-center font-display text-[10px] font-extrabold uppercase tracking-widest text-black/70 drop-shadow-[0_1px_0_#fff]">
        {state.character.name}
      </p>
    </div>
  );
}

function BuyPrompt({
  stallId, itemId, askingPrice, money, onClose, onConfirmBuy,
}: {
  stallId: string; itemId: string; askingPrice: number; money: number;
  onClose: () => void; onConfirmBuy: () => void;
}) {
  void stallId;
  const item = getItem(itemId);
  const [mathOpen, setMathOpen] = useState(false);
  const canAfford = money >= askingPrice;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[oklch(0.2_0.04_50/0.45)] p-4 sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cozy-card w-full max-w-sm p-5 text-center"
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-3xl border-[3px] border-wood-dark ${item.color}`}>
          <img src={item.image} alt={item.name} width={512} height={512} className="h-32 w-32 object-contain" />
        </div>
        <h3 className="font-display text-2xl font-bold">{item.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">"Hmm, looks interesting…"</p>
        <p className="my-3 text-3xl font-bold text-accent">${askingPrice}</p>
        {!canAfford && (
          <p className="mb-2 text-sm font-semibold text-destructive">Not enough money for this one!</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border-2 border-wood-dark bg-muted py-3 font-bold shadow-[0_4px_0_var(--wood-dark)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--wood-dark)]"
          >
            Walk away
          </button>
          <button
            disabled={!canAfford}
            onClick={() => setMathOpen(true)}
            className="flex-[2] rounded-2xl border-2 border-wood-dark bg-primary py-3 font-bold text-primary-foreground shadow-[0_4px_0_var(--wood-dark)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--wood-dark)] disabled:opacity-50"
          >
            Buy it!
          </button>
        </div>
      </motion.div>

      <MathModal
        open={mathOpen}
        op="sub"
        a={money}
        b={askingPrice}
        prompt={`You have $${money}. The ${item.name.toLowerCase()} costs $${askingPrice}. How much will you have left?`}
        onCancel={() => setMathOpen(false)}
        onCorrect={() => { setMathOpen(false); onConfirmBuy(); }}
        confirmLabel="Pay!"
      />
    </motion.div>
  );
}