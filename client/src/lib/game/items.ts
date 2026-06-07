import teapotImg from "@/assets/items/teapot.png";
import lampImg from "@/assets/items/lamp.png";
import clockImg from "@/assets/items/clock.png";
import radioImg from "@/assets/items/radio.png";
import cameraImg from "@/assets/items/camera.png";
import vaseImg from "@/assets/items/vase.png";
import bookImg from "@/assets/items/book.png";
import violinImg from "@/assets/items/violin.png";
import trophyImg from "@/assets/items/trophy.png";
import compassImg from "@/assets/items/compass.png";
import keyImg from "@/assets/items/key.png";
import rocksImg from "@/assets/items/rocks.png";
import sockImg from "@/assets/items/sock.png";
import bananaImg from "@/assets/items/banana.png";
import strollerAsset from "@/assets/items/stroller.png.asset.json";
import scooterAsset from "@/assets/items/scooter.png.asset.json";
import dinerAsset from "@/assets/items/diner.png.asset.json";
import llamaAsset from "@/assets/items/llama.png.asset.json";
import unicornAsset from "@/assets/items/unicorn.png.asset.json";
import foxAsset from "@/assets/items/fox.png.asset.json";
import ampAsset from "@/assets/items/amp.png.asset.json";
import fishermanLampAsset from "@/assets/items/fisherman_lamp.png.asset.json";
import waterfallClockAsset from "@/assets/items/waterfall_clock.png.asset.json";
import pinballAsset from "@/assets/items/pinball.png.asset.json";
import antelopeAsset from "@/assets/items/antelope.png.asset.json";
import tuskAsset from "@/assets/items/tusk.png.asset.json";
import guitarAsset from "@/assets/items/guitar.png.asset.json";
import catPlaqueAsset from "@/assets/items/cat_plaque.png.asset.json";
import mommyImg from "@/assets/characters/mommy.png";
import daddyImg from "@/assets/characters/daddy.png";

export type Item = {
  id: string;
  name: string;
  icon: string; // emoji as flat-cartoon stand-in
  image: string; // hand-drawn illustration
  color: string; // tailwind bg class for the chip
  trueValue: number; // hidden until learned
  minAsk: number;
  maxAsk: number;
};

/** Asking prices are tuned so a mix of good deals, slight overpays, and junk emerge.
 *  Junk items have trueValue 0 — Daddy hauls them away for free. */
