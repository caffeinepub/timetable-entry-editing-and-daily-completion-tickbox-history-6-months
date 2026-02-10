// Single source of truth for the 5 Level ranks
export const LEVEL_RANKS = [
  'Noob',
  'Beginner 📈',
  'Advanced Student 💪🏻',
  'Pro Student 🔥',
  'Sigma Student 🗿',
] as const;

// Normalize legacy rank values to the correct format
export function normalizeRank(rank: string): string {
  // Map legacy "Noob 🫠" to "Noob"
  if (rank === 'Noob 🫠') {
    return 'Noob';
  }
  
  // Return the rank as-is if it's already valid
  if (LEVEL_RANKS.includes(rank as any)) {
    return rank;
  }
  
  // Default fallback to Noob
  return 'Noob';
}
