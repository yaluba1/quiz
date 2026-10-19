import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../src/components/common/ThemeToggle';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('ThemeToggle component', () => {
  it('renders theme toggle button and switches theme', () => {
    render(
      <I18nProvider>
        <ThemeToggle />
      </I18nProvider>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});

