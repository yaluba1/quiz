import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundSynthesizer } from '../../src/lib/sound-synthesizer';

describe('SoundSynthesizer', () => {
  beforeEach(() => {
    soundSynthesizer.setMuted(false);
  });

  it('plays tick sound when not muted', () => {
    expect(() => soundSynthesizer.playTick()).not.toThrow();
  });

  it('plays correct answer chime', () => {
    expect(() => soundSynthesizer.playCorrect()).not.toThrow();
  });

  it('plays incorrect buzzer sound', () => {
    expect(() => soundSynthesizer.playIncorrect()).not.toThrow();
  });

  it('plays podium fanfare sound', () => {
    expect(() => soundSynthesizer.playFanfare()).not.toThrow();
  });

  it('plays tap click sound', () => {
    expect(() => soundSynthesizer.playTap()).not.toThrow();
  });

  it('respects mute state', () => {
    soundSynthesizer.setMuted(true);
    expect(soundSynthesizer.getMuted()).toBe(true);
    expect(() => soundSynthesizer.playCorrect()).not.toThrow();
  });
});

