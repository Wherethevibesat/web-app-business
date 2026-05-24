export function tierForPoints(points: number) {
  if (points >= 100_000) return "Influencers";
  if (points >= 50_000) return "Vibesetters";
  if (points >= 25_000) return "Vibe Champion";
  if (points >= 10_000) return "Vibe Master";
  if (points >= 500) return "Vibee";
  return "New";
}