export const CATALOG: Item[] = [
  { id: "teapot",   name: "Old Teapot",     icon: "🫖", image: teapotImg,  color: "bg-[oklch(0.9_0.05_70)]",  trueValue: 35, minAsk: 15, maxAsk: 45 },
  { id: "lamp",     name: "Brass Lamp",     icon: "🪔", image: lampImg,    color: "bg-[oklch(0.85_0.1_80)]",  trueValue: 50, minAsk: 25, maxAsk: 65 },
  { id: "clock",    name: "Mantel Clock",   icon: "🕰️", image: clockImg,   color: "bg-[oklch(0.85_0.06_50)]", trueValue: 60, minAsk: 30, maxAsk: 75 },
  { id: "radio",    name: "Tube Radio",     icon: "📻", image: radioImg,   color: "bg-[oklch(0.78_0.08_40)]", trueValue: 45, minAsk: 20, maxAsk: 55 },
  { id: "camera",   name: "Box Camera",     icon: "📷", image: cameraImg,  color: "bg-[oklch(0.78_0.04_60)]", trueValue: 40, minAsk: 15, maxAsk: 50 },
  { id: "vase",     name: "Painted Vase",   icon: "🏺", image: vaseImg,    color: "bg-[oklch(0.85_0.07_30)]", trueValue: 30, minAsk: 10, maxAsk: 40 },
  { id: "book",     name: "Storybook",      icon: "📕", image: bookImg,    color: "bg-[oklch(0.85_0.08_25)]", trueValue: 20, minAsk: 5,  maxAsk: 25 },
  { id: "violin",   name: "Tiny Violin",    icon: "🎻", image: violinImg,  color: "bg-[oklch(0.78_0.1_50)]",  trueValue: 75, minAsk: 35, maxAsk: 90 },
  { id: "trophy",   name: "Old Trophy",     icon: "🏆", image: trophyImg,  color: "bg-[oklch(0.9_0.13_90)]",  trueValue: 25, minAsk: 10, maxAsk: 35 },
  { id: "compass",  name: "Brass Compass",  icon: "🧭", image: compassImg, color: "bg-[oklch(0.82_0.08_180)]",trueValue: 40, minAsk: 15, maxAsk: 50 },
  { id: "key",      name: "Skeleton Key",   icon: "🗝️", image: keyImg,     color: "bg-[oklch(0.85_0.1_85)]",  trueValue: 15, minAsk: 5,  maxAsk: 20 },
  { id: "rocks",    name: "Bag of Rocks",   icon: "🪨", image: rocksImg,   color: "bg-[oklch(0.7_0.02_60)]",  trueValue: 0,  minAsk: 5,  maxAsk: 20 },
  { id: "sock",     name: "Lonely Sock",    icon: "🧦", image: sockImg,    color: "bg-[oklch(0.85_0.06_330)]",trueValue: 0,  minAsk: 5,  maxAsk: 15 },
  { id: "banana",   name: "Old Banana",     icon: "🍌", image: bananaImg,  color: "bg-[oklch(0.9_0.15_100)]", trueValue: 0,  minAsk: 5,  maxAsk: 10 },
  { id: "stroller",        name: "Cry Babies Stroller", icon: "🛒", image: strollerAsset.url,       color: "bg-[oklch(0.88_0.08_350)]", trueValue: 40, minAsk: 20, maxAsk: 55 },
  { id: "scooter",         name: "Cruisy Scooter",      icon: "🛵", image: scooterAsset.url,        color: "bg-[oklch(0.78_0.15_30)]",  trueValue: 70, minAsk: 35, maxAsk: 90 },
  { id: "diner",           name: "Diner Music Box",     icon: "🍔", image: dinerAsset.url,          color: "bg-[oklch(0.82_0.1_25)]",   trueValue: 55, minAsk: 25, maxAsk: 70 },
  { id: "llama",           name: "Pink Llama Plush",    icon: "🦙", image: llamaAsset.url,          color: "bg-[oklch(0.9_0.06_350)]",  trueValue: 25, minAsk: 10, maxAsk: 35 },
  { id: "unicorn",         name: "Unicorn Plush",       icon: "🦄", image: unicornAsset.url,        color: "bg-[oklch(0.9_0.07_300)]",  trueValue: 30, minAsk: 15, maxAsk: 40 },
  { id: "fox",             name: "Red Fox Plush",       icon: "🦊", image: foxAsset.url,            color: "bg-[oklch(0.78_0.12_30)]",  trueValue: 30, minAsk: 15, maxAsk: 40 },
  { id: "amp",             name: "Fender Amp",          icon: "🎚️", image: ampAsset.url,            color: "bg-[oklch(0.78_0.1_70)]",   trueValue: 80, minAsk: 40, maxAsk: 100 },
  { id: "fisherman_lamp",  name: "Fisherman Lamp",      icon: "💡", image: fishermanLampAsset.url,  color: "bg-[oklch(0.85_0.08_75)]",  trueValue: 45, minAsk: 20, maxAsk: 60 },
  { id: "waterfall_clock", name: "Waterfall Clock",     icon: "⏰", image: waterfallClockAsset.url, color: "bg-[oklch(0.82_0.06_200)]", trueValue: 50, minAsk: 25, maxAsk: 65 },
  { id: "pinball",         name: "Big Indian Pinball",  icon: "🎰", image: pinballAsset.url,        color: "bg-[oklch(0.78_0.12_40)]",  trueValue: 90, minAsk: 45, maxAsk: 115 },
  { id: "antelope",        name: "Antelope Statue",     icon: "🦌", image: antelopeAsset.url,       color: "bg-[oklch(0.55_0.08_160)]", trueValue: 40, minAsk: 20, maxAsk: 55 },
  { id: "tusk",            name: "Scrimshaw Tusk",      icon: "🦴", image: tuskAsset.url,           color: "bg-[oklch(0.85_0.06_70)]",  trueValue: 60, minAsk: 30, maxAsk: 75 },
  { id: "guitar",          name: "Purple Guitar",       icon: "🎸", image: guitarAsset.url,         color: "bg-[oklch(0.7_0.15_300)]",  trueValue: 85, minAsk: 40, maxAsk: 110 },
  { id: "cat_plaque",      name: "Cat Plaque",          icon: "🐱", image: catPlaqueAsset.url,      color: "bg-[oklch(0.7_0.15_30)]",   trueValue: 25, minAsk: 10, maxAsk: 35 },
];

