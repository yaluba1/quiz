import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LobbyScreen } from '../../src/components/game/LobbyScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('LobbyScreen component', () => {
  it('renders session PIN, title, and player nickname avatar', () => {
    render(
      <I18nProvider>
        <LobbyScreen pin="987654" nickname="Samantha" quizTitle="History 101" />
      </I18nProvider>
    );

    expect(screen.getByText('PIN: 987654')).toBeInTheDocument();
    expect(screen.getByText('History 101')).toBeInTheDocument();
    expect(screen.getByText('Samantha')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument(); // avatar initial
    expect(screen.getByText(/You're in!/i)).toBeInTheDocument();
  });
});

