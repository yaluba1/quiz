import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackScreen } from '../../src/components/game/FeedbackScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('FeedbackScreen component', () => {
  it('renders correct feedback state with points and streak', () => {
    render(
      <I18nProvider>
        <FeedbackScreen
          feedback={{
            isCorrect: true,
            pointsEarned: 950,
            streak: 3,
            responseTimeMs: 800,
            rank: 2,
          }}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('+950')).toBeInTheDocument();
    expect(screen.getByText(/3 streak!/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Rank: #2/i)).toBeInTheDocument();
  });

  it('renders incorrect feedback state', () => {
    render(
      <I18nProvider>
        <FeedbackScreen
          feedback={{
            isCorrect: false,
            pointsEarned: 0,
            streak: 0,
            responseTimeMs: 1500,
          }}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Incorrect!')).toBeInTheDocument();
    expect(screen.getByText('+0')).toBeInTheDocument();
  });
});

