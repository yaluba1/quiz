import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PodiumScreen } from '../../src/components/game/PodiumScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

const mockPodium = [
  { rank: 1 as const, playerId: 'p1', nickname: 'Alice', finalScore: 3200 },
  { rank: 2 as const, playerId: 'p2', nickname: 'Bob', finalScore: 2800 },
  { rank: 3 as const, playerId: 'p3', nickname: 'Charlie', finalScore: 2400 },
];

describe('PodiumScreen component', () => {
  it('renders top 3 podium entries and handles play again action', () => {
    const handleReset = vi.fn();
    render(
      <I18nProvider>
        <PodiumScreen
          podium={mockPodium}
          currentPlayerId="p2"
          onReset={handleReset}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Final Podium')).toBeInTheDocument();
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    expect(screen.getByText('3200 pts')).toBeInTheDocument();

    const playAgainBtn = screen.getByRole('button', { name: /Play Another Game/i });
    fireEvent.click(playAgainBtn);
    expect(handleReset).toHaveBeenCalled();
  });
});

