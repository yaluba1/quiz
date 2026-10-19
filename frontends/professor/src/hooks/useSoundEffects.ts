'use client';

import { useState, useCallback } from 'react';
import { hostSounds } from '../lib/sound-synthesizer';

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState<boolean>(() => hostSounds.getMuted());

  const toggleMute = useCallback(() => {
    const next = hostSounds.toggleMute();
    setIsMuted(next);
  }, []);

  const playPlayerJoined = useCallback(() => {
    hostSounds.playPlayerJoined();
  }, []);

  const playTick = useCallback(() => {
    hostSounds.playTick();
  }, []);

  const playTimeUp = useCallback(() => {
    hostSounds.playTimeUp();
  }, []);

  const playFanfare = useCallback(() => {
    hostSounds.playFanfare();
  }, []);

  return {
    isMuted,
    toggleMute,
    playPlayerJoined,
    playTick,
    playTimeUp,
    playFanfare,
  };
}