export const getItem = (id: string) => CATALOG.find((i) => i.id === id)!;

/** Pick a believable asking price using whole-dollar multiples of 5. */
export function rollAskingPrice(item: Item): number {
  const range = item.maxAsk - item.minAsk;
  const raw = item.minAsk + Math.floor(Math.random() * (range + 1));
  return Math.max(10, Math.round(raw / 10) * 10);
}

/** A small stall offers 3 random items. */
export function rollStall(seed?: number): { id: string; askingPrice: number }[] {
  const pool = [...CATALOG];
  const out: { id: string; askingPrice: number }[] = [];
  for (let i = 0; i < 3; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    const it = pool.splice(idx, 1)[0];
    out.push({ id: it.id, askingPrice: rollAskingPrice(it) });
  }
  return out;
}

export type Customer = {
  id: "nana" | "mommy" | "daddy";
  name: string;
  emoji: string;
  image?: string;
  blurb: string;
  lines: string[];
};

export const CUSTOMERS: Record<Customer["id"], Customer> = {
  nana: {
    id: "nana", name: "Nana", emoji: "👵",
    blurb: "Oh my, that's lovely!",
    lines: [
      "Oh sweetie, look at this!",
      "It reminds me of my own grandmother.",
      "I simply MUST have it for my collection.",
      "My word, what a treasure!",
      "I haven't seen one of these in years.",
      "This would look darling on my mantle.",
      "Bless your heart, you've got good taste.",
      "I'll pop it right in my handbag.",
      "What a lovely little find!",
      "Oh dear, I really shouldn't… but I must!",
    ],
  },
  mommy: {
    id: "mommy", name: "Mommy", emoji: "👩", image: mommyImg,
    blurb: "I'll take it home!",
    lines: [
      "Ooh, what a find!",
      "This would look perfect on the mantle.",
      "Okay, I'll take it home — name your price!",
      "The kids would love this!",
      "Hmm, this matches the kitchen perfectly.",
      "What a unique piece!",
      "I've been looking for something just like this.",
      "Quick — before I change my mind!",
      "Sold! Wrap it up please.",
      "This is going straight on Instagram.",
    ],
  },
  daddy: {
    id: "daddy", name: "Daddy", emoji: "👨", image: daddyImg,
    blurb: "I'll take this off your hands.",
    lines: [
      "Hmm, let's see what we've got here...",
      "Tell you what, I'll haul it away for you.",
      "Free of charge — call it a favor.",
      "Don't worry, I know just where this goes.",
      "Out with the old, in with the new!",
      "I'll add it to the garage pile.",
      "Trust me, nobody's paying for that.",
      "Hand it over, kiddo.",
    ],
  },
};

/** Shuffle a pool and return 2–3 random lines so each visit feels fresh. */
export function pickCustomerLines(customer: Customer): string[] {
  const pool = customer.lines && customer.lines.length > 0 ? customer.lines : [customer.blurb];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const count = Math.min(pool.length, 2 + Math.floor(Math.random() * 2)); // 2 or 3
  return shuffled.slice(0, count);
}

/** Nana/Mommy pay roughly true value (±20%). Daddy pays $0 for junk. */
export function rollCustomerOffer(item: Item): { customer: Customer; price: number } {
  if (item.trueValue === 0) {
    return { customer: CUSTOMERS.daddy, price: 0 };
  }
  const wobble = 0.8 + Math.random() * 0.4; // 0.8x .. 1.2x
  const raw = item.trueValue * wobble;
  const price = Math.max(10, Math.round(raw / 10) * 10);
  const customer = Math.random() < 0.5 ? CUSTOMERS.nana : CUSTOMERS.mommy;
  return { customer, price };
}