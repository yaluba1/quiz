export interface QuizThemeConfig {
  id?: string;
  professorId?: string | null;
  name: string;
  isSystemPreset?: boolean;
  primaryColor: string; // e.g. #93C572 (Pistachio Green)
  secondaryColor: string; // e.g. #FF7518 (Pumpkin Orange)
  backgroundColor: string; // e.g. #F7F9F6 (Light) or #121811 (Dark)
  fontFamily: string; // 'Inter' | 'Poppins' | 'Fredoka' | 'Lexend'
  logoUrl?: string | null;
  customCssVars?: Record<string, string>;
  createdAt?: string;
}

export const DEFAULT_THEME: QuizThemeConfig = {
  name: 'Default Pistachio & Pumpkin',
  primaryColor: '#93C572',
  secondaryColor: '#FF7518',
  backgroundColor: '#F7F9F6',
  fontFamily: 'Inter',
  logoUrl: null,
};

