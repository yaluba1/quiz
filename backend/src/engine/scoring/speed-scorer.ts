/**
 * Speed-Weighted Scoring Calculator and Streak Engine.
 *
 * Formula:
 *   Score = BasePoints * (1 - (Delta_t / (2 * T_max))) * StreakMultiplier
 */

export interface ScoreCalculationInput {
  basePoints: number;
  responseTimeMs: number;
  timeLimitMs: number;
  isCorrect: boolean;
  currentStreak: number;
}

export interface ScoreCalculationResult {
  pointsEarned: number;
  newStreak: number;
  streakMultiplier: number;
}

export function getStreakMultiplier(streak: number): number {
  if (streak <= 1) return 1.0;
  if (streak === 2) return 1.1;
  if (streak === 3) return 1.2;
  if (streak === 4) return 1.3;
  return 1.5; // 5 or higher
}

export function calculateScore(input: ScoreCalculationInput): ScoreCalculationResult {
  if (!input.isCorrect || input.basePoints <= 0) {
    return {
      pointsEarned: 0,
      newStreak: 0,
      streakMultiplier: 1.0,
    };
  }

  const newStreak = input.currentStreak + 1;
  const streakMultiplier = getStreakMultiplier(newStreak);

  const deltaT = Math.max(0, Math.min(input.responseTimeMs, input.timeLimitMs));
  const maxT = Math.max(1000, input.timeLimitMs); // Guard against zero-division

  // Speed factor ranges from 1.0 (instant answer) down to 0.5 (last millisecond)
  const speedFactor = 1 - deltaT / (2 * maxT);

  const rawScore = input.basePoints * speedFactor * streakMultiplier;
  const pointsEarned = Math.round(rawScore);

  return {
    pointsEarned,
    newStreak,
    streakMultiplier,
  };
}

