import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PodiumCeremony } from '../../src/components/host/PodiumCeremony';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { PodiumEntry } from '../../src/types/socket';

const mockPodium: PodiumEntry[] = [
  { rank: 1, playerId: 'p1', nickname: 'FirstWinner', finalScore: 5000 },
  { rank: 2, playerId: 'p2', nickname: 'SecondWinner', finalScore: 4200 },
  { rank: 3, playerId: 'p3', nickname: 'ThirdWinner', finalScore: 3500 },
];

describe('PodiumCeremony Component Tests', () => {
  it('renders top 3 winners and triggers session finish', () => {
    const onEndSession = vi.fn();

    render(
      <I18nProvider>
        <PodiumCeremony podium={mockPodium} onEndSession={onEndSession} />
      </I18nProvider>
    );

    expect(screen.getByTestId('podium-ceremony')).toBeInTheDocument();
    expect(screen.getByTestId('podium-first')).toHaveTextContent('FirstWinner');
    expect(screen.getByTestId('podium-second')).toHaveTextContent('SecondWinner');
    expect(screen.getByTestId('podium-third')).toHaveTextContent('ThirdWinner');

    // Click End Session
    fireEvent.click(screen.getByTestId('finish-session-button'));
    expect(onEndSession).toHaveBeenCalled();
  });
});

