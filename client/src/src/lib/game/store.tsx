import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CATALOG, getItem, rollStall, type Item } from "./items";
import quinnImg from "@/assets/characters/quinn.png";
import zoeImg from "@/assets/characters/zoe.png";
import mommyImg from "@/assets/characters/mommy.png";
import daddyImg from "@/assets/characters/daddy.png";
import peteImg from "@/assets/vendors/pete.png";
import rubyImg from "@/assets/vendors/ruby.png";
import joeImg from "@/assets/vendors/joe.png";
import mayImg from "@/assets/vendors/may.png";

export type InventoryEntry = {
  uid: string;
  itemId: string;
  pricePaid: number;
  /** Unix ms; while > Date.now() the item sits on the shelf and shows no customer. */
  shelvedUntil?: number;
  /** Last customer id who made an offer — biases next roll. */
  lastCustomerId?: string;
};
export type Stall = { id: string; vendor: string; emoji: string; image: string; tagline: string; items: { id: string; askingPrice: number }[]; restocked?: boolean };

export type Character = { id: "quinn" | "zoe" | "mommy" | "daddy"; name: string; emoji: string; image: string; hat: string };
export const CHARACTERS: Character[] = [
  { id: "quinn", name: "Quinn", emoji: "🧑‍🌾", image: quinnImg, hat: "Straw hat" },
  { id: "zoe",   name: "Zoe",   emoji: "👧",    image: zoeImg,   hat: "Red bandana" },
  { id: "mommy", name: "Mommy", emoji: "👩",    image: mommyImg, hat: "Floral blouse" },
  { id: "daddy", name: "Daddy", emoji: "🧔",    image: daddyImg, hat: "Vinyl collector" },
];

type State = {
  character: Character | null;
  money: number;
  inventory: InventoryEntry[];
  learned: string[]; // item ids
  stalls: Stall[];
};

const VENDORS = [
  { id: "v1", name: "Old Pete",   emoji: "🧔",     image: peteImg, tagline: "Tools & tinkerings" },
  { id: "v2", name: "Miss Ruby",  emoji: "👩‍🦰", image: rubyImg, tagline: "Pretty things" },
  { id: "v3", name: "Farmer Joe", emoji: "👨‍🌾", image: joeImg,  tagline: "Barn finds" },
  { id: "v4", name: "Aunt May",   emoji: "👩‍🦳", image: mayImg,  tagline: "Heirlooms & books" },
];

function freshStalls(): Stall[] {
  return VENDORS.map((v) => ({ id: v.id, vendor: v.name, emoji: v.emoji, image: v.image, tagline: v.tagline, items: rollStall(), restocked: false }));
}

function initialState(): State {
  return { character: null, money: 100, inventory: [], learned: [], stalls: freshStalls() };
}

const KEY = "antiquer:save:v1";

function load(): State {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY);
    const base = raw ? (JSON.parse(raw) as State) : initialState();
    if (!base.stalls?.length) base.stalls = freshStalls();
    // Re-hydrate vendor metadata (image/tagline) onto any saved stalls so older saves get portraits.
    base.stalls = base.stalls.map((st) => {
      const v = VENDORS.find((v) => v.id === st.id);
      return v ? { ...st, image: v.image, tagline: v.tagline, emoji: v.emoji, vendor: v.name } : st;
    });
    // Hydrate character from the login flow if the game save doesn't have one.
    if (!base.character) {
      const id = localStorage.getItem("antiquer:character");
      const found = CHARACTERS.find((c) => c.id === id);
      if (found) base.character = found;
    }
    return base;
  } catch {
    return initialState();
  }
}

type Ctx = {
  state: State;
  pickCharacter: (c: Character) => void;
  reset: () => void;
  isLearned: (itemId: string) => boolean;
  buyItem: (stallId: string, itemId: string, price: number) => void;
  sellItem: (uid: string, price: number) => void;
  donateItem: (uid: string) => void;
  shelveItem: (uid: string, lastCustomerId?: string, cooldownMs?: number) => void;
  returnToFloor: (uid: string) => void;
  restockStall: (stallId: string) => void;
  restockAll: () => void;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => initialState());

  // hydrate from localStorage on mount (SSR-safe)
  useEffect(() => { setState(load()); }, []);

  // persist
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const pickCharacter = useCallback((c: Character) => {
    setState((s) => ({ ...s, character: c }));
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  const isLearned = useCallback((id: string) => state.learned.includes(id), [state.learned]);

  const buyItem = useCallback((stallId: string, itemId: string, price: number) => {
    setState((s) => {
      if (s.money < price) return s;
      const uid = `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return {
        ...s,
        money: s.money - price,
        inventory: [...s.inventory, { uid, itemId, pricePaid: price }],
        stalls: s.stalls.map((st) =>
          st.id === stallId ? { ...st, items: st.items.filter((it) => it.id !== itemId) } : st
        ),
      };
    });
  }, []);

  const sellItem = useCallback((uid: string, price: number) => {
    setState((s) => {
      const entry = s.inventory.find((i) => i.uid === uid);
      if (!entry) return s;
      const learned = s.learned.includes(entry.itemId) ? s.learned : [...s.learned, entry.itemId];
      let money = s.money + price;
      // Out-of-money safety: if somehow at 0, fresh $100
      if (money <= 0) money = 100;
      return {
        ...s,
        money,
        learned,
        inventory: s.inventory.filter((i) => i.uid !== uid),
      };
    });
  }, []);

  const donateItem = useCallback((uid: string) => {
    setState((s) => {
      const entry = s.inventory.find((i) => i.uid === uid);
      if (!entry) return s;
      const learned = s.learned.includes(entry.itemId) ? s.learned : [...s.learned, entry.itemId];
      return { ...s, learned, inventory: s.inventory.filter((i) => i.uid !== uid) };
    });
  }, []);

  const shelveItem = useCallback((uid: string, lastCustomerId?: string, cooldownMs?: number) => {
    setState((s) => ({
      ...s,
      inventory: s.inventory.map((i) =>
        i.uid === uid
          ? { ...i, shelvedUntil: Date.now() + (cooldownMs ?? 20_000 + Math.floor(Math.random() * 40_000)), lastCustomerId }
          : i
      ),
    }));
  }, []);

  const returnToFloor = useCallback((uid: string) => {
    setState((s) => ({
      ...s,
      inventory: s.inventory.map((i) =>
        i.uid === uid ? { ...i, shelvedUntil: undefined } : i
      ),
    }));
  }, []);

  const restockStall = useCallback((stallId: string) => {
    setState((s) => ({
      ...s,
      stalls: s.stalls.map((st) =>
        st.id === stallId && !st.restocked ? { ...st, items: rollStall(), restocked: true } : st
      ),
    }));
  }, []);

  const restockAll = useCallback(() => {
    setState((s) => ({ ...s, stalls: freshStalls() }));
  }, []);

  // Auto-fresh-$100 when money hits 0 (per PRD)
  useEffect(() => {
    if (state.money <= 0 && state.character) {
      const t = setTimeout(() => setState((s) => (s.money <= 0 ? { ...s, money: 100 } : s)), 1500);
      return () => clearTimeout(t);
    }
  }, [state.money, state.character]);

  const value = useMemo<Ctx>(
    () => ({ state, pickCharacter, reset, isLearned, buyItem, sellItem, donateItem, shelveItem, returnToFloor, restockStall, restockAll }),
    [state, pickCharacter, reset, isLearned, buyItem, sellItem, donateItem, shelveItem, returnToFloor, restockStall, restockAll]
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

export { CATALOG, getItem };
export type { Item };