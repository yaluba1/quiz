import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundEffects } from '../../src/hooks/useSoundEffects';

describe('useSoundEffects hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes sound state and allows toggling mute', () => {
    const { result } = renderHook(() => useSoundEffects());
    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(true);
    expect(localStorage.getItem('quiz_muted')).toBe('true');

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(false);
  });

  it('triggers sound playback methods without throwing', () => {
    const { result } = renderHook(() => useSoundEffects());
    expect(() => result.current.playTick()).not.toThrow();
    expect(() => result.current.playCorrect()).not.toThrow();
    expect(() => result.current.playIncorrect()).not.toThrow();
    expect(() => result.current.playFanfare()).not.toThrow();
    expect(() => result.current.playTap()).not.toThrow();
  });
});

