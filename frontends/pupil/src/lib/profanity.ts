const BANNED_PATTERNS = [
  /fuck/i,
  /shit/i,
  /bitch/i,
  /asshole/i,
  /cunt/i,
  /dick/i,
  /nigger/i,
  /nigga/i,
  /faggot/i,
  /whore/i,
  /slut/i,
  /pussy/i,
  /bastard/i,
  /hitler/i,
  /nazi/i,
];

export interface NicknameValidationResult {
  isValid: boolean;
  sanitized: string;
  errorMessage?: string;
}

export function validateNickname(raw: string): NicknameValidationResult {
  const sanitized = (raw || '').trim().replace(/\s+/g, ' ');

  if (!sanitized || sanitized.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      errorMessage: 'Nickname cannot be empty',
    };
  }

  if (sanitized.length > 50) {
    return {
      isValid: false,
      sanitized,
      errorMessage: 'Nickname must be at most 50 characters',
    };
  }

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitized,
        errorMessage: 'Nickname contains inappropriate words',
      };
    }
  }

  return {
    isValid: true,
    sanitized,
  };
}

