import { ThemeMeta } from '../types/theme';

export function injectThemeVariables(theme?: ThemeMeta | null): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (!theme) {
    // Reset to brand defaults
    root.style.setProperty('--color-primary', '#93C572');
    root.style.setProperty('--color-secondary', '#FF7518');
    root.style.removeProperty('--color-bg');
    root.style.removeProperty('--font-main');
    return;
  }

  if (theme.primaryColor) {
    root.style.setProperty('--color-primary', theme.primaryColor);
  }
  if (theme.secondaryColor) {
    root.style.setProperty('--color-secondary', theme.secondaryColor);
  }
  if (theme.backgroundColor) {
    root.style.setProperty('--color-bg', theme.backgroundColor);
  }
  if (theme.fontFamily) {
    root.style.setProperty('--font-main', theme.fontFamily);
  }
}

