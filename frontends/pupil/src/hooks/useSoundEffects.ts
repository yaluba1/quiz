'use client';

import { useState, useEffect } from 'react';
import { soundSynthesizer } from '../lib/sound-synthesizer';

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('quiz_muted');
    if (saved !== null) {
      const muted = saved === 'true';
      setIsMuted(muted);
      soundSynthesizer.setMuted(muted);
    }
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundSynthesizer.setMuted(nextMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_muted', String(nextMuted));
    }
  };

  return {
    isMuted,
    toggleMute,
    playTick: () => soundSynthesizer.playTick(),
    playCorrect: () => soundSynthesizer.playCorrect(),
    playIncorrect: () => soundSynthesizer.playIncorrect(),
    playFanfare: () => soundSynthesizer.playFanfare(),
    playTap: () => soundSynthesizer.playTap(),
  };
}

