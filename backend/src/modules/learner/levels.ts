// Provisional, deliberately simple leveling curve — flat 500 XP per level
// with a handful of title tiers. No exact numbers were specified anywhere;
// this is easy to retune later without touching any stored data, since
// level/title are always derived from total_xp, never persisted themselves.
const XP_PER_LEVEL = 500;

const TITLE_TIERS: Array<{ minLevel: number; title: string }> = [
  { minLevel: 1, title: 'Trainee' },
  { minLevel: 6, title: 'Associate' },
  { minLevel: 11, title: 'Specialist' },
  { minLevel: 16, title: 'Expert' },
  { minLevel: 21, title: 'Master' },
];

function titleForLevel(level: number): string {
  return TITLE_TIERS.filter((t) => t.minLevel <= level).pop()?.title ?? 'Trainee';
}

export function computeLevel(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  return {
    level,
    levelTitle: titleForLevel(level),
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
  };
}
