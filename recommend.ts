/**
 * Recommendation scoring for the discover deck.
 *
 * Deliberately a pure, pluggable function: rank(viewer, candidates) → sorted.
 * The scoring below is heuristic (industry affinity, locality, goal keyword
 * overlap, freshness). To go AI-driven, replace `scoreCandidate` with an
 * embedding-similarity lookup — the call sites don't change.
 */

export type RankableProfile = {
  userId: string;
  industry: string;
  country: string;
  city: string;
  goals: string | null;
  products: string | null;
  about: string | null;
  status: string;
  createdAt: Date;
};

const tokenize = (s: string | null) =>
  new Set(
    (s ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );

export function rankCandidates<T extends RankableProfile>(viewer: RankableProfile, candidates: T[]): T[] {
  const myGoals = tokenize(viewer.goals);
  const myOffer = tokenize(viewer.products);

  const scoreCandidate = (c: T): number => {
    let score = 0;
    // What they offer matching what I'm looking for (and vice versa).
    const theirOffer = tokenize(c.products);
    const theirGoals = tokenize(c.goals);
    for (const w of myGoals) if (theirOffer.has(w)) score += 6;
    for (const w of theirGoals) if (myOffer.has(w)) score += 6;
    // Complementary beats identical, but same industry still helps discovery.
    if (c.industry === viewer.industry) score += 3;
    // Locality.
    if (c.country === viewer.country) score += 4;
    if (c.city === viewer.city) score += 4;
    // Verified businesses surface higher.
    if (c.status === "VERIFIED") score += 5;
    // Freshness: newer profiles get a small boost (max ~3).
    const ageDays = (Date.now() - c.createdAt.getTime()) / 86_400_000;
    score += Math.max(0, 3 - ageDays / 10);
    return score;
  };

  return candidates
    .map((c) => ({ c, s: scoreCandidate(c) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}
