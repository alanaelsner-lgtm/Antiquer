import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import bgAsset from "@/assets/saturday-bg.png.asset.json";
import { CHARACTERS, type Character } from "@/lib/game/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Davisville Flea Market" },
      { name: "description", content: "Sign in and start hunting for treasures at the Davisville Flea Market." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "character">("name");

  const onName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try { localStorage.setItem("antiquer:player", trimmed); } catch {}
    setStep("character");
  };

  const onPick = (c: Character) => {
    try { localStorage.setItem("antiquer:character", c.id); } catch {}
    navigate({ to: "/play" });
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Saturday morning backdrop */}
      <img
        src={bgAsset.url}
        alt=""
        aria-hidden
        width={1536}
        height={1024}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-4 py-6">
        {/* The Sign */}
        <motion.div
          initial={{ y: -60, opacity: 0, rotate: -4 }}
          animate={{ y: 0, opacity: 1, rotate: -2 }}
          transition={{ type: "spring", stiffness: 160, damping: 12 }}
          className="relative"
        >
          {/* posts behind the sign */}
          <div className="pointer-events-none absolute left-[18%] top-full h-44 w-4 -translate-x-1/2 rounded-b-md border-x-[3px] border-b-[3px] border-black bg-[oklch(0.6_0.12_45)]" />
          <div className="pointer-events-none absolute right-[18%] top-full h-44 w-4 -translate-x-1/2 rounded-b-md border-x-[3px] border-b-[3px] border-black bg-[oklch(0.6_0.12_45)]" />

          <div className="relative rounded-[28px] border-[5px] border-black bg-[oklch(0.97_0.04_85)] px-6 py-4 shadow-[0_10px_0_#000] sm:px-12 sm:py-6">
            <p
              className="font-display text-4xl font-extrabold leading-none tracking-wide text-[oklch(0.55_0.22_28)] sm:text-6xl"
              style={{ WebkitTextStroke: "3px #000", paintOrder: "stroke fill" }}
            >
              DAVI<span className="inline-block -scale-x-100">S</span>VILLE
            </p>
            <p
              className="mt-1 font-display text-2xl font-extrabold tracking-[0.15em] text-black sm:text-4xl"
            >
              FLEA MARKET
            </p>
          </div>
        </motion.div>

        <div className="mt-10 w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "name" ? (
              <motion.form
                key="name"
                onSubmit={onName}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                className="rounded-[28px] border-[5px] border-black bg-[oklch(0.97_0.04_85)] p-5 shadow-[0_10px_0_#000] sm:p-6"
              >
                <h1 className="font-display text-3xl font-extrabold text-black sm:text-4xl">
                  Howdy, antiquer!
                </h1>
                <p className="mt-1 text-sm font-semibold text-black/70">
                  What should we call you at the market?
                </p>

                <label className="mt-5 block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/70">
                    Your name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    autoFocus
                    placeholder="e.g. Quinn"
                    className="mt-1 w-full rounded-2xl border-[3px] border-black bg-white px-4 py-3 font-display text-2xl font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-4 focus:ring-[oklch(0.78_0.18_85)]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="mt-5 block w-full rounded-2xl border-[4px] border-black bg-[oklch(0.55_0.22_28)] py-4 font-display text-2xl font-extrabold uppercase tracking-wider text-white shadow-[0_6px_0_#000] transition active:translate-y-[3px] active:shadow-[0_3px_0_#000] disabled:opacity-50"
                >
                  ▶ Next
                </button>

                <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">
                  No password — saves on this device
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="character"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                className="rounded-[28px] border-[5px] border-black bg-[oklch(0.97_0.04_85)] p-5 shadow-[0_10px_0_#000] sm:p-6"
              >
                <h1 className="font-display text-3xl font-extrabold text-black sm:text-4xl">
                  Nice to meet you, {name.trim()}!
                </h1>
                <p className="mt-1 text-sm font-semibold text-black/70">
                  Pick your antiquer to start hunting for treasure.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {CHARACTERS.map((c) => (
                    <motion.button
                      key={c.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onPick(c)}
                      className="flex flex-col items-center gap-1 rounded-3xl border-[4px] border-black bg-[oklch(0.85_0.11_230)] p-3 shadow-[0_6px_0_#000]"
                    >
                      <img
                        src={c.image}
                        alt={c.name}
                        width={512}
                        height={512}
                        className="h-20 w-20 rounded-2xl border-[3px] border-black bg-white object-cover sm:h-24 sm:w-24"
                      />
                      <span className="mt-1 font-display text-lg font-extrabold text-black">{c.name}</span>
                      <span className="text-[11px] font-semibold text-black/70">{c.hat}</span>
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={() => setStep("name")}
                  className="mt-4 w-full rounded-2xl border-[3px] border-black bg-white py-2 font-bold text-black shadow-[0_4px_0_#000] active:translate-y-[2px] active:shadow-[0_2px_0_#000]"
                >
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}