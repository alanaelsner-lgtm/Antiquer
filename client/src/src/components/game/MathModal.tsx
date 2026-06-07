import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Op = "add" | "sub";

export function MathModal({
  open,
  op,
  a,
  b,
  prompt,
  onCancel,
  onCorrect,
  confirmLabel = "Done!",
}: {
  open: boolean;
  op: Op;
  a: number;
  b: number;
  prompt: string;
  onCancel: () => void;
  onCorrect: () => void;
  confirmLabel?: string;
}) {
  const answer = useMemo(() => (op === "add" ? a + b : a - b), [op, a, b]);
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => { if (open) { setValue(""); setHint(null); } }, [open, a, b, op]);

  const submit = () => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n === answer) {
      onCorrect();
    } else {
      setShake(true);
      setHint("Not quite! Try again, or tap Back to walk away.");
      setTimeout(() => setShake(false), 400);
    }
  };

  const tap = (digit: string) => {
    if (digit === "←") return setValue((v) => v.slice(0, -1));
    if (digit === "C") return setValue("");
    setValue((v) => (v + digit).slice(0, 4));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.2_0.04_50/0.55)] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="cozy-card w-full max-w-md p-6"
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: shake ? [1, 1.04, 0.96, 1] : 1, y: 0, x: shake ? [0, -8, 8, -4, 4, 0] : 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-lg leading-snug font-semibold text-foreground">{prompt}</p>

            <div className="my-5 flex items-center justify-center gap-3 text-3xl font-bold text-foreground">
              <span className="rounded-2xl bg-secondary px-4 py-2">${a}</span>
              <span className="text-accent">{op === "add" ? "+" : "−"}</span>
              <span className="rounded-2xl bg-secondary px-4 py-2">${b}</span>
              <span className="text-muted-foreground">=</span>
              <span className="min-w-[5rem] rounded-2xl border-[3px] border-dashed border-wood-dark bg-cream px-4 py-2 text-center">
                {value || "?"}
              </span>
            </div>

            {hint && <p className="mb-3 text-center text-sm font-semibold text-accent">{hint}</p>}

            <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9","C","0","←"].map((k) => (
                <button
                  key={k}
                  onClick={() => tap(k)}
                  className="rounded-2xl border-2 border-wood-dark bg-cream py-4 text-2xl font-bold text-foreground shadow-[0_3px_0_var(--wood-dark)] active:translate-y-[2px] active:shadow-[0_1px_0_var(--wood-dark)]"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onCancel}
                className={`flex-1 rounded-2xl border-2 border-wood-dark py-3 font-bold text-foreground shadow-[0_4px_0_var(--wood-dark)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--wood-dark)] ${hint ? "bg-destructive/20 text-destructive" : "bg-muted"}`}
              >
                ← Back
              </button>
              <button
                onClick={submit}
                disabled={!value}
                className="flex-[2] rounded-2xl border-2 border-wood-dark bg-primary py-3 font-bold text-primary-foreground shadow-[0_4px_0_var(--wood-dark)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--wood-dark)] disabled:opacity-50"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}