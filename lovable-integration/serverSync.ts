/**
 * serverSync.ts
 * Thin layer that syncs game state to the Railway backend.
 * Drop this into src/lib/ in your Lovable project.
 */

const API = "https://antiquer-production-cd24.up.railway.app";

export type ServerPlayer = {
  id: string;
  username: string;
  character: string | null;
  money: number;
  inventory: { id: string; name: string; paidPrice: number }[];
  learned_values: string[];
};

/** Sign up or log in. Returns the player record. */
export async function authPlayer(
  username: string,
  pin: string,
  isNew: boolean
): Promise<ServerPlayer | null> {
  try {
    const res = await fetch(`${API}/auth/${isNew ? "signup" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Auth failed");
    }
    const { player } = await res.json();
    return player as ServerPlayer;
  } catch (e) {
    console.warn("serverSync: auth failed:", e);
    return null;
  }
}

/** Save current money + inventory to Supabase via Railway. Fire-and-forget. */
export async function saveProgress(
  playerId: string,
  money: number,
  inventory: { id: string; name: string; paidPrice: number }[],
  learnedValues: string[],
  character: string
): Promise<void> {
  try {
    await fetch(`${API}/auth/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        money,
        inventory,
        learned_values: learnedValues,
        character,
      }),
    });
  } catch (e) {
    console.warn("serverSync: save failed (offline?):", e);
  }
}
