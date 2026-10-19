import { QuizThemeConfig } from '../types/theme';

export interface ThemeCssVariables {
  '--color-primary': string;
  '--color-secondary': string;
  '--color-bg-custom': string;
  '--font-custom': string;
  [key: string]: string;
}

/**
 * Validates hex color code format (#RGB or #RRGGBB).
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex);
}

/**
 * Converts Hex string to RGB numbers.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

/**
 * Calculates relative luminance according to WCAG 2.1.
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Checks contrast ratio between text and background.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Compiles a QuizThemeConfig into CSS variables object.
 */
export function compileThemeVariables(theme: Partial<QuizThemeConfig>): ThemeCssVariables {
  const primary = isValidHexColor(theme.primaryColor || '') ? theme.primaryColor! : '#93C572';
  const secondary = isValidHexColor(theme.secondaryColor || '') ? theme.secondaryColor! : '#FF7518';
  const bg = isValidHexColor(theme.backgroundColor || '') ? theme.backgroundColor! : '#F7F9F6';
  const font = theme.fontFamily || 'Inter, sans-serif';

  const vars: ThemeCssVariables = {
    '--color-primary': primary,
    '--color-secondary': secondary,
    '--color-bg-custom': bg,
    '--font-custom': font,
  };

  if (theme.customCssVars) {
    for (const [key, value] of Object.entries(theme.customCssVars)) {
      vars[key] = value;
    }
  }

  return vars;
}

/**
 * Applies CSS variables directly to the document root element.
 */
export function applyThemeToDocument(theme: Partial<QuizThemeConfig>): void {
  if (typeof document === 'undefined') return;
  const vars = compileThemeVariables(theme);
  const root = document.documentElement;
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}

/**
 * Validates logo upload file constraints:
 * - Max size 2 MB (2 * 1024 * 1024 bytes)
 * - Supported MIME types: image/svg+xml, image/png, image/webp
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/svg+xml', 'image/png', 'image/webp'];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Logo file size exceeds the 2 MB limit' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only SVG, PNG, and WebP formats are supported' };
  }
  return { valid: true };
}

