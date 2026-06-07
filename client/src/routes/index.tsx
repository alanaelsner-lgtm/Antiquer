import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FleaMarketBackdrop } from "@/components/game/Scenery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Antiquer — Davisville Flea Market" },
      { name: "description", content: "A cozy buy-low, sell-high antique flea market game for kids ages 7–10." },
      { property: "og:title", content: "Antiquer — Davisville Flea Market" },
      { property: "og:description", content: "A cozy buy-low, sell-high antique flea market game for kids ages 7–10." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <FleaMarketBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
        {/* Davisville sign */}
        <motion.div
          initial={{ y: -40, opacity: 0, rotate: -3 }}
          animate={{ y: 0, opacity: 1, rotate: -2 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="relative"
        >
          {/* signpost */}
          <div className="pointer-events-none absolute left-[20%] top-full h-40 w-4 -translate-x-1/2 rounded-b-md border-x-[3px] border-b-[3px] border-black bg-[oklch(0.6_0.12_45)]" />
          <div className="pointer-events-none absolute right-[20%] top-full h-40 w-4 -translate-x-1/2 rounded-b-md border-x-[3px] border-b-[3px] border-black bg-[oklch(0.6_0.12_45)]" />
          <div className="relative rounded-[28px] border-[5px] border-black bg-cream px-8 py-5 shadow-[0_10px_0_#000] sm:px-12 sm:py-6">
            <p
              className="font-display text-4xl font-extrabold leading-none tracking-wide text-[oklch(0.55_0.22_28)] sm:text-6xl cartoon-text-stroke"
            >
              DAVI<span className="inline-block -scale-x-100">S</span>VILLE
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-[0.18em] text-black sm:text-4xl">
              FLEA MARKET
            </p>
          </div>
        </motion.div>

        <div className="mt-32 max-w-xl">
          <h1 className="font-display text-4xl font-bold text-foreground drop-shadow-[0_2px_0_oklch(0.97_0.03_90)] sm:text-5xl">
            Antiquer
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-foreground/80 sm:text-lg">
            Hunt for treasures at the flea market, then resell them at your own
            cozy antique shop. Buy low, sell high, and learn what things are worth!
          </p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-7 flex flex-col items-center gap-3"
          >
            <Link
              to="/login"
              className="rounded-2xl border-[3px] border-wood-dark bg-accent px-10 py-4 font-display text-2xl font-bold text-accent-foreground shadow-[0_8px_0_var(--wood-dark)] transition active:translate-y-1 active:shadow-[0_4px_0_var(--wood-dark)]"
            >
              ▶ Play
            </Link>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
              For ages 7–10 · saves automatically
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
