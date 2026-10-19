import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  compileThemeVariables,
  validateLogoFile,
  applyThemeToDocument,
} from '../../src/lib/theme-compiler';

describe('Theme Compiler Unit Tests', () => {
  it('validates hex colors correctly', () => {
    expect(isValidHexColor('#93C572')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(true);
    expect(isValidHexColor('#123456')).toBe(true);
    expect(isValidHexColor('red')).toBe(false);
    expect(isValidHexColor('#12')).toBe(false);
    expect(isValidHexColor('#1234567')).toBe(false);
  });

  it('converts hex to RGB', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('invalid')).toBeNull();
  });

  it('calculates luminance and contrast ratio', () => {
    const whiteLum = getRelativeLuminance('#FFFFFF');
    const blackLum = getRelativeLuminance('#000000');
    expect(whiteLum).toBeGreaterThan(blackLum);

    const contrast = getContrastRatio('#FFFFFF', '#000000');
    expect(contrast).toBeCloseTo(21, 0); // Pure B&W is 21:1
  });

  it('compiles theme variables with fallbacks', () => {
    const custom = compileThemeVariables({
      primaryColor: '#123456',
      secondaryColor: '#654321',
      backgroundColor: '#EEEEEE',
      fontFamily: 'Poppins',
      customCssVars: { '--extra-var': 'test' },
    });

    expect(custom['--color-primary']).toBe('#123456');
    expect(custom['--color-secondary']).toBe('#654321');
    expect(custom['--color-bg-custom']).toBe('#EEEEEE');
    expect(custom['--font-custom']).toBe('Poppins');
    expect(custom['--extra-var']).toBe('test');

    // Default fallback
    const defaults = compileThemeVariables({});
    expect(defaults['--color-primary']).toBe('#93C572');
    expect(defaults['--color-secondary']).toBe('#FF7518');
  });

  it('applies theme variables to document root', () => {
    applyThemeToDocument({ primaryColor: '#123456' });
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456');
  });

  it('validates logo file constraints', () => {
    // Valid SVG
    const validSvg = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });
    expect(validateLogoFile(validSvg).valid).toBe(true);

    // Valid PNG
    const validPng = new File(['png-data'], 'logo.png', { type: 'image/png' });
    expect(validateLogoFile(validPng).valid).toBe(true);

    // Invalid format (e.g. PDF or GIF)
    const invalidType = new File(['data'], 'logo.pdf', { type: 'application/pdf' });
    const resType = validateLogoFile(invalidType);
    expect(resType.valid).toBe(false);
    expect(resType.error).toContain('SVG, PNG, and WebP');

    // File too large (> 2MB)
    const largeContent = new Uint8Array(2.5 * 1024 * 1024);
    const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });
    const resSize = validateLogoFile(largeFile);
    expect(resSize.valid).toBe(false);
    expect(resSize.error).toContain('2 MB limit');
  });
});

