import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGame } from "@/lib/game/store";
import { CUSTOMERS, getItem, pickCustomerLines, rollCustomerOffer, type Customer, type Item } from "@/lib/game/items";
import { MathModal } from "./MathModal";
import { ShopBackdrop } from "./Scenery";

type Offer = {
  id: string;
  uid: string;       // inventory uid
  customer: Customer;
  price: number;
  lines: string[]; // dialogue picked fresh for this visit
};

type Sale = { name: string; profit: number };

export function ShopScene() {
  const { state, sellItem, donateItem, shelveItem, returnToFloor, isLearned } = useGame();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pendingSale, setPendingSale] = useState<Offer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  // Items are either on the floor (with a waiting customer) or shelved (no timer — wait for player).
  const inventory = state.inventory;
  const onFloor = useMemo(() => inventory.filter((i) => !i.shelvedUntil), [inventory]);
  const shelved = useMemo(() => inventory.filter((i) => !!i.shelvedUntil), [inventory]);
  const offerKey = useMemo(() => onFloor.map((i) => i.uid).join("|"), [onFloor]);

  useEffect(() => {
    setOffers((prev) => {
      const keepValid = prev.filter((o) => onFloor.some((i) => i.uid === o.uid));
      const havePending = new Set(keepValid.map((o) => o.uid));
      const fresh: Offer[] = onFloor
        .filter((i) => !havePending.has(i.uid))
        .map((entry) => {
          const item = getItem(entry.itemId);
          let { customer, price } = rollCustomerOffer(item);
          // 70% of the time, force a *different* customer than last time so it feels fresh.
          if (entry.lastCustomerId && customer.id === entry.lastCustomerId && item.trueValue > 0 && Math.random() < 0.7) {
            const others = Object.values(CUSTOMERS).filter((c) => c.id !== entry.lastCustomerId && c.id !== "daddy");
            if (others.length) customer = others[Math.floor(Math.random() * others.length)];
          }
          return {
            id: `${entry.uid}-${Math.random().toString(36).slice(2, 6)}`,
            uid: entry.uid,
            customer,
            price,
            lines: pickCustomerLines(customer),
          };
        });
      return [...keepValid, ...fresh];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerKey]);

  const waiting = offers.length;
  const todayProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const bestSale = sales.reduce<Sale | null>((best, s) => (!best || s.profit > best.profit ? s : best), null);

  const verdict = (price: number, trueValue: number): null | "great" | "fair" | "lowball" => {
    if (trueValue <= 0) return null;
    if (price >= trueValue * 1.1) return "great";
    if (price >= trueValue * 0.85) return "fair";
    return "lowball";
  };

  // Handlers that act directly on an offer (no second-confirm modal).
  const doShelve = (offer: Offer, itemName: string) => {
    shelveItem(offer.uid, offer.customer.id);
    setOffers((o) => o.filter((x) => x.id !== offer.id));
    toast(`${offer.customer.name} will come back later.`, {
      description: `${itemName} is on the shelf.`,
    });
  };
  const doDonate = (offer: Offer, itemName: string) => {
    donateItem(offer.uid);
    setOffers((o) => o.filter((x) => x.id !== offer.id));
    toast(`Daddy took the ${itemName.toLowerCase()} away.`, {
      description: "No money this time — but you learned its value!",
    });
  };
  const doSell = (offer: Offer) => {
    const entry = inventory.find((i) => i.uid === offer.uid);
    const item = entry ? getItem(entry.itemId) : null;
    const profit = entry ? offer.price - entry.pricePaid : 0;
    sellItem(offer.uid, offer.price);
    setOffers((o) => o.filter((x) => x.id !== offer.id));
    if (item) setSales((s) => [...s, { name: item.name, profit }]);
    toast.success(`Sold the ${item?.name.toLowerCase() ?? "item"} for $${offer.price}!`, {
      description: profit >= 0 ? `Profit: +$${profit} 🎉` : `Lost $${Math.abs(profit)} — try guessing lower next time.`,
    });
  };

  return (
    <div className="relative min-h-screen w-full">
      <ShopBackdrop />

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-20">
        <header className="mb-5 text-center">
          <div className="inline-block -rotate-1 rounded-2xl border-[4px] border-black bg-cream px-6 py-3 shadow-[0_8px_0_#000]">
            <p className="font-display text-2xl font-extrabold text-black sm:text-3xl">
              {state.character?.name ?? "Your"}'s Antique Shop
            </p>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-widest text-black/70">
              {waiting > 0 ? `${waiting} ${waiting === 1 ? "customer is" : "customers are"} waiting` : "Bring items from the market!"}
            </p>
          </div>
        </header>

        {inventory.length === 0 ? (
          <EmptyShop />
        ) : (
          <div className="space-y-4">
            {offers.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AnimatePresence>
                  {offers.map((offer) => {
                    const entry = inventory.find((i) => i.uid === offer.uid);
                    if (!entry) return null;
                    const item = getItem(entry.itemId);
                    const isJunk = item.trueValue === 0;
                    return (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        item={item}
                        pricePaid={entry.pricePaid}
                        isLearned={isLearned(item.id)}
                        verdict={verdict(offer.price, item.trueValue)}
                        onAct={() => {
                          if (isJunk) doDonate(offer, item.name);
                          else setPendingSale(offer);
                        }}
                        onShelve={() => doShelve(offer, item.name)}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Daily register tape */}
            {sales.length > 0 && (
              <RegisterTape count={sales.length} profit={todayProfit} best={bestSale} />
            )}

          </div>
        )}
      </div>

      {/* Shelf strip — pinned to bottom; hidden while a customer is at the counter */}
      {offers.length === 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
          <div className="mx-auto max-w-3xl">
            <ShelfStrip shelved={shelved} onReturn={(uid) => returnToFloor(uid)} />
          </div>
        </div>
      )}

      {/* Single math modal, shown when the player confirms a sale on an OfferCard */}
      {pendingSale && (() => {
        const entry = inventory.find((i) => i.uid === pendingSale.uid);
        const item = entry ? getItem(entry.itemId) : null;
        return (
          <MathModal
            open
            op="add"
            a={state.money}
            b={pendingSale.price}
            prompt={`${pendingSale.customer.name} pays $${pendingSale.price}. You have $${state.money}. How much money now?`}
            onCancel={() => setPendingSale(null)}
            onCorrect={() => {
              const offer = pendingSale;
              setPendingSale(null);
              if (offer && item) doSell(offer);
            }}
            confirmLabel="Cha-ching!"
          />
        );
      })()}
    </div>
  );
}

function EmptyShop() {
  return (
    <div className="cozy-card mx-auto max-w-md p-8 text-center">
      <p className="text-5xl">🛍️</p>
      <p className="mt-3 font-display text-xl font-bold">Your shelves are empty!</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Head to the Davisville Flea Market and find treasures to resell.
      </p>
    </div>
  );
}

function VerdictPill({ verdict }: { verdict: "great" | "fair" | "lowball" }) {
  const map = {
    great:   { label: "Great offer!", cls: "bg-grass text-grass-dark border-grass-dark" },
    fair:    { label: "Fair",         cls: "bg-cream text-foreground border-wood-dark" },
    lowball: { label: "Lowball",      cls: "bg-[oklch(0.92_0.08_25)] text-[oklch(0.45_0.18_25)] border-[oklch(0.55_0.18_25)]" },
  } as const;
  const v = map[verdict];
  return (
    <span className={`rounded-full border-2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${v.cls}`}>
      {v.label}
    </span>
  );
}

function ShelfStrip({
  shelved, onReturn,
}: {
  shelved: { uid: string; itemId: string }[];
  onReturn: (uid: string) => void;
}) {
  if (shelved.length === 0) return null;
  return (
    <div className="rounded-2xl border-[3px] border-black bg-white p-3 shadow-[0_4px_0_#000]">
      <p className="mb-2 font-display text-xs font-extrabold uppercase tracking-widest text-black/70">
        Shelf
      </p>
      <div className="flex gap-2 overflow-x-auto">
        {shelved.map((entry) => {
          const item = getItem(entry.itemId);
          return (
            <button
              key={entry.uid}
              onClick={() => onReturn(entry.uid)}
              title="Bring back to the counter"
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 border-black bg-cream p-2 shadow-[0_3px_0_#000] active:translate-y-[2px] active:shadow-[0_1px_0_#000]"
            >
              <img
                src={item.image}
                alt={item.name}
                width={256}
                height={256}
                className="h-12 w-12 object-contain"
              />
              <span className="max-w-[64px] truncate text-[10px] font-extrabold text-black/70">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RegisterTape({ count, profit, best }: { count: number; profit: number; best: Sale | null }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border-[3px] border-black bg-white p-3 text-center shadow-[0_4px_0_#000]">
      <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-black/60">
        📜 Today's tape
      </p>
      <div className="mt-1 flex items-center justify-around text-sm">
        <div>
          <p className="font-display text-xl font-extrabold">{count}</p>
          <p className="text-[10px] uppercase text-muted-foreground">sold</p>
        </div>
        <div>
          <p className={`font-display text-xl font-extrabold ${profit >= 0 ? "text-grass-dark" : "text-destructive"}`}>
            {profit >= 0 ? "+" : "-"}${Math.abs(profit)}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground">profit</p>
        </div>
        {best && (
          <div>
            <p className="truncate font-display text-sm font-extrabold">{best.name}</p>
            <p className="text-[10px] uppercase text-muted-foreground">best</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCard({
  offer, item, pricePaid, isLearned, verdict, onAct, onShelve,
}: {
  offer: Offer;
  item: Item;
  pricePaid: number;
  isLearned: boolean;
  verdict: null | "great" | "fair" | "lowball";
  onAct: () => void;
  onShelve: () => void;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => { setLineIdx(0); }, [offer.id]);
  const lines = offer.lines.length > 0 ? offer.lines : [offer.customer.blurb];
  const isLastLine = lineIdx >= lines.length - 1;
  const isJunk = item.trueValue === 0;

  return (
    <motion.div
      layout
      key={offer.id}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      className="cozy-card relative flex flex-col items-center gap-3 p-4 text-center"
    >
      {/* Customer portrait with golden ring on arrival */}
      <motion.div
        key={`${offer.id}-portrait`}
        initial={{ boxShadow: "0 0 0 6px oklch(0.85 0.18 85)" }}
        animate={{ boxShadow: "0 0 0 0 oklch(0.85 0.18 85 / 0)" }}
        transition={{ duration: 1.6 }}
        className="rounded-full"
      >
        {offer.customer.image ? (
          <img
            src={offer.customer.image}
            alt={offer.customer.name}
            className="h-32 w-32 rounded-full border-[4px] border-black object-cover shadow-[0_5px_0_#000] sm:h-36 sm:w-36"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-[4px] border-black bg-cream text-6xl shadow-[0_5px_0_#000] sm:h-36 sm:w-36">
            {offer.customer.emoji}
          </div>
        )}
      </motion.div>
      <p className="font-display text-lg font-extrabold">{offer.customer.name}</p>

      {/* Progressive dialogue */}
      <div
        onClick={() => !isLastLine && setLineIdx((i) => i + 1)}
        className={`relative min-h-[68px] w-full rounded-2xl border-[3px] border-black bg-cream p-3 shadow-[0_4px_0_#000] ${!isLastLine ? "cursor-pointer" : ""}`}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-base font-semibold italic leading-snug text-black sm:text-lg"
          >
            "{lines[lineIdx]}"
          </motion.p>
        </AnimatePresence>
        {!isLastLine && (
          <p className="mt-1 text-right text-[10px] font-bold uppercase tracking-widest text-black/50">
            tap ▸
          </p>
        )}
      </div>

      {/* Item + offer price */}
      <div className="flex w-full items-center gap-3 rounded-2xl border-[3px] border-black bg-white p-3 shadow-[0_4px_0_#000]">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-wood-dark ${item.color}`}>
          <img src={item.image} alt={item.name} loading="lazy" width={512} height={512} className="h-14 w-14 object-contain" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-bold leading-tight">{item.name}</p>
          <p className="text-xs text-muted-foreground">You paid ${pricePaid}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Offers</p>
          <p className={`font-display text-2xl font-extrabold ${isJunk ? "text-muted-foreground" : "text-primary"}`}>
            ${offer.price}
          </p>
          {isLearned && verdict && (
            <div className="mt-0.5"><VerdictPill verdict={verdict} /></div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full gap-2">
        <button
          onClick={onShelve}
          className="flex-1 rounded-2xl border-[3px] border-black bg-muted py-3 font-display text-sm font-extrabold uppercase tracking-wider shadow-[0_4px_0_#000] active:translate-y-[3px] active:shadow-[0_1px_0_#000]"
        >
          🪑 Shelf it
        </button>
        <button
          onClick={onAct}
          disabled={!isLastLine}
          className="flex-[2] rounded-2xl border-[3px] border-black bg-accent py-3 font-display text-base font-extrabold uppercase tracking-wider text-accent-foreground shadow-[0_4px_0_#000] active:translate-y-[3px] active:shadow-[0_1px_0_#000] disabled:opacity-50"
        >
          {isJunk ? "Give to Daddy" : `Sell for $${offer.price}`}
        </button>
      </div>
    </motion.div>
  );
}
