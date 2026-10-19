import { describe, it, expect, beforeEach } from 'vitest';
import { injectThemeVariables } from '../../src/lib/theme-injector';

describe('injectThemeVariables', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-secondary');
    document.documentElement.style.removeProperty('--color-bg');
    document.documentElement.style.removeProperty('--font-main');
  });

  it('resets to default brand colors when theme is null/undefined', () => {
    injectThemeVariables(null);
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#93C572');
    expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('#FF7518');
  });

  it('sets custom colors and font when theme is provided', () => {
    injectThemeVariables({
      primaryColor: '#123456',
      secondaryColor: '#654321',
      backgroundColor: '#EEEEEE',
      fontFamily: 'Comic Sans MS',
    });

    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456');
    expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('#654321');
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#EEEEEE');
    expect(document.documentElement.style.getPropertyValue('--font-main')).toBe('Comic Sans MS');
  });
});

