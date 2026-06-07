import { motion } from "framer-motion";
import { useGame } from "@/lib/game/store";

export function Hud({
  view,
  onSwitch,
}: {
  view: "market" | "shop";
  onSwitch: (v: "market" | "shop") => void;
}) {
  const { state } = useGame();
  const inv = state.inventory.length;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center p-3 sm:p-5">
      <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-2 sm:gap-3">
        <div className="cozy-card flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3">
          {state.character?.image ? (
            <img
              src={state.character.image}
              alt={state.character.name}
              width={512}
              height={512}
              className="h-10 w-10 rounded-full border-[3px] border-black object-cover sm:h-12 sm:w-12"
            />
          ) : (
            <span className="text-2xl">🧑</span>
          )}
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Wallet</p>
            <motion.p
              key={state.money}
              initial={{ scale: 1.3, color: "var(--accent)" }}
              animate={{ scale: 1, color: "var(--foreground)" }}
              className="text-xl font-bold sm:text-2xl"
            >
              ${state.money}
            </motion.p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="cozy-card flex overflow-hidden p-1">
          <ToggleBtn active={view === "market"} onClick={() => onSwitch("market")}>
            <span className="mr-1">⛺</span> Market
          </ToggleBtn>
          <ToggleBtn active={view === "shop"} onClick={() => onSwitch("shop")}>
            <span className="mr-1">🏪</span> My Shop
            {inv > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                {inv}
              </span>
            )}
          </ToggleBtn>
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-bold transition sm:px-4 sm:text-base ${
        active ? "bg-primary text-primary-foreground shadow-[inset_0_2px_0_oklch(0.4_0.12_145)]" : "text-foreground hover:bg-secondary/60"
      }`}
    >
      {children}
    </button>
  );
}