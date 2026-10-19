import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '../../src/components/common/LanguageSelector';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('LanguageSelector component', () => {
  it('opens language dropdown and switches language', () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /English/i });
    fireEvent.click(toggleBtn);

    const esOption = screen.getByRole('button', { name: /Español/i });
    expect(esOption).toBeInTheDocument();

    fireEvent.click(esOption);
    expect(localStorage.getItem('quiz_locale')).toBe('es');
  });
});

