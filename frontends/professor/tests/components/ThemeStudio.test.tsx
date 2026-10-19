import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeStudio } from '../../src/components/theme/ThemeStudio';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('ThemeStudio Component Tests', () => {
  it('allows picking colors, selecting presets, and saving theme', async () => {
    const onSave = vi.fn();

    render(
      <I18nProvider>
        <ThemeStudio onSave={onSave} />
      </I18nProvider>
    );

    expect(screen.getByTestId('theme-studio')).toBeInTheDocument();
    expect(screen.getByTestId('color-palette-picker')).toBeInTheDocument();
    expect(screen.getByTestId('theme-live-preview')).toBeInTheDocument();

    // Select preset Cyber Neon
    const cyberPreset = screen.getByTestId('preset-card-cyber-neon');
    fireEvent.click(cyberPreset);

    // Change primary color
    const primaryInput = screen.getByTestId('primary-color-input');
    fireEvent.change(primaryInput, { target: { value: '#123456' } });

    // Click Save
    const saveButton = screen.getByTestId('save-theme-button');
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalled();
  });
});

