import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { GameProvider, useGame, CHARACTERS } from "@/lib/game/store";
import { Hud } from "@/components/game/Hud";
import { MarketScene } from "@/components/game/MarketScene";
import { ShopScene } from "@/components/game/ShopScene";
import { FleaMarketBackdrop } from "@/components/game/Scenery";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play Antiquer" },
      { name: "description", content: "Buy low and sell high at the Davisville Flea Market." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  return (
    <GameProvider>
      <PlayInner />
      <Toaster position="bottom-center" richColors closeButton={false} />
    </GameProvider>
  );
}

function PlayInner() {
  const { state, pickCharacter } = useGame();
  const navigate = useNavigate();
  const [view, setView] = useState<"market" | "shop">("market");

  // If we arrived without a character, try to hydrate from login, otherwise send back.
  useEffect(() => {
    if (state.character) return;
    try {
      const id = localStorage.getItem("antiquer:character");
      const found = CHARACTERS.find((c) => c.id === id);
      if (found) {
        pickCharacter(found);
        return;
      }
    } catch {}
    navigate({ to: "/login" });
  }, [state.character, pickCharacter, navigate]);

  if (!state.character) {
    return (
      <div className="relative min-h-screen w-full">
        <FleaMarketBackdrop />
      </div>
    );
  }

  return (
    <>
      <Hud view={view} onSwitch={setView} />
      {view === "market" ? <MarketScene /> : <ShopScene />}
      {state.money <= 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
          <div className="cozy-card px-5 py-3 text-center">
            <p className="font-bold">Oh no, you ran out of money!</p>
            <p className="text-sm text-muted-foreground">Here's a fresh $100 — keep going!</p>
          </div>
        </div>
      )}
    </>
  );
}