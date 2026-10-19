import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakBadge } from '../../src/components/game/StreakBadge';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('StreakBadge component', () => {
  it('renders nothing when streak is less than 2', () => {
    const { container } = render(
      <I18nProvider>
        <StreakBadge streak={1} />
      </I18nProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders streak flame and multiplier when streak >= 2', () => {
    render(
      <I18nProvider>
        <StreakBadge streak={3} />
      </I18nProvider>
    );

    expect(screen.getByText(/3 streak!/i)).toBeInTheDocument();
  });
});

