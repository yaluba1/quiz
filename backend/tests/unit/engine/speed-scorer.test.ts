import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  getStreakMultiplier,
} from '../../../src/engine/scoring/speed-scorer.js';

describe('Speed-Weighted Scoring Engine', () => {
  describe('getStreakMultiplier', () => {
    it('returns 1.0 for streaks 0 and 1', () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
      expect(getStreakMultiplier(1)).toBe(1.0);
    });

    it('returns 1.1 for streak 2', () => {
      expect(getStreakMultiplier(2)).toBe(1.1);
    });

    it('returns 1.2 for streak 3', () => {
      expect(getStreakMultiplier(3)).toBe(1.2);
    });

    it('returns 1.3 for streak 4', () => {
      expect(getStreakMultiplier(4)).toBe(1.3);
    });

    it('returns 1.5 for streak 5 and above', () => {
      expect(getStreakMultiplier(5)).toBe(1.5);
      expect(getStreakMultiplier(10)).toBe(1.5);
    });
  });

  describe('calculateScore', () => {
    it('returns 0 points and resets streak if answer is incorrect', () => {
      const result = calculateScore({
        basePoints: 1000,
        responseTimeMs: 2000,
        timeLimitMs: 20000,
        isCorrect: false,
        currentStreak: 4,
      });

      expect(result.pointsEarned).toBe(0);
      expect(result.newStreak).toBe(0);
      expect(result.streakMultiplier).toBe(1.0);
    });

    it('returns 0 points if basePoints is 0', () => {
      const result = calculateScore({
        basePoints: 0,
        responseTimeMs: 1000,
        timeLimitMs: 20000,
        isCorrect: true,
        currentStreak: 0,
      });

      expect(result.pointsEarned).toBe(0);
      expect(result.newStreak).toBe(0);
    });

    it('awards maximum points for near-instant answers (delta_t = 0)', () => {
      const result = calculateScore({
        basePoints: 1000,
        responseTimeMs: 0,
        timeLimitMs: 20000,
        isCorrect: true,
        currentStreak: 0,
      });

      // 1000 * (1 - 0) * 1.0 = 1000
      expect(result.pointsEarned).toBe(1000);
      expect(result.newStreak).toBe(1);
      expect(result.streakMultiplier).toBe(1.0);
    });

    it('awards half points at the last millisecond (delta_t = T_max)', () => {
      const result = calculateScore({
        basePoints: 1000,
        responseTimeMs: 20000,
        timeLimitMs: 20000,
        isCorrect: true,
        currentStreak: 0,
      });

      // 1000 * (1 - 20000 / 40000) = 1000 * 0.5 = 500
      expect(result.pointsEarned).toBe(500);
      expect(result.newStreak).toBe(1);
    });

    it('awards 750 points at half-time (delta_t = T_max / 2)', () => {
      const result = calculateScore({
        basePoints: 1000,
        responseTimeMs: 10000,
        timeLimitMs: 20000,
        isCorrect: true,
        currentStreak: 0,
      });

      // 1000 * (1 - 10000 / 40000) = 1000 * 0.75 = 750
      expect(result.pointsEarned).toBe(750);
    });

    it('scales properly with streak multipliers', () => {
      const result = calculateScore({
        basePoints: 1000,
        responseTimeMs: 0,
        timeLimitMs: 20000,
        isCorrect: true,
        currentStreak: 4, // newStreak will be 5 -> 1.5x
      });

      // 1000 * 1.0 * 1.5 = 1500
      expect(result.pointsEarned).toBe(1500);
      expect(result.newStreak).toBe(5);
      expect(result.streakMultiplier).toBe(1.5);
    });

    it('clamps responseTimeMs to timeLimitMs if response time exceeds limit', () => {
      const result = calculateScore({
        basePoints: 1000,
        responseTimeMs: 30000,
        timeLimitMs: 20000,
        isCorrect: true,
        currentStreak: 0,
      });

      expect(result.pointsEarned).toBe(500);
    });
  });
});

