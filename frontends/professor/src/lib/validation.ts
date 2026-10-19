import { Question, AnswerOption } from '../types/quiz';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export const VALID_TIME_LIMITS = [5, 10, 20, 30, 60, 120];
export const VALID_POINTS_MULTIPLIERS = ['0.00', '1.00', '2.00'];

export function validateQuestion(question: Partial<Question>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!question.questionText || question.questionText.trim().length < 3) {
    errors.push({ field: 'questionText', message: 'Question text must be at least 3 characters' });
  }

  if (question.timeLimitSeconds && !VALID_TIME_LIMITS.includes(question.timeLimitSeconds)) {
    errors.push({ field: 'timeLimitSeconds', message: 'Invalid time limit' });
  }

  if (question.pointsMultiplier && !VALID_POINTS_MULTIPLIERS.includes(question.pointsMultiplier)) {
    errors.push({ field: 'pointsMultiplier', message: 'Invalid scoring multiplier' });
  }

  const options = question.answerOptions || [];
  if (question.questionType === 'TRUE_FALSE') {
    if (options.length !== 2) {
      errors.push({ field: 'answerOptions', message: 'True/False questions must have exactly 2 options' });
    }
  } else {
    // MULTIPLE_CHOICE
    if (options.length < 2 || options.length > 6) {
      errors.push({ field: 'answerOptions', message: 'Multiple choice questions must have between 2 and 6 options' });
    }
  }

  const hasEmptyOption = options.some((opt) => !opt.optionText || opt.optionText.trim().length === 0);
  if (hasEmptyOption) {
    errors.push({ field: 'answerOptions', message: 'All answer options must contain text' });
  }

  const hasCorrect = options.some((opt) => opt.isCorrect);
  if (!hasCorrect) {
    errors.push({ field: 'answerOptions', message: 'At least one option must be marked as correct' });
  }

  return errors;
}

export function validateQuizMetadata(quiz: { title?: string; sessionDurationMinutes?: number }): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!quiz.title || quiz.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Quiz title is required' });
  } else if (quiz.title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Quiz title must be 200 characters or less' });
  }

  if (quiz.sessionDurationMinutes !== undefined && quiz.sessionDurationMinutes <= 0) {
    errors.push({ field: 'sessionDurationMinutes', message: 'Duration must be greater than 0' });
  }

  return errors;
}

