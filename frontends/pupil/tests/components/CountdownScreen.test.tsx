import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CountdownScreen } from '../../src/components/game/CountdownScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('CountdownScreen component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial 5-second countdown', () => {
    render(
      <I18nProvider>
        <CountdownScreen initialSeconds={5} />
      </I18nProvider>
    );

    expect(screen.getByText('Get Ready!')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('ticks down and invokes onFinish', () => {
    const handleFinish = vi.fn();
    render(
      <I18nProvider>
        <CountdownScreen initialSeconds={5} onFinish={handleFinish} />
      </I18nProvider>
    );

    act(() => {
      vi.advanceTimersByTime(5500);
    });
    expect(handleFinish).toHaveBeenCalled();
  });
});
