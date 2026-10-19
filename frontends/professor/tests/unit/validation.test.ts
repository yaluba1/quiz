import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateQuestion,
  validateQuizMetadata,
  VALID_TIME_LIMITS,
  VALID_POINTS_MULTIPLIERS,
} from '../../src/lib/validation';
import { Question } from '../../src/types/quiz';

describe('Validation Unit Tests', () => {
  it('validates email correctly', () => {
    expect(validateEmail('professor@example.com')).toBe(true);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
  });

  it('validates password minimum length', () => {
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('short')).toBe(false);
  });

  it('validates quiz metadata', () => {
    expect(validateQuizMetadata({ title: 'Valid Quiz' })).toEqual([]);

    const emptyErrors = validateQuizMetadata({ title: '' });
    expect(emptyErrors.length).toBeGreaterThan(0);
    expect(emptyErrors[0].field).toBe('title');

    const durationErrors = validateQuizMetadata({ title: 'Test', sessionDurationMinutes: -5 });
    expect(durationErrors.some((e) => e.field === 'sessionDurationMinutes')).toBe(true);
  });

  it('validates multiple choice questions', () => {
    const validQuestion: Partial<Question> = {
      questionText: 'What is photosynthesis?',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 20,
      pointsMultiplier: '1.00',
      answerOptions: [
        { orderIndex: 0, optionText: 'Option 1', isCorrect: true },
        { orderIndex: 1, optionText: 'Option 2', isCorrect: false },
        { orderIndex: 2, optionText: 'Option 3', isCorrect: false },
        { orderIndex: 3, optionText: 'Option 4', isCorrect: false },
      ],
    };
    expect(validateQuestion(validQuestion)).toEqual([]);

    // Too few options
    const tooFew = {
      ...validQuestion,
      answerOptions: [{ orderIndex: 0, optionText: 'One', isCorrect: true }],
    };
    expect(validateQuestion(tooFew).some((e) => e.field === 'answerOptions')).toBe(true);

    // No correct option
    const noCorrect = {
      ...validQuestion,
      answerOptions: [
        { orderIndex: 0, optionText: 'A', isCorrect: false },
        { orderIndex: 1, optionText: 'B', isCorrect: false },
      ],
    };
    expect(validateQuestion(noCorrect).some((e) => e.field === 'answerOptions')).toBe(true);

    // Empty text
    const emptyText = {
      ...validQuestion,
      questionText: 'Hi',
    };
    expect(validateQuestion(emptyText).some((e) => e.field === 'questionText')).toBe(true);

    // Invalid time limit
    const invalidTime = {
      ...validQuestion,
      timeLimitSeconds: 999,
    };
    expect(validateQuestion(invalidTime).some((e) => e.field === 'timeLimitSeconds')).toBe(true);
  });

  it('validates True/False questions', () => {
    const validTF: Partial<Question> = {
      questionText: 'Water boils at 100 degrees Celsius.',
      questionType: 'TRUE_FALSE',
      timeLimitSeconds: 10,
      pointsMultiplier: '1.00',
      answerOptions: [
        { orderIndex: 0, optionText: 'True', isCorrect: true },
        { orderIndex: 1, optionText: 'False', isCorrect: false },
      ],
    };
    expect(validateQuestion(validTF)).toEqual([]);

    // 3 options in true/false is invalid
    const invalidTF = {
      ...validTF,
      answerOptions: [
        { orderIndex: 0, optionText: 'True', isCorrect: true },
        { orderIndex: 1, optionText: 'False', isCorrect: false },
        { orderIndex: 2, optionText: 'Maybe', isCorrect: false },
      ],
    };
    expect(validateQuestion(invalidTF).some((e) => e.field === 'answerOptions')).toBe(true);
  });
});

