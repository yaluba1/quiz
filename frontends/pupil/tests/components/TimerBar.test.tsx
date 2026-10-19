import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TimerBar } from '../../src/components/game/TimerBar';

describe('TimerBar component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial timer value and updates percentage', () => {
    render(<TimerBar timeLimitSeconds={20} />);
    expect(screen.getByText('⏱ 20s')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText('⏱ 10s')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('triggers onTimeExpired when timer finishes', () => {
    const handleExpired = vi.fn();
    render(<TimerBar timeLimitSeconds={2} onTimeExpired={handleExpired} />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(handleExpired).toHaveBeenCalled();
  });
});

