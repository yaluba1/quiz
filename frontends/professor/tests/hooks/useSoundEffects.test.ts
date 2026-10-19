import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundEffects } from '../../src/hooks/useSoundEffects';
import { hostSounds } from '../../src/lib/sound-synthesizer';

describe('useSoundEffects Hook Tests', () => {
  it('toggles mute and triggers sound methods', () => {
    const playJoinedSpy = vi.spyOn(hostSounds, 'playPlayerJoined');
    const playTickSpy = vi.spyOn(hostSounds, 'playTick');
    const playTimeUpSpy = vi.spyOn(hostSounds, 'playTimeUp');
    const playFanfareSpy = vi.spyOn(hostSounds, 'playFanfare');

    const { result } = renderHook(() => useSoundEffects());

    act(() => {
      result.current.playPlayerJoined();
      result.current.playTick();
      result.current.playTimeUp();
      result.current.playFanfare();
    });

    expect(playJoinedSpy).toHaveBeenCalled();
    expect(playTickSpy).toHaveBeenCalled();
    expect(playTimeUpSpy).toHaveBeenCalled();
    expect(playFanfareSpy).toHaveBeenCalled();

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(true);
  });
});

