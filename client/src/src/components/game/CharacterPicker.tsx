import { motion } from "framer-motion";
import { CHARACTERS, useGame, type Character } from "@/lib/game/store";

export function CharacterPicker({ onPicked }: { onPicked: () => void }) {
  const { pickCharacter } = useGame();

  const pick = (c: Character) => { pickCharacter(c); onPicked(); };

  return (
    <div className="cozy-card mx-auto w-full max-w-lg p-6 text-center">
      <p className="font-display text-2xl font-bold">Pick your antiquer</p>
      <p className="mt-1 text-sm text-muted-foreground">You'll start with $100 and a head full of ideas.</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {CHARACTERS.map((c) => (
          <motion.button
            key={c.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => pick(c)}
            className="flex flex-col items-center gap-1 rounded-3xl border-[3px] border-wood-dark bg-secondary p-5 shadow-[0_6px_0_var(--wood-dark)]"
          >
            <img
              src={c.image}
              alt={c.name}
              width={512}
              height={512}
              className="h-20 w-20 rounded-2xl border-[3px] border-wood-dark bg-white object-cover sm:h-24 sm:w-24"
            />
            <span className="font-display text-xl font-bold">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.hat}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}