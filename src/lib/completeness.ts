type ProfileFields = {
  companyName: string;
  industry: string;
  country: string;
  city: string;
  state: string | null;
  about: string | null;
  products: string | null;
  goals: string | null;
  website: string | null;
  size: string | null;
  status: string;
};

/**
 * Profile completeness score (0-100). Required signup fields give the base;
 * each optional section adds weight. Verified badge adds the final polish.
 */
export function completenessScore(p: ProfileFields, emailVerified: boolean): {
  score: number;
  missing: string[];
} {
  const missing: string[] = [];
  let score = 30; // base: account + required company fields exist

  const add = (ok: boolean, points: number, label: string) => {
    if (ok) score += points;
    else missing.push(label);
  };

  add(Boolean(p.about && p.about.length >= 20), 20, "About your business");
  add(Boolean(p.products && p.products.length >= 10), 15, "Products & services");
  add(Boolean(p.goals && p.goals.length >= 10), 15, "What you're looking for");
  add(Boolean(p.website), 5, "Website");
  add(Boolean(p.state), 5, "State/region");
  add(Boolean(p.size), 5, "Company size");
  add(emailVerified, 5, "Verify your email");

  return { score: Math.min(score, 100), missing };
}
