/** Small deterministic PRNG (mulberry32) so mock numbers are identical on every run. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string (FNV-1a), used to derive per-tour seeds. */
export function hashString(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = ReturnType<typeof mulberry32>;

export const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
export const intBetween = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));
export const pick = <T,>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)];
