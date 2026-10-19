import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptics } from '../../src/hooks/useHaptics';

describe('useHaptics hook', () => {
  it('calls navigator.vibrate when supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHaptics());
    result.current.tap();
    expect(vibrateMock).toHaveBeenCalledWith(15);

    result.current.success();
    expect(vibrateMock).toHaveBeenCalledWith([30, 40, 60]);

    result.current.error();
    expect(vibrateMock).toHaveBeenCalledWith([60, 50, 60, 50, 100]);
  });
});

