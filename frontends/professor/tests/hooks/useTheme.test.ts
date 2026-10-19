import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';

describe('useTheme Hook Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('toggles mode between light and dark and persists in localStorage', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.mode).toBe('light');
    expect(result.current.isDark).toBe(false);

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(localStorage.getItem('quiz_theme_mode')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(localStorage.getItem('quiz_theme_mode')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies custom theme variables to document', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.applyCustomTheme({
        name: 'Cyber Neon',
        primaryColor: '#06B6D4',
        secondaryColor: '#EC4899',
        backgroundColor: '#0F172A',
        fontFamily: 'Poppins',
      });
    });

    expect(result.current.currentTheme.primaryColor).toBe('#06B6D4');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#06B6D4');
  });

  it('initializes with dark mode from localStorage', () => {
    localStorage.setItem('quiz_theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initializes with light mode from localStorage', () => {
    localStorage.setItem('quiz_theme_mode', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initializes with dark mode from system preference when no localStorage', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    window.matchMedia = originalMatchMedia;
  });
});

